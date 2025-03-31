-- POSTGIS ERWEITERUNG LADEN
CREATE EXTENSION IF NOT EXISTS postgis;


-- TABELLE GEOMETRIEN DENKMALLISTE
DROP TABLE IF EXISTS sh_monument_boundary CASCADE;

CREATE TABLE IF NOT EXISTS sh_monument_boundary (
    id SERIAL PRIMARY KEY,
    layer_name TEXT NOT NULL,
    district TEXT NOT NULL,
    municipality TEXT NOT NULL,
    street TEXT,
    housenumber TEXT,
    description TEXT,
    monument_type TEXT,
    monument_function TEXT,
    object_number TEXT UNIQUE NOT NULL,
    photo_link TEXT,
    detail_link TEXT,
    last_update DATE,
    wkb_geometry GEOMETRY(GEOMETRY, 4326) NOT NULL
);


-- INDEX
CREATE INDEX IF NOT EXISTS idx_sh_monument_boundary_object_number ON sh_monument_boundary (object_number);

-- GEOMETRY INDEX
CREATE INDEX IF NOT EXISTS idx_sh_monument_boundary_wkb_geometry ON sh_monument_boundary USING GIST (wkb_geometry);
