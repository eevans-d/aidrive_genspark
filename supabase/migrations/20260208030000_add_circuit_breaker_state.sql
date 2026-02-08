-- =============================================================================
-- Circuit Breaker State (semi-persistent, shared across instances)
-- =============================================================================
-- Persists only the critical breaker (api-minimarket-db).
-- Only accessible via service_role.

CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  breaker_key TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half_open')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RPC to record success/failure and transition state
CREATE OR REPLACE FUNCTION sp_circuit_breaker_record(
  p_key TEXT,
  p_event TEXT,              -- 'success' or 'failure'
  p_failure_threshold INTEGER DEFAULT 5,
  p_success_threshold INTEGER DEFAULT 2,
  p_open_timeout_seconds INTEGER DEFAULT 30
)
RETURNS TABLE(
  current_state TEXT,
  allows_request BOOLEAN,
  failures INTEGER,
  successes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state TEXT;
  v_failure_count INTEGER;
  v_success_count INTEGER;
  v_opened_at TIMESTAMPTZ;
BEGIN
  -- Ensure row exists
  INSERT INTO circuit_breaker_state (breaker_key)
  VALUES (p_key)
  ON CONFLICT (breaker_key) DO NOTHING;

  -- Lock the row
  SELECT state, failure_count, success_count, opened_at
  INTO v_state, v_failure_count, v_success_count, v_opened_at
  FROM circuit_breaker_state
  WHERE breaker_key = p_key
  FOR UPDATE;

  -- Auto-transition open -> half_open if timeout elapsed
  IF v_state = 'open' AND v_opened_at IS NOT NULL
     AND v_opened_at + (p_open_timeout_seconds || ' seconds')::INTERVAL < NOW()
  THEN
    v_state := 'half_open';
    v_failure_count := 0;
    v_success_count := 0;
  END IF;

  -- Process event
  IF p_event = 'success' THEN
    IF v_state = 'half_open' THEN
      v_success_count := v_success_count + 1;
      IF v_success_count >= p_success_threshold THEN
        v_state := 'closed';
        v_failure_count := 0;
        v_success_count := 0;
        v_opened_at := NULL;
      END IF;
    ELSE
      -- In closed state, success resets failure count
      v_failure_count := 0;
    END IF;
  ELSIF p_event = 'failure' THEN
    IF v_state != 'open' THEN
      v_failure_count := v_failure_count + 1;
      IF v_failure_count >= p_failure_threshold THEN
        v_state := 'open';
        v_opened_at := NOW();
      END IF;
    END IF;
  END IF;

  -- Persist
  UPDATE circuit_breaker_state SET
    state = v_state,
    failure_count = v_failure_count,
    success_count = v_success_count,
    opened_at = v_opened_at,
    last_failure_at = CASE WHEN p_event = 'failure' THEN NOW() ELSE last_failure_at END,
    updated_at = NOW()
  WHERE breaker_key = p_key;

  RETURN QUERY SELECT
    v_state AS current_state,
    (v_state != 'open') AS allows_request,
    v_failure_count AS failures,
    v_success_count AS successes;
END;
$$;

-- RPC to check current state (read-only, for pre-request check)
CREATE OR REPLACE FUNCTION sp_circuit_breaker_check(
  p_key TEXT,
  p_open_timeout_seconds INTEGER DEFAULT 30
)
RETURNS TABLE(
  current_state TEXT,
  allows_request BOOLEAN,
  failures INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state TEXT;
  v_failure_count INTEGER;
  v_opened_at TIMESTAMPTZ;
BEGIN
  SELECT state, failure_count, opened_at
  INTO v_state, v_failure_count, v_opened_at
  FROM circuit_breaker_state
  WHERE breaker_key = p_key;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'closed'::TEXT, TRUE, 0;
    RETURN;
  END IF;

  -- Auto-transition
  IF v_state = 'open' AND v_opened_at IS NOT NULL
     AND v_opened_at + (p_open_timeout_seconds || ' seconds')::INTERVAL < NOW()
  THEN
    v_state := 'half_open';
  END IF;

  RETURN QUERY SELECT
    v_state,
    (v_state != 'open'),
    v_failure_count;
END;
$$;

-- Permissions
REVOKE ALL ON TABLE circuit_breaker_state FROM PUBLIC;
REVOKE ALL ON FUNCTION sp_circuit_breaker_record FROM PUBLIC;
REVOKE ALL ON FUNCTION sp_circuit_breaker_check FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON TABLE circuit_breaker_state TO service_role;
GRANT EXECUTE ON FUNCTION sp_circuit_breaker_record TO service_role;
GRANT EXECUTE ON FUNCTION sp_circuit_breaker_check TO service_role;
