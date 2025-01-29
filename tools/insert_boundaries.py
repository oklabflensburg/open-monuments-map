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


env_path = Path('../.env')
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
    print(e)


def parse_features(cur, features):
    for feature in features:
        insert_row(cur, feature['properties'], feature['geometry'])


def insert_row(cur, properties, geometry):
    object_id = int(properties['objektid'])
    category_id = int(properties['kat'])
    category = properties['kategorie']
    district_code = properties['kreis_kue']
    monument_value = properties['denkmalwer']
    monument_listed = properties['denkmallis']
    classification = properties['einstufung']
    classification_code = properties['einst']
    
    if geometry['type'].lower() == 'polygon':
        g = Polygon(shape(geometry))
    elif geometry['type'].lower() == 'multipolygon':
        g = MultiPolygon(shape(geometry))

    wkb_geometry = wkb.dumps(g, hex=True, srid=4326)

    sql = '''
        INSERT INTO sh_monument_boundary (object_id, category_id, category,
        district_code, monument_value, monument_listed, classification,
        classification_code, wkb_geometry) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    '''

    try:
        cur.execute(sql, (object_id, category_id, category, district_code, monument_value,
            monument_listed, classification, classification_code, wkb_geometry))
    except UniqueViolation as e:
        print(e)


@click.command()
@click.argument('file')
def main(file):
    cur = conn.cursor()

    with open(Path(file), 'r') as f:
        features = json.loads(f.read())['features']

    parse_features(cur, features)


if __name__ == '__main__':
    main()
