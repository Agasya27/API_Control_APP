import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';
import Header from '@/components/Header';
import RequestBuilder from '@/components/RequestBuilder';
import ResponseViewer from '@/components/ResponseViewer';
import WorkspaceSidebar, { type RequestHistoryItem, type WorkspaceStats } from '@/components/WorkspaceSidebar';
import { analyzeResponse, sendRequest } from '@/services/api';
import { STORAGE_KEYS, type InsightRunRecord, type RunSnapshot } from '@/services/workspace-store';
import type { ApiRequest, ApiResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePersistentState } from '@/hooks/use-persistent-state';

const Index = () => {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = usePersistentState<RequestHistoryItem[]>(STORAGE_KEYS.history, []);
  const [insightRuns, setInsightRuns] = usePersistentState<InsightRunRecord[]>(STORAGE_KEYS.insightRuns, []);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [presetRequest, setPresetRequest] = useState<ApiRequest | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const stats = useMemo<WorkspaceStats>(() => {
    if (history.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        avgResponseTime: 0,
        lastRunAt: null,
      };
    }

    const successfulRuns = history.filter((item) => item.status >= 200 && item.status < 300).length;
    const totalLatency = history.reduce((sum, item) => sum + item.responseTime, 0);

    return {
      totalRuns: history.length,
      successRate: Math.round((successfulRuns / history.length) * 100),
      avgResponseTime: Math.round(totalLatency / history.length),
      lastRunAt: history[0]?.createdAt ?? null,
    };
  }, [history]);

  const handleSend = useCallback(async (request: ApiRequest) => {
    setIsLoading(true);
    setResponse(null);

    const runId = crypto.randomUUID();

    try {
      const startedAt = performance.now();
      const nextResponse = await sendRequest(request);
      const duration = Math.round(performance.now() - startedAt);
      const responseTime = nextResponse.responseTime || duration;
      const run = buildRunSnapshot(runId, request, nextResponse.status, responseTime);

      setResponse(nextResponse);
      setPresetRequest(request);
      setSelectedRunId(runId);
      appendHistory(run, request, nextResponse, setHistory);

      try {
        const nextAnalysis = await analyzeResponse(request, nextResponse, 'professional');
        upsertInsightRun(
          {
            runId,
            run,
            analysis: nextAnalysis,
            apiKeyObservation: deriveApiKeyObservation(request),
          },
          setInsightRuns
        );
      } catch (analysisError: unknown) {
        const message = analysisError instanceof Error ? analysisError.message : 'Analysis unavailable';
        upsertInsightRun(
          {
            runId,
            run,
            analysis: null,
            analysisError: message,
            apiKeyObservation: deriveApiKeyObservation(request),
          },
          setInsightRuns
        );
        toast({
          title: 'Analysis unavailable',
          description: message,
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed';
      toast({ title: 'Request failed', description: message, variant: 'destructive' });
      setResponse({ status: 0, responseTime: 0, data: null, error: message });

      const run = buildRunSnapshot(runId, request, 0, 0);
      setPresetRequest(request);
      setSelectedRunId(runId);
      appendHistory(run, request, { status: 0, responseTime: 0, data: null, error: message }, setHistory);
      upsertInsightRun(
        {
          runId,
          run,
          analysis: null,
          analysisError: message,
          apiKeyObservation: deriveApiKeyObservation(request),
        },
        setInsightRuns
      );
    } finally {
      setIsLoading(false);
    }
  }, [setHistory, setInsightRuns, toast]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setInsightRuns([]);
    setSelectedRunId(null);
    setPresetRequest(null);
    setResponse(null);
  }, [setHistory, setInsightRuns]);

  const deleteRun = useCallback((runId: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== runId));
    setInsightRuns((prev) => prev.filter((item) => item.runId !== runId));
    if (selectedRunId === runId) {
      setSelectedRunId(null);
      setPresetRequest(null);
      setResponse(null);
    }
  }, [selectedRunId, setHistory, setInsightRuns]);

  const selectRun = useCallback((runId: string) => {
    const run = history.find((item) => item.id === runId);
    if (!run) return;

    setSelectedRunId(runId);
    setPresetRequest(run.request ?? buildFallbackRequest(run));
    setResponse(
      run.response ?? {
        status: run.status,
        responseTime: run.responseTime,
        data: null,
        error: 'No stored payload for this run. Execute this request again to capture full response data.',
      }
    );
  }, [history]);

  if (isMobile) {
    return (
      <div className="saas-shell flex flex-col h-screen">
        <Header />
        <main className="relative z-10 flex-1 overflow-auto p-3 space-y-3">
          <section className="surface min-h-[360px]">
            <RequestBuilder onSend={handleSend} isLoading={isLoading} presetRequest={presetRequest} />
          </section>
          <section className="surface min-h-[360px]"><ResponseViewer response={response} isLoading={isLoading} /></section>
          <section className="surface min-h-[260px]">
            <WorkspaceSidebar
              history={history}
              stats={stats}
              onClearHistory={clearHistory}
              onDeleteRun={deleteRun}
              onSelectRun={selectRun}
              selectedRunId={selectedRunId}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="saas-shell flex flex-col h-screen">
      <Header />

      <main className="relative z-10 flex-1 min-h-0 p-3 md:p-4">
        <div className="h-full grid grid-cols-[260px_minmax(0,1fr)] gap-3">
          <section className="surface min-h-0 overflow-hidden">
            <WorkspaceSidebar
              history={history}
              stats={stats}
              onClearHistory={clearHistory}
              onDeleteRun={deleteRun}
              onSelectRun={selectRun}
              selectedRunId={selectedRunId}
            />
          </section>

          <section className="surface min-h-0 overflow-hidden grid grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="border-b border-border/70 min-h-0 overflow-hidden">
              <RequestBuilder onSend={handleSend} isLoading={isLoading} presetRequest={presetRequest} />
            </div>
            <div className="min-h-0 overflow-hidden">
              <ResponseViewer response={response} isLoading={isLoading} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function buildRunSnapshot(
  runId: string,
  request: ApiRequest,
  status: number,
  responseTime: number
): RunSnapshot {
  const timestamp = new Date();

  return {
    id: runId,
    method: request.method,
    url: request.url,
    status,
    responseTime,
    createdAt: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function appendHistory(
  run: RunSnapshot,
  request: ApiRequest,
  response: ApiResponse,
  setHistory: Dispatch<SetStateAction<RequestHistoryItem[]>>
): void {
  setHistory((prev) => [
    {
      id: run.id,
      method: run.method,
      url: run.url,
      status: run.status,
      responseTime: run.responseTime,
      createdAt: run.createdAt,
      request,
      response,
    },
    ...prev,
  ].slice(0, 50));
}

function buildFallbackRequest(run: RequestHistoryItem): ApiRequest {
  return {
    method: run.method,
    url: run.url,
    headers: [],
    body: '{\n  \n}',
    auth: { type: 'none' },
  };
}

function upsertInsightRun(
  record: InsightRunRecord,
  setInsightRuns: Dispatch<SetStateAction<InsightRunRecord[]>>
): void {
  setInsightRuns((prev) => {
    const filtered = prev.filter((item) => item.runId !== record.runId);
    return [record, ...filtered].slice(0, 100);
  });
}

function deriveApiKeyObservation(request: ApiRequest): InsightRunRecord['apiKeyObservation'] {
  if (request.auth.type === 'bearer' && request.auth.token) {
    return {
      type: 'bearer',
      title: 'Bearer Token Auth',
      description:
        'This run used a Bearer token in the Authorization header. Usually this represents an app/user access token.',
      headerName: 'Authorization',
    };
  }

  if (request.auth.type === 'basic' && request.auth.username) {
    return {
      type: 'basic',
      title: 'Basic Auth Credentials',
      description:
        'This run used Basic authentication (username/password) encoded in Authorization header.',
      headerName: 'Authorization',
    };
  }

  const apiKeyHeader = request.headers
    .filter((header) => header.enabled)
    .find((header) =>
      ['x-api-key', 'api-key', 'apikey', 'x-rapidapi-key'].includes(header.key.trim().toLowerCase())
    );

  if (apiKeyHeader) {
    return {
      type: 'api-key-header',
      title: 'API Key Header',
      description:
        'This run used an API key style header. This usually identifies your app/project for quota and access control.',
      headerName: apiKeyHeader.key,
    };
  }

  return {
    type: 'none',
    title: 'No API Key Detected',
    description:
      'No explicit API-key style credential was found in this request. Endpoint may be public or use a different auth mechanism.',
  };
}

export default Index;
