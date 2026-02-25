export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic';
  token?: string;
  username?: string;
  password?: string;
}

export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  body: string;
  auth: AuthConfig;
}

export interface ApiResponse {
  status: number;
  statusText?: string;
  responseTime: number;
  data: unknown;
  headers?: Record<string, string>;
  error?: string;
}

export interface AiAnalysis {
  summary: string;
  designIssues: AnalysisItem[];
  securityIssues: AnalysisItem[];
  suggestions: AnalysisItem[];
  improvedResponse?: unknown;
  openApiSnippet?: string;
}

export interface AnalysisItem {
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export type AnalysisTone = 'professional' | 'strict' | 'friendly';

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
};

export const METHOD_BG_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-method-get/15 border-method-get/30',
  POST: 'bg-method-post/15 border-method-post/30',
  PUT: 'bg-method-put/15 border-method-put/30',
  PATCH: 'bg-method-patch/15 border-method-patch/30',
  DELETE: 'bg-method-delete/15 border-method-delete/30',
};
