-- Distributed locks for cron jobs (avoid overlapping executions)

CREATE TABLE IF NOT EXISTS public.cron_jobs_locks (
  job_id text PRIMARY KEY,
  locked_until timestamptz NOT NULL,
  locked_by text,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_locks_until
  ON public.cron_jobs_locks (locked_until);

CREATE OR REPLACE FUNCTION public.sp_acquire_job_lock(
  p_job_id text,
  p_lock_seconds integer DEFAULT 300,
  p_owner text DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  INSERT INTO public.cron_jobs_locks (job_id, locked_until, locked_by, updated_at)
  VALUES (
    p_job_id,
    now() + make_interval(secs => p_lock_seconds),
    p_owner,
    now()
  )
  ON CONFLICT (job_id) DO UPDATE
    SET locked_until = EXCLUDED.locked_until,
        locked_by = EXCLUDED.locked_by,
        updated_at = now()
    WHERE public.cron_jobs_locks.locked_until < now();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sp_release_job_lock(
  p_job_id text,
  p_owner text DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  DELETE FROM public.cron_jobs_locks
  WHERE job_id = p_job_id
    AND (p_owner IS NULL OR locked_by = p_owner);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
