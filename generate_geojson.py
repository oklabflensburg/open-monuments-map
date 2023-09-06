#!./venv/bin/python

import json
import click

from geojson import FeatureCollection, Feature, Point


def get_data(filepath):
    with open(filepath, 'r') as f:
        d = json.loads(f.read())
    
    return d


@click.command()
@click.argument('filepath')
def main(filepath):
    target = filepath.split('.')[0]

    d = get_data(filepath)
    fc = []

    crs = {
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
    }

    for o in d:
        if not o['coords'] or len(o['coords']) != 2:
            continue

        point = Point((float(o['coords'][1]), float(o['coords'][0])))
            
        properties = {
            'object_id': o['object_id'],
            'designation': o['designation'],
            'type': o['type'],
            'authority': o['authority'],
            'district': o['district'],
            'url': o['url'] if 'url' in o else '',
            'description': o['description'],
            'reasons': o['reasons'] if 'reasons' in o else '',
            'postal_code': o['postal_code'],
            'scope': o['scope'] if 'scope' in o else [],
            'address': o['address']
        }

        fc.append(Feature(geometry=point, properties=properties))

    c = FeatureCollection(fc, crs=crs)

    with open(f'{target}.geojson', 'w') as f:
        json.dump(c, f)


if __name__ == '__main__':
    main()
