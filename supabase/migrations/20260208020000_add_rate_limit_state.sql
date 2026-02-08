-- =============================================================================
-- Rate Limit State (shared across Edge Function instances)
-- =============================================================================
-- D-063: Tabla Supabase para rate limit compartido cross-instancia.
-- Solo accesible via service_role (nunca expuesto a usuarios).

CREATE TABLE IF NOT EXISTS rate_limit_state (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_state_updated
  ON rate_limit_state (updated_at);

-- RPC atomico para check + increment
CREATE OR REPLACE FUNCTION sp_check_rate_limit(
  p_key TEXT,
  p_limit INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- UPSERT atomico: insert or update in single statement
  INSERT INTO rate_limit_state (key, count, window_start, updated_at)
  VALUES (p_key, 1, NOW(), NOW())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limit_state.window_start + (p_window_seconds || ' seconds')::INTERVAL < NOW()
      THEN 1  -- Window expired: reset
      ELSE rate_limit_state.count + 1
    END,
    window_start = CASE
      WHEN rate_limit_state.window_start + (p_window_seconds || ' seconds')::INTERVAL < NOW()
      THEN NOW()  -- Window expired: new window
      ELSE rate_limit_state.window_start
    END,
    updated_at = NOW()
  RETURNING rate_limit_state.count, rate_limit_state.window_start
  INTO v_count, v_window_start;

  v_window_end := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;

  RETURN QUERY SELECT
    v_count <= p_limit AS allowed,
    GREATEST(0, p_limit - v_count)::INTEGER AS remaining,
    v_window_end AS reset_at;
END;
$$;

-- Cleanup: remove stale entries older than 5 minutes
CREATE OR REPLACE FUNCTION sp_cleanup_rate_limit_state()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limit_state
  WHERE updated_at < NOW() - INTERVAL '5 minutes';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Permissions: ONLY service_role can call these
REVOKE ALL ON TABLE rate_limit_state FROM PUBLIC;
REVOKE ALL ON FUNCTION sp_check_rate_limit FROM PUBLIC;
REVOKE ALL ON FUNCTION sp_cleanup_rate_limit_state FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rate_limit_state TO service_role;
GRANT EXECUTE ON FUNCTION sp_check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION sp_cleanup_rate_limit_state TO service_role;
