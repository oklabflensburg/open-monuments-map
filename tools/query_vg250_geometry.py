#!./venv/bin/python

import os
import json
import psycopg2
import click

from geojson import FeatureCollection, GeometryCollection, MultiPolygon, Polygon, Feature
from dotenv import load_dotenv
from pathlib import Path


env_path = Path('..')/'.env'
load_dotenv(dotenv_path=env_path)


try:
    conn = psycopg2.connect(
        database = os.getenv('DB_NAME'),
        password = os.getenv('DB_PASS'),
        user = os.getenv('DB_USER'),
        host = os.getenv('DB_HOST'),
        port = os.getenv('DB_PORT')
    )
except Exception as e:
    print(e)


def get_boundaries(cur, gen):
    sql = """
        SELECT ST_ASGeoJson(ST_Buffer(ST_GeogFromWKB(
            wkb_geometry), 350, 'endcap=round join=round')
        ) as geojson FROM vg250gem WHERE LOWER(gen) = %s
    """

    boundaries = []

    cur.execute(sql, (gen.lower(),))
    rows = cur.fetchall()

    return rows


@click.command()
@click.argument('gen')
def main(gen):
    cur = conn.cursor()

    fc = []

    crs = {
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
    }

    boundaries = get_boundaries(cur, gen)
    properties = {'gen': gen}

    for boundary in boundaries:
        row = json.loads(boundary[0])
        coordinates = row['coordinates']

        if row['type'].lower() == 'polygon':
            shape = Polygon(coordinates)
        elif row['type'].lower() == 'multipolygon':
            shape = MultiPolygon(coordinates)

        fc.append(Feature(geometry=shape, properties=properties))

    c = FeatureCollection(fc, crs=crs)
    print(c)


if __name__ == '__main__':
    main()
