-- POSTGIS UND PGCRYPTO ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- HILFSTABELLE GEOMETRIEN DENKMALLISTE
DROP TABLE IF EXISTS sh_monument_boundaries CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_boundaries (
  id SERIAL,
  object_id INT,
  wkb_geometry GEOMETRY(GEOMETRY, 4326),
  PRIMARY KEY(id)
);


-- GEOMETRY INDEX
CREATE INDEX IF NOT EXISTS sh_monument_boundaries_object_id_idx ON sh_monument_boundaries (object_id);
CREATE INDEX IF NOT EXISTS sh_monument_boundaries_wkb_geometry_idx ON sh_monument_boundaries USING GIST (wkb_geometry);
CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_boundaries_object_id_wkb_geometry_hash_idx ON sh_monument_boundaries (object_id, (md5(wkb_geometry::text)));
