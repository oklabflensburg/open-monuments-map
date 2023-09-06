/* POSTGIS ERWEITERUNG LADEN */
CREATE EXTENSION IF NOT EXISTS postgis;




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
  geometry geography,
  PRIMARY KEY(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_object_id_idx ON monuments (object_id);



/* TABELLE POLYGON DENKMALOBJEKT */
DROP TABLE IF EXISTS monument_boundaries CASCADE;

CREATE TABLE IF NOT EXISTS monument_boundaries (
  id SERIAL,
  object_id INT,
  geometry geography,
  PRIMARY KEY(id),
  FOREIGN KEY(object_id) REFERENCES monuments(object_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monument_boundaries_object_id_idx ON monument_boundaries (object_id);



/* HILFSTABELLE SCHUTZUMFANG */
DROP TABLE IF EXISTS monument_scope CASCADE;

CREATE TABLE IF NOT EXISTS monument_scope (
  id SERIAL,
  label VARCHAR,
  PRIMARY KEY(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS monuments_scope_label_idx ON monument_scope (label);



/* TABELLE DENKMALOBJEKT SCHUTZUMFANG */
DROP TABLE IF EXISTS monument_object_scope CASCADE;

CREATE TABLE IF NOT EXISTS monument_object_scope (
  object_id INT,
  scope_id INT,
  FOREIGN KEY(object_id) REFERENCES monuments(object_id),
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
DROP TABLE IF EXISTS monument_object_reason CASCADE;

CREATE TABLE IF NOT EXISTS monument_object_reason (
  object_id INT,
  reason_id INT,
  FOREIGN KEY(object_id) REFERENCES monuments(object_id),
  FOREIGN KEY(reason_id) REFERENCES monument_reason(id)
);
