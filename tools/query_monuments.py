#!./venv/bin/python

import os
import json
import psycopg2
import click

from geojson import FeatureCollection, GeometryCollection, Feature, Point
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
except Exception as e:
    print(e)


def get_monumet(cur, object_id):
    sql = '''
    WITH monument_reasons AS (
        SELECT
            mxr.monument_id,
            string_agg(mr.label, ', ') AS reason_labels
        FROM
            sh_monument_x_reason AS mxr
        JOIN
            sh_monument_reason AS mr
        ON
            mxr.reason_id = mr.id
        GROUP BY
            mxr.monument_id
    )
    SELECT
        ST_AsGeoJSON(m.wkb_geometry, 15)::jsonb AS geojson,
        m.object_id,
        m.street,
        m.housenumber,
        m.postcode,
        m.city,
        m.image_url,
        m.designation,
        m.description,
        m.monument_type,
        r.reason_labels AS monument_reason
    FROM
        sh_monument AS m
    LEFT JOIN
        monument_reasons AS r
    ON
        m.id = r.monument_id
    WHERE
        m.id = %s
    '''

    cur.execute(sql, (object_id,))
    rows = cur.fetchall()

    return rows


@click.command()
@click.argument('object_id')
def main(object_id):
    cur = conn.cursor()

    rows = get_monumet(cur, object_id)

    if len(rows) > 0:
        print(rows)


if __name__ == '__main__':
    main()
