/**
 * API Client for the AI Assistant (Sprint 1: read-only)
 *
 * Communicates with the api-assistant edge function.
 * Follows the same auth pattern as apiClient.ts.
 */

import { supabase } from './supabase';
import { ApiError, TimeoutError } from './apiClient';

const ASSISTANT_BASE_URL =
  import.meta.env.VITE_API_ASSISTANT_URL ||
  `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/api-assistant`;

const DEFAULT_TIMEOUT_MS = 20_000;

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string | null;
  confidence?: number;
  data?: unknown;
  suggestions?: string[];
  timestamp: string;
}

export interface AssistantResponseData {
  intent: string | null;
  confidence: number;
  mode: 'answer' | 'clarify';
  answer: string;
  data: unknown;
  request_id: string;
  suggestions?: string[];
}

interface AssistantApiResponse {
  success: boolean;
  data?: AssistantResponseData;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function sendMessage(
  message: string,
  context?: { ui_route?: string; timezone?: string },
): Promise<AssistantResponseData> {
  const token = await getAuthToken();

  if (!token) {
    throw new ApiError('AUTH_REQUIRED', 'Authentication required', 401);
  }

  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${ASSISTANT_BASE_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-request-id': requestId,
      },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });

    const json: AssistantApiResponse = await response.json();

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.code || 'ASSISTANT_ERROR',
        json.error?.message || 'Error del asistente',
        response.status,
        undefined,
        json.requestId || requestId,
      );
    }

    return json.data!;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(DEFAULT_TIMEOUT_MS, '/assistant/message', requestId);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const assistantApi = { sendMessage };
