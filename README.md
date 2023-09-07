# Denkmalschutzkarte Flensburg


![Denkmalschutzkarte Flensburg](https://raw.githubusercontent.com/oklabflensburg/open-monuments-map/main/screenshot_denkmalschutz_flensburg.jpg)

_Haftungsausschluss: Dieses Repository und die zugehörige Datenbank befinden sich derzeit in einer Beta-Version. Einige Aspekte des Codes und der Daten können noch Fehler enthalten. Bitte kontaktieren Sie uns per E-Mail oder erstellen Sie ein Issue auf GitHub, wenn Sie einen Fehler entdecken._


## Datenquelle

Die Daten der Kulturdenkmale haben wir über [Landesamt für Denkmalpflege](https://opendata.schleswig-holstein.de/dataset/denkmalliste-flensburg) auf dem Open-Data Portal Schleswig-Holstein bezogen. Es heißt dazu: "Kulturdenkmale sind gesetzlich geschützt und nachrichtlich in ein Verzeichnis, die sog. Denkmalliste, einzutragen. Von der Aufnahme in die Denkmalliste werden die betroffenen Eigentümerinnen und Eigentümer benachrichtigt".


## Interaktive Karte

Diese interaktive webbasierte Karte ist auf Basis der Daten des Landesamtes für Denkmalpflege und der Bilddaten des Open Data Repositories der Christian-Albrechts-Universität zu Kiel entstanden. Nach einigen Stunden der Betrachtung der Datensätze konnten wir die Daten lesen und mittels einem selbst geschriebenen Python Skript in ein maschinenlesbares offenes Format nach der Spezifikation [RFC 7946](https://geojson.org/) umwandeln. Wir nutzen die [OpenSteetMap](https://www.openstreetmap.de/) Karte als Basis für die Darstellungen der Marker. Wir mussten die gegebenen Daten bereinigen und Dupliketen aussortieren und die jeweilige Geografische Position mittels der [Google Maps API](https://geopy.readthedocs.io/en/stable/index.html?highlight=GoogleV3#googlev3) in Python aus den vorhandenen Daten wie der Straße und Hausnummer und der Stadt extrahieren. Unser Ziel ist es Interessierten eine Nutzung der offenen Daten mit wenig Arbeit und einem Mehrwert anzubieten.


## Setup


Follow these steps to run on an dev enviroment

```
sudo apt install git virtualenv python3 python3-pip postgresql-15 postgresql-15-postgis-3 postgis
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

Finally you can run sql statements inside `open-monuments-map` directory

```sql
psql -U postgres -h localhost -d postgres -p 5432 < data/flensburg_denkmalschutz.sql
```


Next initialize python virtualenv and install the dependencies

```
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
```


And last but not least, insert data into tables

```python
./insert_boundaries.py data/monument_boundaries.geojson
```


## HOW TO USE


To query a boundary of an monument call this script with an `object_id`

```
./query_boundaries.py 4677
```

```
{"crs": {"properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}, "type": "name"}, "features": [{"geometry": {"coordinates": [[[10.473906, 54.268938], [10.474305, 54.268966], [10.474323, 54.268879], [10.473924, 54.26885], [10.473906, 54.268938]]], "type": "Polygon"}, "properties": {"object_id": "4677"}, "type": "Feature"}], "type": "FeatureCollection"}
```


## LICENSE

[CC0-1.0](LICENSE)
