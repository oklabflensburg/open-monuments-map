#!./venv/bin/python

import os
import json
import psycopg2

from geojson import FeatureCollection, MultiPolygon, Feature
from os.path import join, dirname
from dotenv import load_dotenv


dotenv_path = join(f'{dirname(__file__)}', '.env')
load_dotenv(dotenv_path)  

    
conn = psycopg2.connect(    
    database = os.getenv('DB_NAME'),
    password = os.getenv('DB_PASS'),
    user = os.getenv('DB_USER'),
    host = os.getenv('DB_HOST'),
    port = os.getenv('DB_PORT')
)


def get_boundaries(cur, objektid):
    sql = 'SELECT ST_AsGeoJson(wkb_geometry) as geom FROM monument_boundaries WHERE objektid = %s'

    multipolygon = []
    cur.execute(sql, (objektid,))
    row = cur.fetchone()

    if row is not None:
        multipolygon = json.loads(row[0])['coordinates']

    return multipolygon


def main():
    cur = conn.cursor()

    fc = []

    crs = {
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
    }

    for o in d:
        multipolygon = MultiPolygon(get_boundaries(cur, o['object']))

        fc.append(Feature(GeometryCollection([point, multipolygon]), properties=properties))

    c = FeatureCollection(fc, crs=crs)


if __name__ == '__main__':
    main()
