#!./venv/bin/python

import json

from geojson import FeatureCollection, Feature, Point


def get_data():
    with open('updated_flensburg_denkmalschutz.json', 'r') as f:
        d = json.loads(f.read())
    
    return d


def main():
    d = get_data()
    fc = []

    for o in d:
        if not o['coords'] or len(o['coords']) != 2:
            continue

        point = Point((float(o['coords'][0]), float(o['coords'][1])))
            
        properties = {
            'object': o['object'],
            'designation': o['designation'],
            'type': o['type'],
            'authority': o['authority'],
            'district': o['district'],
            'url': o['url'] if 'url' in o else '',
            'description': o['description'],
            'reasons': o['reasons'] if 'reasons' in o else '',
            'scope': o['scope'],
            'address': o['address']
        }

        fc.append(Feature(geometry=point, properties=properties))

    c = FeatureCollection(fc)

    with open('flensburg_denkmalschutz.geojson', 'w') as f:
        json.dump(c, f)


if __name__ == '__main__':
    main()
