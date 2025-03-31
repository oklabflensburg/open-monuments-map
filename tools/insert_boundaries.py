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

    # Ensure `last_update` is a correct ISO date
    try:
        # Attempt to parse as ISO format
        last_update = datetime.fromisoformat(last_update).isoformat()
    except ValueError:
        try:
            # Attempt to parse common non-ISO formats (e.g., DD.MM.YYYY)
            last_update = datetime.strptime(last_update, "%d.%m.%Y").isoformat()
        except ValueError:
            print(f"Invalid date format for 'Stand': {last_update}. Skipping entry.")

    transformer = Transformer.from_crs(
        "EPSG:25832", "EPSG:4326", always_xy=True)

    # Convert input geometry to a Shapely object
    g = MultiPolygon(shape(geometry))

    # Apply transformation
    g_transformed = transform(transformer.transform, g)

    # Convert transformed geometry to WKB with EPSG:4326
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
    slug = string

    tpl = (('ü', 'ue'), ('Ü', 'Ue'), ('ä', 'ae'),
           ('Ä', 'Ae'), ('ö', 'oe'), ('Ö', 'Oe'), ('ß', 'ss'))

    for item1, item2 in tpl:
        slug = slug.replace(item1, item2)

    return slug


def get_slug(designation, street, housenumber, municipality):
    title = re.sub(
        r'[\d\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', designation) if designation else ''
    municipality_parsed = re.sub(
        r'[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', municipality) if municipality else ''
    street_parsed = re.sub(
        r'[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', street) if street else ''

    slug = f'{title} {street_parsed} {housenumber} {municipality_parsed}'.lower().strip()
    slug = re.sub(r'\s+', ' ', replace_umlauts(slug)).replace(' ', '-')
    slug = slug.replace('--', '-')

    return slug


def get_location_from_nominatim(lat, lon):
    url = 'https://nominatim.oklabflensburg.de/reverse'
    params = {
        'lat': lat,
        'lon': lon,
        'format': 'json',
        'addressdetails': 1
    }
    try:
        with httpx.Client() as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        address = data.get('address', None)

        if address is not None:
            postcode = address.get('postcode', None)
            city = address.get('city', None) or address.get(
                'town', None) or address.get(
                    'village', None) or address.get('hamlet', None)
            if city is None:
                city = address.get('municipality', None)

            return postcode, city

        return None, None
    except httpx.RequestError as e:
        print(f'Error querying Nominatim for ({lat}, {lon}): {e}')
        return None, None
    except httpx.HTTPStatusError as e:
        print(f'HTTP error querying Nominatim for ({lat}, {lon}): {e}')
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

    # Add columns for postcode, city, and slug
    cur.execute(
        'ALTER TABLE public.sh_monument_boundary_processed '
        'ADD COLUMN postcode TEXT, '
        'ADD COLUMN city TEXT, '
        'ADD COLUMN slug TEXT;')

    # Retrieve rows and process them in parallel
    cur.execute(
        'SELECT id, monument_function, street, housenumber, municipality, ST_X(polygon_center), ST_Y(polygon_center) FROM public.sh_monument_boundary_processed;')
    rows = cur.fetchall()

    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        pool.map(process_row, rows)


def process_row(row):
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

        monument_id, monument_function, street, housenumber, municipality, lon, lat = row

        # Retrieve postcode and city from Nominatim using the centroid coordinates
        postcode, city = get_location_from_nominatim(lat, lon)
        if postcode or city:
            cur.execute(
                "UPDATE public.sh_monument_boundary_processed SET postcode = %s, city = %s WHERE id = %s;",
                (postcode, city, monument_id)
            )
            print(f"Updated monument ID {monument_id} with postcode {postcode} and city {city}")

        # Generate the slug using the get_slug function
        if city is None:
            city = f'gemeinde-{municipality}'.replace(', Stadt', '')
        slug = get_slug(monument_function, street, housenumber, city)

        cur.execute(
            "UPDATE public.sh_monument_boundary_processed SET slug = %s WHERE id = %s;",
            (slug, monument_id)
        )
        print(f"Updated monument ID {monument_id} with slug: {slug}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error processing row ID {row[0]}: {e}")


if __name__ == '__main__':
    main()
