import os
import re
import httpx
import click
import psycopg2
import json
import multiprocessing
from datetime import datetime

from shapely import wkb
from shapely.ops import transform
from pyproj import Transformer
from psycopg2.errors import UniqueViolation
from shapely.geometry import shape, MultiPolygon
from dotenv import load_dotenv
from pathlib import Path


env_path = Path('../.env')
load_dotenv(dotenv_path=env_path)


try:
    conn = psycopg2.connect(
        database=os.getenv('DB_NAME'),
        password=os.getenv('DB_PASS'),
        user=os.getenv('DB_USER'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT')
    )
    conn.autocommit = True
except Exception as e:
    raise e


@click.command()
@click.argument('file')
def main(file):
    cur = conn.cursor()

    with open(Path(file), 'r') as f:
        features = json.loads(f.read())['features']

    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        pool.map(process_feature, features)

    create_processed_table(cur)


def process_feature(feature):
    try:
        conn = psycopg2.connect(
            database=os.getenv('DB_NAME'),
            password=os.getenv('DB_PASS'),
            user=os.getenv('DB_USER'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        conn.autocommit = True
        cur = conn.cursor()

        properties = feature['properties']
        insert_object(cur, properties, feature['geometry'])

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error processing feature: {e}")


def retrieve_geometries(cur, features):
    for feature in features:
        properties = feature['properties']

        insert_object(cur, properties, feature['geometry'])


def insert_object(cur, properties, geometry):
    layer_name = properties['LayerName']
    district = properties['Kreis']
    municipality = properties['Gemeinde']
    street = properties['Strasse']
    housenumber = properties['Hausnummer']
    description = properties['Ansprache']
    monument_type = properties['Art']
    monument_function = properties['Funktion']
    object_number = properties['ObjNummer']
    photo_link = properties['FotoURL']
    detail_link = properties['Details']
    last_update = properties['Stand']

    try:
        last_update = datetime.fromisoformat(last_update).isoformat()
    except ValueError:
        try:
            last_update = datetime.strptime(
                last_update, "%d.%m.%Y").isoformat()
        except ValueError:
            print(
                f"Invalid date format for 'Stand': {last_update}. Skipping entry.")

    transformer = Transformer.from_crs(
        "EPSG:25832", "EPSG:4326", always_xy=True)

    g = MultiPolygon(shape(geometry))

    g_transformed = transform(transformer.transform, g)

    wkb_geometry = wkb.dumps(g_transformed, hex=True, srid=4326)

    sql = '''
        INSERT INTO sh_monument_boundary (
            layer_name, district, municipality, street, housenumber,
            description, monument_type, monument_function, object_number,
            photo_link, detail_link, last_update, wkb_geometry)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    '''

    try:
        cur.execute(sql, (
            layer_name, district, municipality, street, housenumber,
            description, monument_type, monument_function, object_number,
            photo_link, detail_link, last_update, wkb_geometry))
        monument_id = cur.fetchone()[0]
        print(f'Inserted monument with ID: {monument_id}')
    except UniqueViolation as e:
        print(e)
        return


def replace_umlauts(string):
    umlaut_map = {
        'ü': 'ue', 'Ü': 'Ue', 'ä': 'ae', 'Ä': 'Ae',
        'ö': 'oe', 'Ö': 'Oe', 'ß': 'ss'
    }
    for umlaut, replacement in umlaut_map.items():
        string = string.replace(umlaut, replacement)
    return string


def get_slug(designation, description, street, housenumber, city):
    def clean_text(text):
        pattern = r'[\'"\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]'

        return re.sub(pattern, ' ', text).strip() if text else ''

    title = clean_text(designation)
    detail = clean_text(description)
    street_parsed = clean_text(street)
    city_parsed = clean_text(city)

    slug = ' '.join(filter(None, [
        title,
        detail,
        street_parsed,
        housenumber,
        city_parsed])).lower()

    slug = replace_umlauts(slug)
    slug = re.sub(r'\s+', '-', slug).strip('-')
    slug = re.sub(r'-{2,}', '-', slug)

    return slug


def get_location_from_nominatim(lat, lon):
    url = 'https://nominatim.oklabflensburg.de/reverse'
    params = {'lat': lat, 'lon': lon, 'format': 'json', 'addressdetails': 1}

    try:
        with httpx.Client() as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        address = data.get('address')
        if not address:
            return None, None

        city = (
            address.get('city') or
            address.get('town') or
            address.get('village') or
            address.get('hamlet') or
            address.get('municipality')
        )
        postcode = address.get('postcode')

        return postcode, city
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        print(f"Error querying Nominatim for ({lat}, {lon}): {e}")
        return None, None


def create_processed_table(cur):
    sql = '''
    DROP TABLE IF EXISTS public.sh_monument_boundary_processed;

    CREATE TABLE public.sh_monument_boundary_processed AS 
    WITH polygons AS (
        SELECT 
            b.id,
            b.layer_name,
            b.district,
            b.municipality,
            b.street,
            b.housenumber,
            b.description,
            b.monument_type,
            b.monument_function,
            b.object_number,
            b.photo_link,
            b.detail_link,
            b.last_update,
            ST_Transform((ST_Dump(b.wkb_geometry)).geom, 4326) AS polygon_geom
        FROM public.sh_monument_boundary b
    )
    SELECT 
        p.*,
        ST_PointOnSurface(p.polygon_geom) AS polygon_center
    FROM polygons p;
    '''
    cur.execute(sql)
    print('Created table `sh_monument_boundary_processed`')

    cur.execute(
        'ALTER TABLE public.sh_monument_boundary_processed '
        'ADD COLUMN postcode TEXT, '
        'ADD COLUMN city TEXT, '
        'ADD COLUMN slug TEXT;')

    cur.execute(
        'SELECT id, monument_function, monument_type, street, housenumber, municipality, ST_X(polygon_center), ST_Y(polygon_center) FROM public.sh_monument_boundary_processed;')
    rows = cur.fetchall()

    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        pool.map(process_row, rows)


def process_row(row):
    monument_id, monument_function, monument_type, street, housenumber, municipality, lon, lat = row

    try:
        with psycopg2.connect(
            database=os.getenv('DB_NAME'),
            password=os.getenv('DB_PASS'),
            user=os.getenv('DB_USER'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        ) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                postcode, city = get_location_from_nominatim(lat, lon)

                if postcode or city:
                    cur.execute(
                        "UPDATE public.sh_monument_boundary_processed SET postcode = %s, city = %s WHERE id = %s;",
                        (postcode, city, monument_id)
                    )
                    print(
                        f"Updated monument ID {monument_id} with postcode {postcode} and city {city}")

                city = city or f'gemeinde-{municipality}'.replace(
                    ', Stadt', '')

                slug = get_slug(
                    monument_type, monument_function, street, housenumber, city
                )

                slug = f'{slug}-i{monument_id}'

                cur.execute(
                    "UPDATE public.sh_monument_boundary_processed SET slug = %s WHERE id = %s;",
                    (slug, monument_id)
                )
                print(f"Updated monument ID {monument_id} with slug: {slug}")
    except Exception as e:
        print(f"Error processing row ID {monument_id}: {e}")


if __name__ == '__main__':
    main()
