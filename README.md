# Open Monuments Map


![Denkmalschutzkarte Flensburg](https://raw.githubusercontent.com/oklabflensburg/open-monuments-map/main/denkmalliste_stadt_flensburg.png)

_Haftungsausschluss: Dieses Repository und die zugehörige Datenbank befinden sich derzeit in einer Beta-Version. Einige Aspekte des Codes und der Daten können noch Fehler enthalten. Bitte kontaktieren Sie uns per E-Mail oder erstellen Sie ein Issue auf GitHub, wenn Sie einen Fehler entdecken._


## Datenquelle

Die Daten der Kulturdenkmale haben wir über [Landesamt für Denkmalpflege](https://opendata.schleswig-holstein.de/dataset/denkmalliste-flensburg) auf dem Open-Data Portal Schleswig-Holstein bezogen. Es heißt dazu: "Kulturdenkmale sind gesetzlich geschützt und nachrichtlich in ein Verzeichnis, die sog. Denkmalliste, einzutragen. Von der Aufnahme in die Denkmalliste werden die betroffenen Eigentümerinnen und Eigentümer benachrichtigt".


## Interaktive Karte

Diese interaktive webbasierte Karte ist auf Basis der Daten des Landesamtes für Denkmalpflege und der Bilddaten des Open Data Repositories der Christian-Albrechts-Universität zu Kiel entstanden. Nach einigen Stunden der Betrachtung der Datensätze konnten wir die Daten lesen und mittels einem selbst geschriebenen Python Skript in ein maschinenlesbares offenes Format nach der Spezifikation [RFC 7946](https://geojson.org/) umwandeln. Wir nutzen die [OpenSteetMap](https://www.openstreetmap.de/) Karte als Basis für die Darstellungen der Marker. Wir mussten die gegebenen Daten bereinigen und Dupliketen aussortieren und die jeweilige Geografische Position mittels der [Google Maps API](https://geopy.readthedocs.io/en/stable/index.html?highlight=GoogleV3#googlev3) in Python aus den vorhandenen Daten wie der Straße und Hausnummer und der Stadt extrahieren. Unser Ziel ist es Interessierten eine Nutzung der offenen Daten mit wenig Arbeit und einem Mehrwert anzubieten.
