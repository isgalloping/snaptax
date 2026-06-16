-- Receipt upload idempotency + content dedup fingerprints

ALTER TABLE snaptax_receipts
  ADD COLUMN content_sha256 VARCHAR(64),
  ADD COLUMN image_fingerprint VARCHAR(16);

UPDATE snaptax_receipts
SET
  content_sha256 = encode(digest(id::text, 'sha256'), 'hex'),
  image_fingerprint = lpad(
    to_hex(
      (
        ('x' || left(replace(id::text, '-', ''), 16))::bit(64)
      )::bigint
    ),
    16,
    '0'
  )
WHERE content_sha256 IS NULL;

ALTER TABLE snaptax_receipts
  ALTER COLUMN content_sha256 SET NOT NULL,
  ALTER COLUMN image_fingerprint SET NOT NULL;

CREATE UNIQUE INDEX snaptax_receipts_ghost_content_sha256_uidx
  ON snaptax_receipts (ghost_id, content_sha256)
  WHERE user_id IS NULL AND ghost_id IS NOT NULL;

CREATE UNIQUE INDEX snaptax_receipts_user_content_sha256_uidx
  ON snaptax_receipts (user_id, content_sha256)
  WHERE user_id IS NOT NULL;
