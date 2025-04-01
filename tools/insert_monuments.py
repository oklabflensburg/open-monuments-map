#!./venv/bin/python

import os
import json
import psycopg2
import click
import httpx

from psycopg2.errors import UniqueViolation
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

    fields = {
        'address_location': 'Adresse-Lage',
        'description': 'Beschreibung',
        'designation': 'Bezeichnung',
        'monument_type': 'Kulturdenkmaltyp',
        'protection_scope': 'Schutzumfang',
        'municipality': 'Gemeinde',
        'justification': 'Begründung',
        'object_number': 'Objektnummer',
        'district': 'Kreis',
        'image_url': 'FotoURL'
    }

    variables = {}

    for var_name, key in fields.items():
        value = data.get(key, None)
        if key in ['Schutzumfang', 'Begründung'] and isinstance(value, list):
            value = json.dumps(value)
        variables[var_name] = value

    address_location = variables['address_location']
    description = variables['description']
    designation = variables['designation']
    monument_type = variables['monument_type']
    protection_scope = variables['protection_scope']
    municipality = variables['municipality']
    justification = variables['justification']
    object_number = variables['object_number']
    district = variables['district']
    image_url = variables['image_url']

    sql = '''
    INSERT INTO sh_monument (object_number, monument_type,
        address_location, description, designation, protection_scope,
        municipality, justification, district, image_url)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    '''

    try:
        cur.execute(sql, (
            object_number, monument_type, address_location, description,
            designation, protection_scope, municipality, justification,
            district, image_url
        ))
    except UniqueViolation:
        return


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
