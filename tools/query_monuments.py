#!./venv/bin/python

import os
import json
import psycopg2
import click

from geojson import FeatureCollection, GeometryCollection, Feature, Point
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


def get_monumets(cur, gen):
    sql = """
    SELECT
        json_build_object(
            'type', 'FeatureCollection',
            'crs', json_build_object(
                'type', 'name',
                'properties', json_build_object(
                    'name', 'urn:ogc:def:crs:OGC:1.3:CRS84'
                )
            ),
            'features', json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(m.wkb_geometry)::json,
                    'properties', json_build_object(
                        'object_id', m.object_id,
                        'place_name', m.place_name,
                        'address', m.address,
                        'postal_code', m.postal_code,
                        'image_url', m.image_url,
                        'designation', m.designation,
                        'description', m.description,
                        'monument_type', m.monument_type,
                        'reasons', (
                            SELECT string_agg(mr.label, ', ')
                            FROM monument_reason AS mr
                            WHERE mxr.monument_id = m.id
                        )
                    )
                )
            )
        )
    FROM monuments AS m
    JOIN monument_x_reason AS mxr ON mxr.monument_id = m.id
    JOIN monument_reason AS mr ON mxr.reason_id = mr.id
    JOIN vg250gem AS v ON ST_Within(ST_GeomFromEWKB(m.wkb_geometry), ST_GeomFromEWKB(v.wkb_geometry))
    WHERE LOWER(v.gen) = %s
    """

    monuments = []

    cur.execute(sql, (gen,))
    rows = cur.fetchall()

    return rows


@click.command()
@click.argument('gen')
def main(gen):
    cur = conn.cursor()

    monuments = get_monumets(cur, gen.lower())

    with open(f'{gen}.geojson', 'w') as f:
        json.dump(monuments[0][0], f)


if __name__ == '__main__':
    main()
