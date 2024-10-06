#!./venv/bin/python

import os
import re
import json
import click
import httpx

from geopy.geocoders import GoogleV3
from dotenv import load_dotenv
from pathlib import Path


data_directory = Path('../data')
env_path = Path('../.env')

load_dotenv(dotenv_path=env_path)


try:
    api_key = os.getenv('API_KEY')
except Exception as e:
    raise(e)


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


def get_geolocation(addr):
    g = GoogleV3(api_key=api_key)
    locations = g.geocode(query=f'{addr[0].replace(" ", "+")}+{addr[1]}', exactly_one=True)

    loc = {
        'coords': [],
        'street': None,
        'housenumber': None,
        'postcode': None,
        'city': None
    }

    try:
        if not hasattr(locations, 'raw'):
            return loc

        for component in locations.raw['address_components']:
            if 'route' in component['types']:
                loc['street'] = component['short_name']

            if 'street_number' in component['types']:
                loc['housenumber'] = component['short_name']

            if 'locality' in component['types']:
                loc['city'] = component['long_name']

            if 'postal_code' in component['types']:
                loc['postcode'] = component['short_name']

        try:
            loc['coords'] = [locations.latitude, locations.longitude]
        except (TypeError, AttributeError, IndexError):
            pass
    except Exception as e:
        print(e)

    print(loc)

    return loc


def defuck(line):
    matches = re.findall(r'([?:\s\.a-zA-ZäöüßÄÖÜ-]+)([\s]([\d+]+[\w-]?[,]?[\s]?)+)', line)
    addresses = []

    for m in matches:
        streetname = m[0].strip()
        house_numbers = m[1].split(',')
        house_numbers = [x.strip() for x in house_numbers if re.match(r'[\d+]', x.strip())]

        for house_number in house_numbers:
            hn = house_number.strip()
            addr = f'{streetname} {hn}'

            addresses.append(addr)

    return addresses


@click.command()
@click.argument('url')
def main(url):
    file_object = request_json(url, data_directory)
    dest = f'{data_directory}/{file_object["name"]}-denkmalschutz.{file_object["extension"]}'

    d = get_data(file_object['target'])
    aa = []

    for i in d:
        if 'Adresse-Lage' in i:
            s = i['Adresse-Lage']
            tt = defuck(s)
        else:
            continue

        for t in tt:
            t = t.rstrip(',')
            w = re.split(r'\s\d', t)
            hh = re.split(r'[,]', t)

            for j, h in enumerate(hh):
                if j > 0:
                    a = f'{w[0]}{h}'
                else:
                    a = h

                o = i.copy()
                
                loc = get_geolocation([a, o['Gemeinde']])

                if 'Objektnummer' in o:
                    o['object_id'] = o.pop('Objektnummer')

                if 'Bezeichnung' in o:
                    o['designation'] = o.pop('Bezeichnung')

                if 'Kulturdenkmaltyp' in o:
                    o['type'] = o.pop('Kulturdenkmaltyp')

                if 'Kreis' in o:
                    o['district'] = o.pop('Kreis')

                if 'FotoURL' in o:
                    o['url'] = o.pop('FotoURL')

                if 'Beschreibung' in o:
                    o['description'] = o.pop('Beschreibung')
                
                if 'Begründung' in o:
                    o['reasons'] = o.pop('Begründung')

                if 'Schutzumfang' in o:
                    o['scope'] = o.pop('Schutzumfang')

                o['street'] = loc['street']
                o['housenumber'] = loc['housenumber']
                o['postcode'] = loc['postcode']
                o['city'] = loc['city']

                o['coords'] = loc['coords']

                del o['Gemeinde']
                del o['Adresse-Lage']

                aa.append(o)
            break

    with open(dest, 'w') as f:
        json.dump(aa, f)


if __name__ == '__main__':
    main()
