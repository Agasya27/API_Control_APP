import type { ApiRequest, ApiResponse, AiAnalysis, AnalysisTone } from '@/types/api';
import { mockApiResponse, mockAiAnalysis } from './mock-data';

const LOCAL_DEV_API = 'http://localhost:3001';

function normalizeApiBaseUrl(value: string | undefined): string {
  const raw = value?.trim() ?? '';

  if (!raw) {
    return '';
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.replace(/\/api$/i, '');
}

function resolveApiBaseUrl(): string {
  const configured = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return LOCAL_DEV_API;
    }
  }

  return '';
}

const API_BASE_URL = resolveApiBaseUrl();
const MOCK_OVERRIDE = import.meta.env.VITE_API_MOCK_MODE;
const MOCK_MODE = MOCK_OVERRIDE === 'true' ? true : MOCK_OVERRIDE === 'false' ? false : API_BASE_URL.length === 0;

export function getApiRuntimeConfig(): { mode: 'mock' | 'live'; baseUrl: string | null } {
  return {
    mode: MOCK_MODE ? 'mock' : 'live',
    baseUrl: MOCK_MODE ? null : API_BASE_URL,
  };
}

export class ApiServiceError extends Error {
  public readonly status?: number;
  public readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.code = code;
  }
}

async function readErrorResponse(response: Response): Promise<ApiServiceError> {
  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message || `Request failed with status ${response.status}`;
  const code = payload?.error?.code;
  return new ApiServiceError(message, response.status, code);
}

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Network request failed';

    throw new ApiServiceError(
      `Cannot reach backend at ${API_BASE_URL || '(unset base URL)'}: ${message}`,
      undefined,
      'BACKEND_UNREACHABLE'
    );
  }

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  return (await response.json()) as T;
}

function toHeadersObject(request: ApiRequest): Record<string, string> {
  return Object.fromEntries(
    request.headers
      .filter((header) => header.enabled && header.key)
      .map((header) => [header.key, header.value])
  );
}

function parseRequestBody(method: ApiRequest['method'], body: string): unknown {
  if (method === 'GET' || method === 'DELETE' || body.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function normalizeAnalysis(data: unknown): AiAnalysis {
  const input = (data ?? {}) as Record<string, unknown>;

  return {
    summary: typeof input.summary === 'string' ? input.summary : 'No analysis summary available.',
    designIssues: Array.isArray(input.designIssues)
      ? (input.designIssues as AiAnalysis['designIssues'])
      : [],
    securityIssues: Array.isArray(input.securityIssues)
      ? (input.securityIssues as AiAnalysis['securityIssues'])
      : [],
    suggestions: Array.isArray(input.suggestions)
      ? (input.suggestions as AiAnalysis['suggestions'])
      : [],
    improvedResponse: input.improvedResponse,
    openApiSnippet: typeof input.openApiSnippet === 'string' ? input.openApiSnippet : undefined,
  };
}

export async function sendRequest(request: ApiRequest): Promise<ApiResponse> {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
    return {
      ...mockApiResponse,
      responseTime: Math.round(120 + Math.random() * 250),
    };
  }

  return requestJson<ApiResponse>('/api/proxy', {
    method: request.method,
    url: request.url,
    headers: toHeadersObject(request),
    body: parseRequestBody(request.method, request.body),
    auth: request.auth.type === 'none' ? undefined : request.auth,
  });
}

export async function analyzeResponse(
  request: ApiRequest,
  response: ApiResponse,
  _tone: AnalysisTone = 'professional'
): Promise<AiAnalysis> {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));
    return mockAiAnalysis;
  }

  const result = await requestJson<unknown>('/api/analyze', {
    method: request.method,
    url: request.url,
    status: response.status,
    response: response.data,
  });

  return normalizeAnalysis(result);
}

export async function executeRequestWithAnalysis(
  request: ApiRequest,
  tone: AnalysisTone = 'professional'
): Promise<{ response: ApiResponse; analysis: AiAnalysis }> {
  const response = await sendRequest(request);
  const analysis = await analyzeResponse(request, response, tone);
  return { response, analysis };
}
