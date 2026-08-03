-- Runs once, only when the postgres container initializes an empty data
-- directory (official postgres-image behavior for /docker-entrypoint-initdb.d).
-- POSTGRES_DB in docker-compose.yml creates the dev database; this creates
-- the second database integration tests run against, so tests never touch
-- (or depend on) dev data. See docs/development/project-setup.md.
CREATE DATABASE mosaic_test;
