#!./venv/bin/python

import os
import json
import psycopg2
import click

from geojson import FeatureCollection, GeometryCollection, Feature, Point
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


def get_monumets(cur, gen):
    sql = """
        SELECT json_build_object(
            'properties', json_build_object(
                'object_id', m.object_id,
                'place_name', m.place_name,
                'address', m.address,
                'postal_code', m.postal_code,
                'image_url', m.image_url,
                'designation', m.designation,
                'description', m.description,
                'monument_type', m.monument_type,
                'reasons', string_agg(mr.label, ', ')
            ), 'geometry', ST_ASGeoJson(ST_GeomFromEWKB(m.geometry))
        )
        FROM
            monuments AS m
        LEFT JOIN
            monument_x_reason AS mxr ON mxr.monument_id = m.id
        LEFT JOIN
            monument_reason AS mr ON mxr.reason_id = mr.id
        JOIN
            vg250 AS v ON ST_Within(ST_GeomFromEWKB(m.geometry),
            ST_GeomFromEWKB(v.wkb_geometry)) AND LOWER(v.gen) = %s
        GROUP BY
            m.object_id,
            m.place_name,
            m.address,
            m.postal_code,
            m.image_url,
            m.designation,
            m.description,
            m.monument_type,
            mxr.monument_id,
            m.geometry
    """

    monuments = []

    cur.execute(sql, (gen,))
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

    monuments = get_monumets(cur, gen.lower())

    for monument in monuments:
        row = monument[0]
        print(row)
        properties = row['properties']
        geometry = json.loads(row['geometry'])
        print(geometry)
        shape = Point(geometry['coordinates'])
        fc.append(Feature(geometry=shape, properties=properties))

    c = FeatureCollection(fc, crs=crs)
    print(c)


if __name__ == '__main__':
    main()
