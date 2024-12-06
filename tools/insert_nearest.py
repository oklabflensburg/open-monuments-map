#!./venv/bin/python

import os
import re
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



def insert_nearest(cur, relation_id, monument_id):
    reason_sql = 'INSERT INTO sh_monument_nearest (relation_id, monument_id) VALUES (%s, %s)'

    try:
        cur.execute(reason_sql, (relation_id, monument_id))
    except UniqueViolation as e:
        print(e)


def main():
    cur = conn.cursor()
    rows = get_monuments(cur)

    for row in rows:
        get_distance(cur, row[0], row[1], row[2])


def get_monuments(cur):
    sql = 'SELECT id, ST_X(wkb_geometry) AS lat, ST_Y(wkb_geometry) AS lng FROM sh_monuments'

    cur.execute(sql)
    rows = cur.fetchall()

    return rows


def get_distance(cur, relation_id, lat, lng):
    sql = 'SELECT id, wkb_geometry <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326) AS dist FROM sh_monuments ORDER BY dist LIMIT 7'

    cur.execute(sql, (lat, lng))
    rows = cur.fetchall()

    for row in rows:
        print(row)
        insert_nearest(cur, relation_id, row[0])


def main():
    cur = conn.cursor()
    rows = get_monuments(cur)

    for row in rows:
        get_distance(cur, row[0], row[1], row[2])


if __name__ == '__main__':
    main()
