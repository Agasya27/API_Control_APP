import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  Lightbulb,
  ListChecks,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STORAGE_KEYS, type InsightRunRecord } from '@/services/workspace-store';
import { usePersistentState } from '@/hooks/use-persistent-state';
import type { AnalysisItem } from '@/types/api';

const Insights = () => {
  const [insightRuns, setInsightRuns] = usePersistentState<InsightRunRecord[]>(STORAGE_KEYS.insightRuns, []);
  const [, setHistory] = usePersistentState(STORAGE_KEYS.history, []);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const selectedRecord = useMemo(() => {
    if (!selectedRunId) return null;
    return insightRuns.find((item) => item.runId === selectedRunId) ?? null;
  }, [insightRuns, selectedRunId]);

  const analysis = selectedRecord?.analysis ?? null;

  const designCount = analysis?.designIssues.length ?? 0;
  const securityCount = analysis?.securityIssues.length ?? 0;
  const suggestionCount = analysis?.suggestions.length ?? 0;
  const totalObservations = designCount + securityCount + suggestionCount;

  const urlContext = selectedRecord ? summarizeUrlContext(selectedRecord.run.url) : '';

  const deleteRun = (runId: string) => {
    setInsightRuns((prev) => prev.filter((item) => item.runId !== runId));
    setHistory((prev: Array<{ id: string }>) => prev.filter((item) => item.id !== runId));

    if (selectedRunId === runId) {
      setSelectedRunId(null);
    }
  };

  return (
    <div className="saas-shell flex flex-col h-screen">
      <Header />

      <main className="relative z-10 flex-1 min-h-0 p-3 md:p-4">
        <div className="h-full grid grid-cols-[320px_minmax(0,1fr)] gap-3">
          <section className="surface min-h-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border/70">
              <h2 className="text-sm font-semibold">Stored Insight Runs</h2>
              <p className="text-[11px] text-muted-foreground">Open a previous run to inspect stored insights</p>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {insightRuns.length === 0 ? (
                  <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                    No stored runs yet. Test an API from Workspace first.
                  </div>
                ) : (
                  insightRuns.map((item) => (
                    <article
                      key={item.runId}
                      className={`w-full rounded-lg border p-3 transition-colors ${
                        selectedRunId === item.runId
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      <button className="w-full text-left" onClick={() => setSelectedRunId(item.runId)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-semibold">{item.run.method}</span>
                          <span className="text-[11px] text-muted-foreground">{item.run.responseTime}ms</span>
                        </div>
                        <p className="text-xs text-foreground/90 truncate">{safeHostname(item.run.url)}</p>
                      </button>

                      <div className="flex items-center justify-between mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{item.run.status}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{item.run.createdAt}</span>
                          <button
                            className="h-5 w-5 rounded-sm grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => deleteRun(item.runId)}
                            title="Delete run"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>

          <section className="surface min-h-0 overflow-hidden">
            {!selectedRecord ? (
              <div className="h-full grid place-items-center p-6">
                <div className="text-center max-w-md">
                  <ListChecks className="h-7 w-7 mx-auto text-primary mb-2" />
                  <h3 className="text-base font-semibold">Insights Viewer</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a stored run from the left to open its insights. No run is shown by default.
                  </p>
                </div>
              </div>
            ) : !analysis ? (
              <div className="h-full grid place-items-center p-6">
                <div className="text-center max-w-md w-full">
                  <AlertTriangle className="h-7 w-7 mx-auto text-status-warning mb-2" />
                  <h3 className="text-base font-semibold">No Insights Stored for This Run</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRecord.analysisError ?? 'Insights were not generated for this request.'}
                  </p>

                  <ApiObservationCard
                    title={selectedRecord.apiKeyObservation?.title ?? 'No API Key Detected'}
                    description={selectedRecord.apiKeyObservation?.description ?? 'No explicit API-key style credential was found in this request.'}
                    headerName={selectedRecord.apiKeyObservation?.headerName}
                    urlContext={urlContext}
                    className="mt-4 text-left"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3 p-3">
                <section className="rounded-lg border border-border bg-background p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Observations" value={String(totalObservations)} icon={<Sparkles className="h-4 w-4" />} />
                  <StatCard label="Run Status" value={String(selectedRecord.run.status)} icon={<Shield className="h-4 w-4" />} />
                  <StatCard label="Latency" value={`${selectedRecord.run.responseTime}ms`} icon={<Clock3 className="h-4 w-4" />} />
                  <StatCard label="Stored Runs" value={String(insightRuns.length)} icon={<AlertTriangle className="h-4 w-4" />} />
                </section>

                <ApiObservationCard
                  title={selectedRecord.apiKeyObservation?.title ?? 'No API Key Detected'}
                  description={selectedRecord.apiKeyObservation?.description ?? 'No explicit API-key style credential was found in this request.'}
                  headerName={selectedRecord.apiKeyObservation?.headerName}
                  urlContext={urlContext}
                />

                <section className="rounded-lg border border-border bg-background p-3 min-h-0 overflow-hidden grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-3">
                  <div className="grid grid-rows-[1fr_1fr] gap-3 min-h-0">
                    <InsightListCard
                      title="Design Findings"
                      items={analysis.designIssues}
                      icon={<AlertTriangle className="h-4 w-4" />}
                      emptyLabel="No design findings available."
                    />
                    <InsightListCard
                      title="Security Findings"
                      items={analysis.securityIssues}
                      icon={<Shield className="h-4 w-4" />}
                      emptyLabel="No security findings available."
                    />
                  </div>

                  <RecommendationBoard
                    suggestions={analysis.suggestions}
                    openApiSnippet={analysis.openApiSnippet}
                    improvedResponse={analysis.improvedResponse}
                  />
                </section>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: ReactNode }) => (
  <div className="rounded-lg border border-border bg-muted/20 p-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
      {icon}
      {label}
    </div>
    <p className="text-lg font-semibold text-foreground">{value}</p>
  </div>
);

const ApiObservationCard = ({
  title,
  description,
  headerName,
  urlContext,
  className,
}: {
  title: string;
  description: string;
  headerName?: string;
  urlContext: string;
  className?: string;
}) => (
  <section className={`rounded-lg border border-border bg-background p-3 ${className ?? ''}`}>
    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">API Key + URL Observation</p>
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {headerName && <Badge variant="outline" className="text-[10px]">{headerName}</Badge>}
    </div>
    <p className="text-xs text-muted-foreground leading-5">{description}</p>
    <p className="text-xs text-muted-foreground leading-5 mt-1.5">URL Context: {urlContext}</p>
  </section>
);

const InsightListCard = ({
  title,
  items,
  icon,
  emptyLabel,
}: {
  title: string;
  items: AnalysisItem[];
  icon: ReactNode;
  emptyLabel: string;
}) => (
  <section className="rounded-lg border border-border bg-background p-3 flex flex-col min-h-0">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-sm font-semibold">{title}</h3>
      <Badge variant="secondary" className="ml-auto text-[10px]">{items.length}</Badge>
    </div>

    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground">{emptyLabel}</p>
    ) : (
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-2">
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-md border border-border/70 bg-muted/30 p-2.5">
              <p className="text-xs font-semibold mb-0.5">{item.title}</p>
              <p className="text-[11px] text-muted-foreground leading-5">{item.description}</p>
            </article>
          ))}
        </div>
      </ScrollArea>
    )}
  </section>
);

const RecommendationBoard = ({
  suggestions,
  openApiSnippet,
  improvedResponse,
}: {
  suggestions: AnalysisItem[];
  openApiSnippet?: string;
  improvedResponse?: unknown;
}) => (
  <section className="rounded-lg border border-border bg-background p-3 flex flex-col min-h-0">
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="h-4 w-4" />
      <h3 className="text-sm font-semibold">Recommendations Unit</h3>
      <Badge variant="secondary" className="ml-auto text-[10px]">{suggestions.length}</Badge>
    </div>

    <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-3 min-h-0">
      <ScrollArea className="min-h-0 pr-1">
        {suggestions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recommendations available.</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-md border border-border/70 bg-muted/30 p-2.5">
                <p className="text-xs font-semibold mb-1">{index + 1}. {item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-5">{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <ArtifactHint title="OpenAPI Snippet" value={openApiSnippet ? 'Available' : 'Not generated'} />
        <ArtifactHint title="Improved Response" value={improvedResponse ? 'Available' : 'Not generated'} />
      </div>
    </div>
  </section>
);

const ArtifactHint = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-md border border-border/70 bg-muted/20 p-2">
    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
    <p className="text-xs font-medium">{value}</p>
  </div>
);

function summarizeUrlContext(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);
    const lowered = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();

    if (lowered.includes('weather') || lowered.includes('forecast') || lowered.includes('meteo')) {
      return 'This URL appears to belong to a weather/forecast API and likely returns weather conditions for the provided location/time parameters.';
    }

    if (lowered.includes('auth') || lowered.includes('token') || lowered.includes('login')) {
      return 'This URL appears to be related to authentication/token workflows.';
    }

    if (lowered.includes('user') || lowered.includes('profile') || lowered.includes('account')) {
      return 'This URL appears to return user/account related data.';
    }

    if (lowered.includes('payment') || lowered.includes('billing') || lowered.includes('invoice')) {
      return 'This URL appears to be for payments or billing operations.';
    }

    return 'This URL appears to be a general API endpoint returning data for the requested resource.';
  } catch {
    return 'Unable to infer URL context due to invalid URL format.';
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default Insights;
