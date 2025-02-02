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


def get_slug(designation, street, housenumber, city):
    title = re.sub(r'[\d\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', designation)
    city_parsed = re.sub(r'[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', city)
    street_parsed = re.sub(r'[\s!@#\$%\^&\*\(\)\[\]{};:,\./<>\?\|`~\-=_\+]', ' ', street)

    slug = f'{title} {street_parsed} {housenumber} {city_parsed}'.lower().strip()
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

        street = o['street'] if o['street'] is not None else ''
        housenumber = o['housenumber'] if o['housenumber'] is not None else ''
        city = o['city'] if o['city'] is not None else ''
        point = Point((float(o['coords'][1]), float(o['coords'][0])))

        properties = {
            'slug': get_slug(o['designation'], street, housenumber, city),
            'object_id': o['object_id'],
            'designation': o['designation'],
            'monument_type': o['type'],
            'image_url': o['url'] if 'url' in o else '',
            'description': o['description'],
            'reasons': o['reasons'] if 'reasons' in o else [],
            'scopes': o['scopes'] if 'scopes' in o else [],
            'street': street,
            'housenumber': housenumber,
            'postcode': o['postcode'] if o['postcode'] is not None else '',
            'city': city
        }

        fc.append(Feature(geometry=point, properties=properties))

    c = FeatureCollection(fc, crs=crs)

    with open(dest, 'w') as f:
        json.dump(c, f)


if __name__ == '__main__':
    main()
