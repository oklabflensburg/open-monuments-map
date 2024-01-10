# Denkmalschutzkarte Flensburg

[![Lighthouse CI](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lighthouse.yml)
[![CodeQL](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/codeql.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/codeql.yml)


![Denkmalschutzkarte Flensburg](https://raw.githubusercontent.com/oklabflensburg/open-monuments-map/main/screenshot_denkmalschutzliste.jpg)

_Haftungsausschluss: Dieses Repository und die zugehörige Datenbank befinden sich derzeit in einer Beta-Version. Einige Aspekte des Codes und der Daten können noch Fehler enthalten. Bitte kontaktieren Sie uns per E-Mail oder erstellen Sie ein Issue auf GitHub, wenn Sie einen Fehler entdecken._



## Datenquelle

Die Daten der Kulturdenkmale haben wir über [Landesamt für Denkmalpflege](https://opendata.schleswig-holstein.de/dataset/denkmalliste-flensburg) auf dem Open-Data Portal Schleswig-Holstein bezogen. Es heißt dazu: "Kulturdenkmale sind gesetzlich geschützt und nachrichtlich in ein Verzeichnis, die sog. Denkmalliste, einzutragen. Von der Aufnahme in die Denkmalliste werden die betroffenen Eigentümerinnen und Eigentümer benachrichtigt".



## Hintergrund

Diese interaktive webbasierte Karte ist auf Basis der Daten des Landesamtes für Denkmalpflege und der Bilddaten des Open Data Repositories der Christian-Albrechts-Universität zu Kiel entstanden. Nach einigen Stunden der Betrachtung der Datensätze konnten wir die Daten lesen und mittels einem selbst geschriebenen Python Skript in ein maschinenlesbares offenes Format nach der Spezifikation [RFC 7946](https://geojson.org/) umwandeln. Wir nutzen die [OpenSteetMap](https://www.openstreetmap.de/) Karte als Basis für die Darstellungen der Marker. Wir mussten die gegebenen Daten bereinigen und Dupliketen aussortieren und die jeweilige Geografische Position mittels der [Google Maps API](https://geopy.readthedocs.io/en/stable/index.html?highlight=GoogleV3#googlev3) in Python aus den vorhandenen Daten wie der Straße und Hausnummer und der Stadt extrahieren. Unser Ziel ist es Interessierten eine Nutzung der offenen Daten mit wenig Arbeit und einem Mehrwert anzubieten.



## Setup


Follow these steps to run on an dev enviroment

```
sudo apt install git git-lfs virtualenv python3 python3-pip postgresql-15 postgresql-15-postgis-3 postgis
```


Clone repository `open-monuments-map` and move in

```
git clone https://github.com/oklabflensburg/open-monuments-map.git
cd open-monuments-map
```


Create dot `.env` file and add the following vars with `vim .env`

```
DB_PASS=postgres
DB_HOST=localhost
DB_USER=postgres
DB_NAME=postgres
DB_PORT=5432
```


If you want to update the repository use these commands

```
git pull
git lfs pull
git lfs install
```

Finally you can run sql statements inside `open-monuments-map` directory

```
sudo -i -Hu postgres psql -U postgres -h localhost -d postgres -p 5432 < data/denkmalliste_schema.sql
sudo -i -Hu postgres psql -U postgres -h localhost -d postgres -p 5432 < data/denkmalliste_geometrien_schema.sql
```


Next we add all administrative geometries to our database

```
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250gem.geojson" -nln vg250gem
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250vwg.geojson" -nln vg250vwg
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250krs.geojson" -nln vg250krs
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250lan.geojson" -nln vg250lan
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250rbz.geojson" -nln vg250rbz
ogr2ogr -f "PostgreSQL" PG:"dbname=postgres user=postgres port=5432 host=localhost" "data/vg250sta.geojson" -nln vg250sta
```


Next initialize python virtualenv and install the dependencies

```
cd tools
virtualenv venv
source venv/local/bin/activate
pip install -r requirements.txt
python insert_monuments.py ../data/stadt-flensburg-denkmalschutz.geojson
python insert_boundaries.py ../data/denkmalliste_geometrien.geojson
python insert_nearest.py
deactivate
```


## HOW TO USE


To query a boundary of an monument call this script with an `object_id`

```
./query_boundaries.py 4677
```

```json
{"crs": {"properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}, "type": "name"}, "features": [{"geometry": {"coordinates": [[[10.473906, 54.268938], [10.474305, 54.268966], [10.474323, 54.268879], [10.473924, 54.26885], [10.473906, 54.268938]]], "type": "Polygon"}, "properties": {"object_id": "4677"}, "type": "Feature"}], "type": "FeatureCollection"}
```


To query an administrative geometry with a buffer by 350 meters

```
./query_geojson.py Wiedenborstel
```

```json
{"crs": {"properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}, "type": "name"}, "features": [{"geometry": {"coordinates": [[[9.737154, 54.041516], [9.736735, 54.042374], [9.736698, 54.042454], [9.73641, 54.04311], [9.735614, 54.04376], [9.735067, 54.044321], [9.734727, 54.044936], [9.734607, 54.045578], [9.734713, 54.046222], [9.735041, 54.046839], [9.735567, 54.047561], [9.736286, 54.048271], [9.740882, 54.051691], [9.741717, 54.052187], [9.743463, 54.053016], [9.74434, 54.053355], [9.745311, 54.053586], [9.746341, 54.053701], [9.749554, 54.053872], [9.751125, 54.054024], [9.753842, 54.054889], [9.754684, 54.055104], [9.755576, 54.055232], [9.756492, 54.055267], [9.757405, 54.05521], [9.759331, 54.05499], [9.760373, 54.054875], [9.764946, 54.056171], [9.765929, 54.056382], [9.766964, 54.056477], [9.76801, 54.056451], [9.769028, 54.056306], [9.775747, 54.054924], [9.777342, 54.05468], [9.778022, 54.054546], [9.781149, 54.053792], [9.781931, 54.053557], [9.782638, 54.05325], [9.783249, 54.05288], [9.784607, 54.051908], [9.784754, 54.051882], [9.785748, 54.051635], [9.786637, 54.051276], [9.787386, 54.050819], [9.787964, 54.050283], [9.788347, 54.04969], [9.788519, 54.049063], [9.788475, 54.048429], [9.788215, 54.047813], [9.787751, 54.047241], [9.7871, 54.046734], [9.785562, 54.04576], [9.783264, 54.043586], [9.782619, 54.043092], [9.781822, 54.042683], [9.7803, 54.042047], [9.779656, 54.040915], [9.779787, 54.040433], [9.779846, 54.040122], [9.779886, 54.039726], [9.78002, 54.039524], [9.780258, 54.039063], [9.780374, 54.038585], [9.780446, 54.03793], [9.780402, 54.037279], [9.780132, 54.036647], [9.779647, 54.036062], [9.779603, 54.036028], [9.779602, 54.035886], [9.779406, 54.035298], [9.779023, 54.034742], [9.777706, 54.033252], [9.777245, 54.032835], [9.777613, 54.031175], [9.777649, 54.030577], [9.777491, 54.029986], [9.777146, 54.029423], [9.776626, 54.028909], [9.77595, 54.028462], [9.775143, 54.028098], [9.774233, 54.027832], [9.771954, 54.027315], [9.77094, 54.027151], [9.769892, 54.027107], [9.768849, 54.027184], [9.767852, 54.02738], [9.76694, 54.027687], [9.766147, 54.028094], [9.765478, 54.028511], [9.763896, 54.028982], [9.763092, 54.028924], [9.762064, 54.028967], [9.762057, 54.028968], [9.761934, 54.028946], [9.760942, 54.028876], [9.759945, 54.028916], [9.758979, 54.029064], [9.758076, 54.029316], [9.757269, 54.029662], [9.756765, 54.029924], [9.756706, 54.029931], [9.754993, 54.029853], [9.754097, 54.029856], [9.753215, 54.029948], [9.746759, 54.030951], [9.742702, 54.031582], [9.741743, 54.031791], [9.740869, 54.032104], [9.740112, 54.032509], [9.7395, 54.032991], [9.739056, 54.033534], [9.738795, 54.034116], [9.738727, 54.034716], [9.738855, 54.035314], [9.739242, 54.036329], [9.739018, 54.03652], [9.738161, 54.037511], [9.738113, 54.037568], [9.73724, 54.038632], [9.736843, 54.039296], [9.736707, 54.039995], [9.736839, 54.040694], [9.737154, 54.041516]]], "type": "Polygon"}, "properties": {"gen": "Wiedenborstel"}, "type": "Feature"}], "type": "FeatureCollection"}
```



## Example Query

```sql
SELECT
    json_build_object(
        'type', 'FeatureCollection',
        'crs', json_build_object(
            'type', 'name',
            'properties', json_build_object(
                'name', 'urn:ogc:def:crs:OGC:1.3:CRS84'
            )
        ),
        'features', json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(m.wkb_geometry)::json,
                'properties', json_build_object(
                    'object_id', m.object_id,
                    'place_name', m.place_name,
                    'address', m.address,
                    'postal_code', m.postal_code,
                    'image_url', m.image_url,
                    'designation', m.designation,
                    'description', m.description,
                    'monument_type', m.monument_type,
                    'reasons', (
                        SELECT string_agg(mr.label, ', ')
                        FROM monument_reason AS mr
                        WHERE mxr.monument_id = m.id
                    )
                )
            )
        )
    )
FROM monuments AS m
JOIN monument_x_reason AS mxr ON mxr.monument_id = m.id
JOIN monument_reason AS mr ON mxr.reason_id = mr.id
JOIN vg250gem AS v ON ST_Within(ST_GeomFromEWKB(m.wkb_geometry), ST_GeomFromEWKB(v.wkb_geometry))
WHERE LOWER(v.gen) = 'flensburg';
```



## LICENSE

[CC0-1.0](LICENSE)
