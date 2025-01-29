-- POSTGIS ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;


-- HILFSTABELLE GEOMETRIEN DENKMALLISTE
DROP TABLE IF EXISTS sh_monument_boundary CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_boundary (
  id SERIAL,
  object_id VARCHAR,
  category VARCHAR,
  category_id VARCHAR,
  district_code VARCHAR,
  monument_value VARCHAR,
  monument_listed VARCHAR,
  classification VARCHAR,
  classification_code VARCHAR,
  wkb_geometry GEOMETRY(GEOMETRY, 4326),
  PRIMARY KEY(id)
);


-- CREATE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_boundary_id_idx ON sh_monument_boundary (id);
CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_boundary_object_id_idx ON sh_monument_boundary (object_id);
CREATE INDEX IF NOT EXISTS sh_monument_boundary_wkb_geometry_geom_idx ON sh_monument_boundary USING gist (wkb_geometry);


-- TABELLE DENKMALOBJEKTE
DROP TABLE IF EXISTS sh_monument CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument (
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  slug VARCHAR,
  wkb_geometry GEOMETRY(GEOMETRY, 4326)
);

CREATE INDEX IF NOT EXISTS monument_object_id_idx ON sh_monument (object_id);
CREATE INDEX IF NOT EXISTS monument_wkb_geometry_idx ON sh_monument USING GIST (wkb_geometry);



-- HILFSTABELLE NÄCHSTGELEGENE OBJEKTE
DROP TABLE IF EXISTS sh_monument_nearest CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_nearest (
  relation_id INT NOT NULL REFERENCES sh_monument (id),
  monument_id INT NOT NULL REFERENCES sh_monument (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_nearest_monument_id_relation_id_idx ON sh_monument_nearest (monument_id, relation_id);



-- HILFSTABELLE SCHUTZUMFANG
DROP TABLE IF EXISTS sh_monument_scope CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_scope (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_scope_label_idx ON sh_monument_scope (label);



-- TABELLE DENKMALOBJEKT SCHUTZUMFANG
DROP TABLE IF EXISTS sh_monument_x_scope CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_x_scope (
  scope_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES sh_monument(id),
  FOREIGN KEY(scope_id) REFERENCES sh_monument_scope(id)
);



-- HILFSTABELLE BEGRÜNDUNG
DROP TABLE IF EXISTS sh_monument_reason CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_reason (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_reason_label_idx ON sh_monument_reason (label);



-- TABELLE DENKMALOBJEKT BEGRÜNDUNG
DROP TABLE IF EXISTS sh_monument_x_reason CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_x_reason (
  reason_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES sh_monument(id),
  FOREIGN KEY(reason_id) REFERENCES sh_monument_reason(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sh_monument_x_reason_monument_id_reason_id_idx ON sh_monument_x_reason (monument_id, reason_id);
