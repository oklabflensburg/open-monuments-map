#!./venv/bin/python

import os
import re
import json
import click
import httpx

from geopy.geocoders import GoogleV3
from dotenv import load_dotenv
from pathlib import Path


current_directory = Path('.')
data_directory = Path('data')

env_path = f'{current_directory}/.env'
load_dotenv(dotenv_path=env_path)


try:
    api_key = os.getenv('API_KEY')
except Exception as e:
    raise(e)


def request_json(url, data_directory):
    filename = url.split('/')[-1]
    filepath = f'{data_directory}/{filename}'

    r = httpx.get(url, timeout=20)

    with open(filepath, 'wb') as f:
        f.write(r.content)

    return filename


def get_data(filename):
    with open(filename, 'r') as f:
        d = json.loads(f.read())

    return d


def get_geolocation(addr):
    g = GoogleV3(api_key=api_key)
    locations = g.geocode(query=f'{addr[0].replace(" ", "+")}+{addr[1]}', exactly_one=True)

    loc = {
        'coords': None,
        'postal_code': None
    }

    try:
        for component in locations.raw['address_components']:
            if 'postal_code' in component['types']:
                loc['postal_code'] = component['short_name']

        try:
            loc['coords'] = [locations.latitude, locations.longitude]
        except IndexError as e:
            pass
    except Exception as e:
        print(e)

    print(loc)

    return loc


def defuck(line):
    x = re.findall(r'[\.\-\s\w+]+\s\d+', line)
    xx = []
    tt = []
    pp = []

    for j in x:
        b = re.search(j, line)
        
        if len(pp) > 0:
            pp.append(b.start())
        else:
            pp.append(b.end())

        xx.append(b)

    for i, p in enumerate(pp):
        if i == 0 and len(pp) == 1:
            tt.append(line)
        elif i == 0 and len(pp) > 1:
            tt.append(line[:pp[i + 1]])
        elif i == 1 and len(pp) > 2:
            tt.append(line[p + 1:pp[i + 1]])
        elif i == 1:
            tt.append(line[p + 1:])
        elif i == len(pp) - 1:
            tt.append(line[p + 1:])
        else:
            tt.append(line[pp[i - 1] + 1:p])

    return tt


@click.command()
@click.argument('url')
def main(url):
    filename = request_json(url, data_directory)
    filepath = f'{data_directory}/{filename}'
    result_filename = filename.split('.')[0]
    result_filepath = f'{data_directory}/{result_filename}-denkmalschutz.json'

    d = get_data(filepath)
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
                
                loc = get_geolocation([a, o['Kreis']])

                if 'Objektnummer' in o:
                    o['object_id'] = o.pop('Objektnummer')

                if 'Bezeichnung' in o:
                    o['designation'] = o.pop('Bezeichnung')

                if 'Kulturdenkmaltyp' in o:
                    o['type'] = o.pop('Kulturdenkmaltyp')

                if 'Gemeinde' in o:
                    o['authority'] = o.pop('Gemeinde')

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

                o['address'] = a

                o['postal_code'] = loc['postal_code']

                o['coords'] = loc['coords']

                del o['Adresse-Lage']

                aa.append(o)
            break

    with open(result_filepath, 'w') as f:
        json.dump(aa, f)


if __name__ == '__main__':
    main()
