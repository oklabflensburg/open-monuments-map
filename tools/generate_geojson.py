#!./venv/bin/python

import json
import click
import re

from geojson import FeatureCollection, Feature, Point
from pathlib import Path


def get_data(src):
    with open(src, 'r') as f:
        d = json.loads(f.read())
    
    return d


def replace_umlauts(string):
    slug = string

    tpl = (('ü', 'ue'), ('Ü', 'Ue'), ('ä', 'ae'), ('Ä', 'Ae'), ('ö', 'oe'), ('Ö', 'Oe'), ('ß', 'ss'))

    for item1, item2 in tpl:
	    slug = slug.replace(item1, item2)

    return slug


def get_slug(designation, administrative, address):
    admin = administrative.split(', ')

    if len(admin) > 0:
        admin.sort(reverse=True)

    title = re.sub('[\d\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', designation)
    city = re.sub('[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', '-'.join(admin))
    addr = re.sub('[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', address)

    street = re.sub('\d.*', '', address)
    streets = list(set(street.split()))

    for item in streets:
        title = title.replace(item.strip(), '')

    slug = f'{title} {addr} {city}'.lower().strip()
    slug = re.sub(r'\s+', ' ', replace_umlauts(slug)).replace(' ', '-')

    return slug


@click.command()
@click.argument('src')
def main(src):
    filename = Path(src).stem
    parent = str(Path(src).parent)
    dest = Path(f'{parent}/{filename}.geojson')

    d = get_data(src)
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
            'slug': get_slug(o['designation'], o['authority'], o['address']),
            'object_id': o['object_id'],
            'designation': o['designation'],
            'monument_type': o['type'],
            'administrative': o['authority'],
            'place_name': o['district'],
            'image_url': o['url'] if 'url' in o else '',
            'description': o['description'],
            'reasons': o['reasons'] if 'reasons' in o else [],
            'scope': o['scope'] if 'scope' in o else [],
            'postal_code': o['postal_code'],
            'address': o['address']
        }

        fc.append(Feature(geometry=point, properties=properties))

    c = FeatureCollection(fc, crs=crs)

    with open(dest, 'w') as f:
        json.dump(c, f)


if __name__ == '__main__':
    main()
