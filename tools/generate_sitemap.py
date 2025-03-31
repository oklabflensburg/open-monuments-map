import os
import click
import psycopg2

import xml.etree.ElementTree as ET

from urllib import parse
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path


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
except Exception as e:
    raise e


def generate_sitemap(url, unique_slug, dst):
    dt = datetime.now().strftime('%Y-%m-%d')

    schema_loc = ("http://www.sitemaps.org/schemas/sitemap/0.9",
                  "http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd")

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
@click.argument('dst')
@click.argument('url')
def main(dst, url):
    cur = conn.cursor()

    sql = 'SELECT slug FROM public.sh_monument_boundary_processed'
    cur.execute(sql)
    rows = cur.fetchall()

    dst = Path(dst)

    unique_slug = []

    for row in rows:
        slug = row[0]

        unique_slug.append(slug)

    generate_sitemap(url, list(set(unique_slug)), dst)


if __name__ == '__main__':
    main()
