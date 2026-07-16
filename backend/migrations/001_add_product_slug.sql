-- Adds the "slug" column used for /productPage/<slug> URLs.
-- MUST be run against the production database before deploying this change —
-- sequelize.sync() (used in server.js) does not add columns to existing
-- tables, only creates missing tables. Without this, every product
-- create/update/fetch will fail with "Unknown column 'slug' in ..." once the
-- updated Product model is deployed.
--
-- Run with, e.g.:
--   mysql -u <user> -p <database> < 001_add_product_slug.sql

ALTER TABLE products ADD COLUMN slug VARCHAR(255) NULL;
ALTER TABLE products ADD UNIQUE INDEX products_slug_unique (slug);
