#!./venv/bin/python

import os
import json
import psycopg2
import click
import httpx
from dotenv import load_dotenv
from pathlib import Path


data_directory = Path('../data')
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
except Exception:
    raise


def request_json(url, data_directory):
    file_object = dict()

    filename = ''.join(url.split('/')[-1].split('.')[:-1])
    extension = url.split('/')[-1].split('.')[-1]
    target = f'{data_directory}/{filename}.{extension}'

    file_object.update({
        'name': filename,
        'extension': extension,
        'target': target
    })

    r = httpx.get(url, timeout=20)

    with open(file_object['target'], 'wb') as f:
        f.write(r.content)

    return file_object


def get_data(filename):
    with open(filename, 'r') as f:
        d = json.loads(f.read())

    return d


def insert_object(cur, data):
    print(data)

    # Extract values directly from data dictionary
    address_location = data.get('Adresse-Lage', None)
    description = data.get('Beschreibung', None)
    designation = data.get('Bezeichnung', None)
    monument_type = data.get('Kulturdenkmaltyp', None)
    
    protection_scope = data.get('Schutzumfang', None)
    if isinstance(protection_scope, list):
        protection_scope = json.dumps(protection_scope)
    
    municipality = data.get('Gemeinde', None)
    
    justification = data.get('Begründung', None)
    if isinstance(justification, list):
        justification = json.dumps(justification)
    
    object_number = data.get('Objektnummer', None)
    district = data.get('Kreis', None)
    image_url = data.get('FotoURL', None)

    sql = '''
    INSERT INTO sh_monument (object_number, monument_type,
        address_location, description, designation, protection_scope,
        municipality, justification, district, image_url)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (object_number) DO UPDATE SET
        monument_type = EXCLUDED.monument_type,
        address_location = EXCLUDED.address_location,
        description = EXCLUDED.description,
        designation = EXCLUDED.designation,
        protection_scope = EXCLUDED.protection_scope,
        municipality = EXCLUDED.municipality,
        justification = EXCLUDED.justification,
        district = EXCLUDED.district,
        image_url = EXCLUDED.image_url
    RETURNING id
    '''

    cur.execute(sql, (
        object_number, monument_type, address_location, description,
        designation, protection_scope, municipality, justification,
        district, image_url
    ))


@click.command()
@click.argument('url')
def main(url):
    file_object = request_json(url, data_directory)
    rows = get_data(file_object['target'])

    cursor = conn.cursor()
    for row in rows:
        insert_object(cursor, row)


if __name__ == '__main__':
    main()
