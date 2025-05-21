# Denkmalliste Stadt Flensburg

[![Lint css files](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-css.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-css.yml)
[![Lint html files](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-html.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-html.yml)
[![Lint js files](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-js.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lint-js.yml)
[![Lighthouse CI](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/oklabflensburg/open-monuments-map/actions/workflows/lighthouse.yml)


![Denkmalliste Stadt Flensburg](https://raw.githubusercontent.com/oklabflensburg/open-monuments-map/main/screenshot_denkmalschutzliste.jpg)

_Haftungsausschluss: Dieses Repository und die zugehörige Datenbank befinden sich derzeit in einer Beta-Version. Einige Aspekte des Codes und der Daten können noch Fehler enthalten. Bitte kontaktieren Sie uns per E-Mail oder erstellen Sie ein Issue auf GitHub, wenn Sie einen Fehler entdecken._


## Hintergrund

Die Idee, Denkmäler und deren Merkmale auf einer digitalen Karte anzuzeigen, ist während eines Spaziergangs durch Flensburg entstanden. Auf dem Open Data Portal Schleswig-Holstein stellt das Landesamt für Denkmalpflege Schleswig-Holstein eine Denkmalliste zur Verfügung, jedoch leider ohne Angabe der Koordinaten. Wir haben uns entschieden, dies zu ändern und einen Prototypen der Öffentlichkeit zugänglich zu machen, indem wir die Einträge mit den Gebäudekoordinaten ergänzen.


## Datenquelle

Das Landesamt für Denkmalpflege Schleswig-Holstein prüft anhand der gesetzlich vorgegebenen Kriterien den besonderen Wert eines Kulturdenkmals und legt die Maßstäbe, die Methodik für die Erfassung und Pflege sowie den Schutzumfang der Kulturdenkmale fest. Die erhobenen Daten der Denkmalliste werden im Open Data Portal des Landes Schleswig-Holstein zum Download angeboten. Die Kartendarstellung wurde von engagierten Einwohner:innen und ehrenamtlichen Mitgliedern des OK Lab Flensburgs entwickelt.


## Mitmachen

Du kannst jederzeit ein Issue auf GitHub öffnen oder uns über oklabflensburg@grain.one schreiben



## Prerequisite

Install system dependencies and clone repository

```
sudo apt install wget
sudo apt install git git-lfs
sudo apt install python3 python3-pip python3-venv

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install postgresql-16 postgis
sudo apt install gdal-bin

# install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# download and install Node.js
nvm install 20

# verifies the right Node.js version is in the environment
node -v

# verifies the right NPM version is in the environment
npm -v

git clone https://github.com/oklabflensburg/open-monuments-map.git
```

Create a dot `.env` file inside the project root. Make sure to add the following content and repace values.

```
PARCEL_BASE_URL=
PARCEL_BASE_API_URL=

PARCEL_CONTACT_MAIL=""
PARCEL_CONTACT_PHONE=""

PARCEL_PRIVACY_CONTACT_PERSON=""

PARCEL_ADDRESS_NAME=""
PARCEL_ADDRESS_STREET=""
PARCEL_ADDRESS_HOUSE_NUMBER=0
PARCEL_ADDRESS_POSTAL_CODE=00000
PARCEL_ADDRESS_CITY=""

DB_PASS=postgres
DB_HOST=localhost
DB_USER=postgres
DB_NAME=postgres
DB_PORT=5432
```


## Update repository

```
git pull
git lfs pull
```


## Create SQL schema

Run sql statements inside `open-monuments-map` root directory

```
psql -U oklab -h localhost -d oklab -p 5432 < data/denkmalliste_schema.sql
psql -U oklab -h localhost -d oklab -p 5432 < data/denkmalliste_geometrien_schema.sql
```


Next initialize python virtualenv and install the dependencies

```
cd tools
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 insert_monuments.py https://opendata.schleswig-holstein.de/dataset/35ee9af8-558d-42d1-ae2e-a1e5306498ea/resource/754924f1-1f21-47b2-9cc6-6da9327fcbc3/download/denkmalliste.json
python3 insert_boundaries.py ../data/geodaten-denkmalliste-sh.geojson
deactivate
```

---


## How to Contribute

Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on how to get involved.


---


## License

This repository is licensed under [CC0-1.0](LICENSE).
