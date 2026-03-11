import { describe, expect, it } from 'vitest';

import {
  DEFAULT_JOB_ID,
  normalizeExecuteJobPayload,
} from '../../supabase/functions/cron-jobs-maxiconsumo/request.ts';

describe('cron-jobs-maxiconsumo/request', () => {
  it('accepts camelCase jobId payloads', () => {
    expect(
      normalizeExecuteJobPayload({
        jobId: 'weekly_trend_analysis',
        parameters: { force: true },
      }),
    ).toEqual({
      jobId: 'weekly_trend_analysis',
      parameters: { force: true },
    });
  });

  it('accepts snake_case job_id payloads from scheduled SQL jobs', () => {
    expect(
      normalizeExecuteJobPayload({
        job_id: 'realtime_change_alerts',
        parameters: { windowMinutes: 15 },
      }),
    ).toEqual({
      jobId: 'realtime_change_alerts',
      parameters: { windowMinutes: 15 },
    });
  });

  it('falls back to the default job when payload is empty or invalid', () => {
    expect(normalizeExecuteJobPayload(undefined)).toEqual({
      jobId: DEFAULT_JOB_ID,
      parameters: {},
    });
    expect(normalizeExecuteJobPayload({ job_id: '   ' })).toEqual({
      jobId: DEFAULT_JOB_ID,
      parameters: {},
    });
  });

  it('ignores non-object parameters payloads', () => {
    expect(
      normalizeExecuteJobPayload({
        job_id: 'maintenance_cleanup',
        parameters: ['invalid'],
      }),
    ).toEqual({
      jobId: 'maintenance_cleanup',
      parameters: {},
    });
  });
});
