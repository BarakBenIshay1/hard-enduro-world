-- Add controlled RecordClassification review actions.
-- This migration is additive only. It does not create, update, or delete
-- RecordClassification rows or any public data records.

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'NEW_RECORD_CLASSIFICATION';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'UPDATE_RECORD_CLASSIFICATION';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'RECORD_CLASSIFICATION_INVALID';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'RECORD_CLASSIFICATION_CONFLICT';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'RECORD_CLASSIFICATION_MISSING_EVIDENCE';
