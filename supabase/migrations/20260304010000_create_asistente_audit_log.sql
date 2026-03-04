-- T15: Persistent audit trail for AI assistant confirmed actions
-- Tracks every action executed via the plan→confirm flow

CREATE TABLE IF NOT EXISTS asistente_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  intent text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  result_success boolean NOT NULL,
  result_data jsonb DEFAULT '{}',
  error_message text,
  request_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE asistente_audit_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own audit records
CREATE POLICY asistente_audit_insert ON asistente_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Authenticated users can read their own audit records
CREATE POLICY asistente_audit_select ON asistente_audit_log
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

-- Index for common queries (by user, most recent first)
CREATE INDEX idx_asistente_audit_log_usuario
  ON asistente_audit_log(usuario_id, created_at DESC);

-- Index for intent-based queries
CREATE INDEX idx_asistente_audit_log_intent
  ON asistente_audit_log(intent, created_at DESC);
