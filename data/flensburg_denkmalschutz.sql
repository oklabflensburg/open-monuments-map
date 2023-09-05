/* POSTGIS ERWEITERUNG LADEN */
CREATE EXTENSION IF NOT EXISTS postgis;


/* GEOMETRIE DENKMALSCHUTZUMFANG */
DROP TABLE IF EXISTS monument_boundaries;

CREATE TABLE IF NOT EXISTS monument_boundaries (
  id SERIAL,
  object_id INT,
  geometry geography,
  PRIMARY KEY(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_boundaries_object_id_idx ON monument_boundaries (object_id);
