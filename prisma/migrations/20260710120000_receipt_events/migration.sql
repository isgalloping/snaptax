-- Phase 2 Event Queue spike: append-only receipt lifecycle events

CREATE TABLE snaptax_receipt_events (
  id                 UUID PRIMARY KEY,
  receipt_id         UUID NOT NULL,
  user_id            UUID,
  ghost_id           VARCHAR(255),
  event_type         VARCHAR(64) NOT NULL,
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_created_at  TIMESTAMPTZ(3) NOT NULL,
  created_at         TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX snaptax_receipt_events_user_created_idx
  ON snaptax_receipt_events (user_id, client_created_at);

CREATE INDEX snaptax_receipt_events_ghost_created_idx
  ON snaptax_receipt_events (ghost_id, client_created_at);
