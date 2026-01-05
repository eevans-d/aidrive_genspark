/**
 * cron-jobs-maxiconsumo - Entry Point Modularizado
 * @module cron-jobs-maxiconsumo
 */

import { executeJob, createExecutionContext, getJobStatus } from './orchestrator.ts';
import { getJobConfig, getAllJobConfigs } from './config.ts';
import type { StructuredLog } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function getEnvOrThrow(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function handleExecute(req: Request, supabaseUrl: string, serviceRoleKey: string, log: StructuredLog): Promise<Response> {
  let body: { jobId?: string; parameters?: Record<string, unknown> } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const jobId = body.jobId || 'daily_price_update';
  const config = getJobConfig(jobId);
  if (!config) return jsonResponse({ error: `Job not found: ${jobId}` }, 404);

  const ctx = createExecutionContext(jobId, log.requestId, 'api', body.parameters);
  console.log(JSON.stringify({ ...log, event: 'EXECUTE_JOB', jobId, runId: ctx.runId }));

  try {
    const result = await executeJob(jobId, ctx, supabaseUrl, serviceRoleKey, log);
    return jsonResponse({ success: true, jobId, runId: ctx.runId, result });
  } catch (e) {
    return jsonResponse({ success: false, jobId, runId: ctx.runId, error: (e as Error).message }, 500);
  }
}

async function handleStatus(supabaseUrl: string, serviceRoleKey: string, log: StructuredLog): Promise<Response> {
  const jobs = getJobStatus();
  
  // Fetch recent executions
  const res = await fetch(
    `${supabaseUrl}/rest/v1/cron_jobs_execution_log?select=*&order=created_at.desc&limit=10`,
    { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
  );
  const recent = res.ok ? await res.json() : [];

  return jsonResponse({
    success: true,
    jobs,
    recent_executions: recent.slice(0, 5),
    timestamp: new Date().toISOString()
  });
}

async function handleMetrics(supabaseUrl: string, serviceRoleKey: string, log: StructuredLog): Promise<Response> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const res = await fetch(
    `${supabaseUrl}/rest/v1/cron_jobs_execution_log?select=*&created_at=gte.${since}`,
    { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
  );
  const executions = res.ok ? await res.json() : [];

  const metrics = {
    total_executions: executions.length,
    successful: executions.filter((e: any) => e.status === 'success').length,
    failed: executions.filter((e: any) => e.status === 'error').length,
    avg_execution_time: executions.length > 0 
      ? Math.round(executions.reduce((s: number, e: any) => s + (e.execution_time_ms || 0), 0) / executions.length)
      : 0
  };

  return jsonResponse({ success: true, metrics, period: '24h', timestamp: new Date().toISOString() });
}

async function handleHealth(supabaseUrl: string, serviceRoleKey: string): Promise<Response> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/cron_jobs_execution_log?select=count&limit=1`, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
    });
    return jsonResponse({ status: res.ok ? 'healthy' : 'degraded', db: res.ok, timestamp: new Date().toISOString() });
  } catch {
    return jsonResponse({ status: 'unhealthy', db: false }, 503);
  }
}

function handleList(): Response {
  return jsonResponse({ success: true, jobs: getAllJobConfigs(), timestamp: new Date().toISOString() });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.pathname.split('/').filter(Boolean).pop() || 'execute';
  const requestId = crypto.randomUUID();
  const log: StructuredLog = { requestId, action, method: req.method, timestamp: new Date().toISOString() };

  console.log(JSON.stringify({ ...log, event: 'REQUEST_START' }));

  try {
    const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
    const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');

    switch (action) {
      case 'execute': return await handleExecute(req, supabaseUrl, serviceRoleKey, log);
      case 'status': return await handleStatus(supabaseUrl, serviceRoleKey, log);
      case 'metrics': return await handleMetrics(supabaseUrl, serviceRoleKey, log);
      case 'health': return await handleHealth(supabaseUrl, serviceRoleKey);
      case 'list': return handleList();
      default: return jsonResponse({ error: 'Unknown action', available: ['execute', 'status', 'metrics', 'health', 'list'] }, 404);
    }
  } catch (e) {
    console.error(JSON.stringify({ ...log, event: 'ERROR', error: (e as Error).message }));
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
