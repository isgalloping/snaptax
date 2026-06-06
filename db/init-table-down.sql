-- Rollback for db/init-table.sql
-- Spec: docs/superpowers/specs/2026-06-05-db-product-alignment-design.md

BEGIN;

DROP TABLE IF EXISTS snaptax_season_entitlements;
DROP TABLE IF EXISTS snaptax_receipts;
DROP TABLE IF EXISTS snaptax_ghost_account;
DROP TABLE IF EXISTS snaptax_users;

COMMIT;
