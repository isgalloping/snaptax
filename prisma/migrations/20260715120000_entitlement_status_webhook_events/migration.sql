-- Entitlement status for refund/chargeback + durable webhook audit log
ALTER TABLE snaptax_season_entitlements
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason VARCHAR(64),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ(3);

UPDATE snaptax_season_entitlements SET status = 'active' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS snaptax_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_code VARCHAR(64) NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  occurred_at TIMESTAMPTZ(3),
  transaction_id VARCHAR(128),
  adjustment_id VARCHAR(128),
  action VARCHAR(64),
  adjustment_status VARCHAR(64),
  payload JSONB NOT NULL,
  processing_result VARCHAR(32) NOT NULL,
  processing_reason VARCHAR(128),
  entitlement_id UUID,
  status_before VARCHAR(32),
  status_after VARCHAR(32),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT snaptax_webhook_events_channel_event_key UNIQUE (channel_code, event_id)
);

CREATE INDEX IF NOT EXISTS snaptax_webhook_events_transaction_id_idx
  ON snaptax_webhook_events (transaction_id);
CREATE INDEX IF NOT EXISTS snaptax_webhook_events_created_at_idx
  ON snaptax_webhook_events (created_at);
