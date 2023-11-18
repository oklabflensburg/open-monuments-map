#!./venv/bin/python

import re
import click
import json

import xml.etree.ElementTree as ET

from urllib import parse
from datetime import datetime
from pathlib import Path


def get_data(src):
    with open(src, 'r') as f:
        d = json.loads(f.read())
    
    return d


def generate_sitemap(url, unique_slug, dst):
    dt = datetime.now().strftime('%Y-%m-%d')

    schema_loc = ("http://www.sitemaps.org/schemas/sitemap/0.9", "http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd")

    root = ET.Element("urlset")
    root.attrib["xmlns:xsi"] = "http://www.w3.org/2001/XMLSchema-instance"
    root.attrib["xsi:schemaLocation"] = schema_loc
    root.attrib["xmlns"] = "http://www.sitemaps.org/schemas/sitemap/0.9"


    for slug in unique_slug:
        doc = ET.SubElement(root, "url")
        ET.SubElement(doc, "loc").text = f'{url}{slug}'
        ET.SubElement(doc, "lastmod").text = dt
        ET.SubElement(doc, "changefreq").text = "weekly"
        ET.SubElement(doc, "priority").text = "0.8"

    tree = ET.ElementTree(root)
    ET.indent(tree, '  ')

    tree.write(dst, encoding='utf-8', xml_declaration=True)


@click.command()
@click.argument('src')
@click.argument('dst')
@click.argument('url')
def main(src, dst, url):
    src = Path(src)
    dst = Path(dst)

    content = get_data(src)
    unique_slug = []

    for feature in content['features']:
        slug = parse.quote(feature['properties']['slug'])
        unique_slug.append(slug)

    generate_sitemap(url, list(set(unique_slug)), dst)


if __name__ == '__main__':
    main()
