/* POSTGIS ERWEITERUNG LADEN */
CREATE EXTENSION IF NOT EXISTS postgis;



/* TABELLE POLYGON DENKMALOBJEKT */
DROP TABLE IF EXISTS monument_boundary CASCADE;

CREATE TABLE IF NOT EXISTS monument_boundary (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  object_id INT,
  geometry geometry
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_boundary_object_id_idx ON monument_boundary (object_id);



/* TABELLE DENKMALOBJEKTE */
DROP TABLE IF EXISTS monuments CASCADE;

CREATE TABLE IF NOT EXISTS monuments (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  object_id INT,
  address VARCHAR,
  image_url VARCHAR,
  designation VARCHAR,
  description VARCHAR,
  administrative VARCHAR,
  monument_type VARCHAR,
  postal_code VARCHAR,
  place_name VARCHAR,
  geometry geometry
);

CREATE INDEX IF NOT EXISTS monuments_object_id_idx ON monuments (object_id);



/* HILFSTABELLE SCHUTZUMFANG */
DROP TABLE IF EXISTS monument_scope CASCADE;

CREATE TABLE IF NOT EXISTS monument_scope (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_scope_label_idx ON monument_scope (label);



/* TABELLE DENKMALOBJEKT SCHUTZUMFANG */
DROP TABLE IF EXISTS monument_x_scope CASCADE;

CREATE TABLE IF NOT EXISTS monument_x_scope (
  scope_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES monuments(id),
  FOREIGN KEY(scope_id) REFERENCES monument_scope(id)
);



/* HILFSTABELLE BEGRÜNDUNG */
DROP TABLE IF EXISTS monument_reason CASCADE;

CREATE TABLE IF NOT EXISTS monument_reason (
  id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_reason_label_idx ON monument_reason (label);



/* TABELLE DENKMALOBJEKT BEGRÜNDUNG */
DROP TABLE IF EXISTS monument_x_reason CASCADE;

CREATE TABLE IF NOT EXISTS monument_x_reason (
  reason_id INT NOT NULL,
  monument_id INT NOT NULL,
  FOREIGN KEY(monument_id) REFERENCES monuments(id),
  FOREIGN KEY(reason_id) REFERENCES monument_reason(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_x_reason_monument_id_reason_id_idx ON monument_x_reason (monument_id, reason_id);
