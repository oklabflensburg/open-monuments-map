-- POSTGIS ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;


-- TABELLE DENKMALOBJEKTE
DROP TABLE IF EXISTS sh_monument CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument (
    id SERIAL PRIMARY KEY,
    object_number TEXT UNIQUE,
    monument_type TEXT,
    address_location TEXT,
    description TEXT,
    designation TEXT,
    protection_scope JSONB,
    municipality TEXT,
    justification JSONB,
    district TEXT,
    image_url TEXT
);

CREATE INDEX IF NOT EXISTS monument_object_number_idx ON sh_monument (object_number);
