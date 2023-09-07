#!./venv/bin/python

import os
import click
import psycopg2
import json

from shapely import wkb
from psycopg2.errors import UniqueViolation
from shapely.geometry import shape, Polygon, MultiPolygon
from dotenv import load_dotenv
from pathlib import Path


env_path = Path('.')/'.env'
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


@click.command()
@click.argument('file')
def main(file):
    cur = conn.cursor()

    with open(Path(file), 'r') as f:
        features = json.loads(f.read())['features']

    retrieve_geometries(cur, features)


def retrieve_geometries(cur, features):
    for feature in features:
        object_id = int(feature['properties']['objektid'])

        insert_object(cur, object_id, feature['geometry'])


def insert_object(cur, object_id, geometry):
    print(geometry)
    print(object_id)
    
    if geometry['type'].lower() == 'polygon':
        g = Polygon(shape(geometry))
    elif geometry['type'].lower() == 'multipolygon':
        g = MultiPolygon(shape(geometry))

    wkb_geometry = wkb.dumps(g, hex=True, srid=4326)
    sql = 'INSERT INTO monument_boundary (object_id, geometry) VALUES (%s, %s)'

    try:
        cur.execute(sql, (object_id, wkb_geometry))
    except UniqueViolation as e:
        print(e)

    conn.commit()


if __name__ == '__main__':
    main()
