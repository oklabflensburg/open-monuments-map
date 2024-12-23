-- POSTGIS ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;


-- HILFSTABELLE GEOMETRIEN DENKMALLISTE
DROP TABLE IF EXISTS sh_monument_boundaries CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_boundaries (
  id SERIAL,
  object_id VARCHAR,
  wkb_geometry GEOMETRY(GEOMETRY, 4326),
  PRIMARY KEY(id)
);


-- CREATE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_boundaries_id_idx ON sh_monument_boundaries (id);
CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_boundaries_object_id_idx ON sh_monument_boundaries (object_id);
CREATE INDEX IF NOT EXISTS sh_monument_boundaries_wkb_geometry_geom_idx ON sh_monument_boundaries USING gist (wkb_geometry);


-- TABELLE DENKMALOBJEKTE
DROP TABLE IF EXISTS sh_monuments CASCADE;

CREATE TABLE IF NOT EXISTS sh_monuments (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  object_id INT,
  street VARCHAR,
  housenumber VARCHAR,
  postcode VARCHAR,
  city VARCHAR,
  image_url VARCHAR,
  designation VARCHAR,
  description VARCHAR,
  monument_type VARCHAR,
  slug VARCHAR,
  wkb_geometry GEOMETRY(GEOMETRY, 4326)
);

CREATE INDEX IF NOT EXISTS monuments_object_id_idx ON sh_monuments (object_id);
CREATE INDEX IF NOT EXISTS monuments_wkb_geometry_idx ON sh_monuments USING GIST (wkb_geometry);



-- HILFSTABELLE NÄCHSTGELEGENE OBJEKTE
DROP TABLE IF EXISTS sh_monument_nearest CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_nearest (
  relation_id INT NOT NULL REFERENCES sh_monuments (id),
  monument_id INT NOT NULL REFERENCES sh_monuments (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_nearest_monument_id_relation_id_idx ON sh_monument_nearest (monument_id, relation_id);



-- HILFSTABELLE SCHUTZUMFANG
DROP TABLE IF EXISTS sh_monument_scope CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_scope (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_scope_label_idx ON sh_monument_scope (label);



-- TABELLE DENKMALOBJEKT SCHUTZUMFANG
DROP TABLE IF EXISTS sh_monument_x_scope CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_x_scope (
  scope_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES sh_monuments(id),
  FOREIGN KEY(scope_id) REFERENCES sh_monument_scope(id)
);



-- HILFSTABELLE BEGRÜNDUNG
DROP TABLE IF EXISTS sh_monument_reason CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_reason (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_reason_label_idx ON sh_monument_reason (label);



-- TABELLE DENKMALOBJEKT BEGRÜNDUNG
DROP TABLE IF EXISTS sh_monument_x_reason CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_x_reason (
  reason_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES sh_monuments(id),
  FOREIGN KEY(reason_id) REFERENCES sh_monument_reason(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_x_reason_monument_id_reason_id_idx ON sh_monument_x_reason (monument_id, reason_id);
