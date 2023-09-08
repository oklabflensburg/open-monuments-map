#!./venv/bin/python

import os
import click
import psycopg2
import json

from shapely import wkb
from psycopg2 import ProgrammingError
from psycopg2.errors import UniqueViolation, NotNullViolation
from shapely.geometry import shape, Point, Polygon, MultiPolygon
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
    conn.autocommit = True
except Exception as e:
    raise


@click.command()
@click.argument('file')
def main(file):
    cur = conn.cursor()

    with open(Path(file), 'r') as f:
        features = json.loads(f.read())['features']

    retrieve_geometries(cur, features)


def retrieve_geometries(cur, features):
    for feature in features:
        properties = feature['properties']

        insert_object(cur, properties, feature['geometry'])


def insert_reason(cur, monument_id, reason_label):
    reason_sql = 'INSERT INTO monument_reason (label) VALUES (%s) RETURNING id'

    try:
        cur.execute(reason_sql, (reason_label,))
    except UniqueViolation as e:
        query_reason_sql = 'SELECT id FROM monument_reason WHERE label = %s'
        cur.execute(query_reason_sql, (reason_label,))

    reason_id = cur.fetchone()[0]

    monument_x_reason_sql = 'INSERT INTO monument_x_reason (monument_id, reason_id) VALUES (%s, %s) ON CONFLICT DO NOTHING'

    try:
        cur.execute(monument_x_reason_sql, (monument_id, reason_id))
    except NotNullViolation as e:
        pass


def insert_object(cur, properties, geometry):
    object_id = properties['object_id']
    monument_type = properties['type']
    administrative = properties['authority']
    description = properties['description']
    designation = properties['designation']
    postal_code = properties['postal_code']
    place_name = properties['district']
    address = properties['address']
    reasons = properties['reasons']
    image_url = properties['url']
    scope = properties['scope']

    g = Point(shape(geometry))
    wkb_geometry = wkb.dumps(g, hex=True, srid=4326)

    sql = '''
        INSERT INTO monuments (object_id, monument_type, administrative, place_name, image_url, 
        description, designation, postal_code, address, geometry)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING RETURNING id
    '''

    try:
        cur.execute(sql, (object_id, monument_type, administrative, place_name,
            image_url, description, designation, postal_code, address, wkb_geometry))
        monument_id = cur.fetchone()[0]
    except UniqueViolation as e:
        return

    for reason in reasons:
        insert_reason(cur, monument_id, reason)


if __name__ == '__main__':
    main()
