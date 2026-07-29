-- Event Store follow-up: sync cursor, lifecycle snapshots, prune index

CREATE INDEX snaptax_receipt_events_client_created_idx
  ON snaptax_receipt_events (client_created_at);

CREATE TABLE snaptax_receipt_sync_cursors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE,
  ghost_id              VARCHAR(255) UNIQUE,
  last_event_id         UUID NOT NULL,
  last_client_created_at TIMESTAMPTZ(3) NOT NULL,
  updated_at            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT snaptax_receipt_sync_cursors_actor_chk CHECK (
    (user_id IS NOT NULL AND ghost_id IS NULL)
    OR (user_id IS NULL AND ghost_id IS NOT NULL)
  )
);

CREATE TABLE snaptax_receipt_lifecycle_snapshots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id         UUID NOT NULL,
  user_id            UUID,
  ghost_id           VARCHAR(255),
  source_event_id    UUID NOT NULL UNIQUE,
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_created_at  TIMESTAMPTZ(3) NOT NULL,
  created_at         TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX snaptax_receipt_lifecycle_snapshots_receipt_created_idx
  ON snaptax_receipt_lifecycle_snapshots (receipt_id, client_created_at);

CREATE INDEX snaptax_receipt_lifecycle_snapshots_user_created_idx
  ON snaptax_receipt_lifecycle_snapshots (user_id, client_created_at);

CREATE INDEX snaptax_receipt_lifecycle_snapshots_ghost_created_idx
  ON snaptax_receipt_lifecycle_snapshots (ghost_id, client_created_at);

COMMENT ON TABLE snaptax_receipt_sync_cursors IS 'Per-actor high-water mark for ingested receipt lifecycle events';
COMMENT ON TABLE snaptax_receipt_lifecycle_snapshots IS 'Append-only receipt state snapshots from TAX_CALCULATED events';
