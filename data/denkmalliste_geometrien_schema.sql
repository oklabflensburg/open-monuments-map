-- POSTGIS ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;


-- HILFSTABELLE GEOMETRIEN DENKMALLISTE
DROP TABLE IF EXISTS monument_boundaries CASCADE;

CREATE TABLE IF NOT EXISTS monument_boundaries (
  id SERIAL,
  object_id VARCHAR,
  wkb_geometry GEOMETRY(GEOMETRY, 4326),
  PRIMARY KEY(id)
);


-- GEOMETRY INDEX
CREATE UNIQUE INDEX IF NOT EXISTS monument_boundaries_id_idx ON monument_boundaries (id);
CREATE INDEX IF NOT EXISTS monument_boundaries_wkb_geometry_geom_idx ON monument_boundaries USING gist (wkb_geometry);
