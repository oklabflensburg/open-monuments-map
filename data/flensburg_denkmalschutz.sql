/* POSTGIS ERWEITERUNG LADEN */
CREATE EXTENSION IF NOT EXISTS postgis;



/* TABELLE POLYGON DENKMALOBJEKT */
DROP TABLE IF EXISTS monument_boundary CASCADE;

CREATE TABLE IF NOT EXISTS monument_boundary (
  id SERIAL,
  object_id INT NOT NULL,
  geometry geometry,
  PRIMARY KEY(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_boundary_object_id_idx ON monument_boundary (object_id);



/* TABELLE DENKMALOBJEKTE */
DROP TABLE IF EXISTS monuments CASCADE;

CREATE TABLE IF NOT EXISTS monuments (
  id SERIAL,
  object_id INT,
  scope_id INT,
  reason_id INT,
  model VARCHAR,
  address VARCHAR,
  authority VARCHAR,
  district VARCHAR,
  image_url VARCHAR,
  designation VARCHAR,
  postal_code VARCHAR,
  description TEXT,
  geometry geometry,
  PRIMARY KEY(id),
  FOREIGN KEY(object_id) REFERENCES monument_boundary(object_id)
);

CREATE INDEX IF NOT EXISTS monuments_object_id_idx ON monuments (object_id);



/* HILFSTABELLE SCHUTZUMFANG */
DROP TABLE IF EXISTS monument_scope CASCADE;

CREATE TABLE IF NOT EXISTS monument_scope (
  id SERIAL,
  label VARCHAR,
  PRIMARY KEY(id)
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
  id SERIAL,
  label VARCHAR,
  PRIMARY KEY(id)
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
