#!/usr/bin/python3

import re
import json
import requests


def get_data():
    with open('flensburg_denkmalschutz.json', 'r') as f:
        d = json.loads(f.read())
    
    return d


def get_coords(addr):
    url = f'https://nominatim.openstreetmap.org?q={addr}&format=json'
    print(url)

    r = requests.get(url)

    if r.status_code == 200:
        j = json.loads(r.content)

        try:
            return [j[0]['lat'], j[0]['lon']]
        except IndexError as e:
            return []


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
                o['coords'] = get_coords(f'{a.replace(" ", "+")}+Flensburg')

                del o['Adresse-Lage']
                aa.append(o)
            break

    with open('updated_flensburg_denkmalschutz.json', 'w') as f:
        json.dump(aa, f)


if __name__ == '__main__':
    main()
