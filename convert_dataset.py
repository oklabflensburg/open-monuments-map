#!./venv/bin/python

import os
import re
import json
import requests

from geopy.geocoders import GoogleV3
from os.path import join, dirname
from dotenv import load_dotenv


dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

API_KEY = os.environ.get('API_KEY')


def get_data():
    with open('stadt-flensburg.json', 'r') as f:
        d = json.loads(f.read())

    return d


def get_geolocation(addr):
    g = GoogleV3(api_key=API_KEY)
    locations = g.geocode(query=f'{addr[0].replace(" ", "+")}+{addr[1]}', exactly_one=True)

    if locations:
        loc = {
            'coords': None,
            'postal_code': None
        }

        for component in locations.raw['address_components']:
            if 'postal_code' in component['types']:
                loc['postal_code'] = component['short_name']

        try:
            loc['coords'] = [locations.latitude, locations.longitude]
        except IndexError as e:
            pass

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


def main():
    d = get_data()
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
                    o['object'] = o.pop('Objektnummer')

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

    with open('flensburg_denkmalschutz.json', 'w') as f:
        json.dump(aa, f)


if __name__ == '__main__':
    main()
