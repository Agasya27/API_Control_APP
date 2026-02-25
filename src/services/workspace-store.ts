import type { AiAnalysis, HttpMethod } from '@/types/api';

export const STORAGE_KEYS = {
  history: 'devapi.workspace.history.v1',
  insightRuns: 'devapi.insights.runs.v1',
} as const;

export interface RunSnapshot {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  responseTime: number;
  createdAt: string;
}

export interface InsightRunRecord {
  runId: string;
  run: RunSnapshot;
  analysis: AiAnalysis | null;
  analysisError?: string;
  apiKeyObservation?: {
    type: 'none' | 'bearer' | 'basic' | 'api-key-header';
    title: string;
    description: string;
    headerName?: string;
  };
}
