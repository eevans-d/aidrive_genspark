const DEFAULT_JOB_ID = 'daily_price_update';

type ExecuteJobPayload = {
  jobId?: unknown;
  job_id?: unknown;
  parameters?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeExecuteJobPayload(payload: unknown): { jobId: string; parameters: Record<string, unknown> } {
  const body: ExecuteJobPayload = isRecord(payload) ? payload : {};
  const rawJobId = body.jobId ?? body.job_id;
  const jobId =
    typeof rawJobId === 'string' && rawJobId.trim().length > 0
      ? rawJobId.trim()
      : DEFAULT_JOB_ID;

  return {
    jobId,
    parameters: isRecord(body.parameters) ? body.parameters : {},
  };
}

export { DEFAULT_JOB_ID };
