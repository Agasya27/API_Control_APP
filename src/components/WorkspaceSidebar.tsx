import type { ReactNode } from 'react';
import { Clock3, FolderKanban, Globe2, Layers2, Plus, Server, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { HttpMethod } from '@/types/api';
import type { ApiRequest, ApiResponse } from '@/types/api';

export interface RequestHistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  responseTime: number;
  createdAt: string;
  request?: ApiRequest;
  response?: ApiResponse;
}

export interface WorkspaceStats {
  totalRuns: number;
  successRate: number;
  avgResponseTime: number;
  lastRunAt: string | null;
}

interface Props {
  history: RequestHistoryItem[];
  stats: WorkspaceStats;
  onClearHistory: () => void;
  onDeleteRun: (runId: string) => void;
  onSelectRun: (runId: string) => void;
  selectedRunId?: string | null;
}

const methodClassMap: Record<HttpMethod, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
};

const WorkspaceSidebar = ({
  history,
  stats,
  onClearHistory,
  onDeleteRun,
  onSelectRun,
  selectedRunId = null,
}: Props) => {
  return (
    <aside className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Workspace</h2>
          <p className="text-[11px] text-muted-foreground">Collections, environments, and execution log</p>
        </div>
        <Button variant="secondary" size="icon" className="h-8 w-8" title="New request">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-2 border-b border-border/70">
        <NavRow icon={<FolderKanban className="h-4 w-4" />} label="Collections" value="6" />
        <NavRow icon={<Layers2 className="h-4 w-4" />} label="Environments" value="3" />
        <NavRow icon={<ShieldCheck className="h-4 w-4" />} label="Policies" value="Active" />
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 border-b border-border/70">
        <StatTile label="Runs" value={String(stats.totalRuns)} />
        <StatTile label="Success" value={`${stats.successRate}%`} />
        <StatTile label="Avg Latency" value={`${stats.avgResponseTime}ms`} />
        <StatTile label="Last Run" value={stats.lastRunAt ?? '--'} />
      </div>

      <div className="px-3 py-2 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> Recent Runs
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{history.length}</Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearHistory} disabled={history.length === 0}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background px-3 py-5 text-center">
              <Server className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No API runs yet</p>
            </div>
          ) : (
            history.map((item) => {
              const host = safeHostname(item.url);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-lg border p-2.5 space-y-1 cursor-pointer transition-colors',
                    selectedRunId === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 bg-background hover:bg-muted/40'
                  )}
                  onClick={() => onSelectRun(item.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-[11px] font-mono font-semibold', methodClassMap[item.method])}>{item.method}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">{item.responseTime}ms</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRun(item.id);
                        }}
                        title="Delete run"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 truncate">{host}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px] font-mono', item.status < 300 ? 'text-status-success' : item.status < 500 ? 'text-status-warning' : 'text-status-error')}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.createdAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/70">
        <div className="rounded-lg border border-border/70 bg-background p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Globe2 className="h-3.5 w-3.5" /> Network
          </div>
          <p className="text-xs text-foreground/90">Outbound proxy with SSRF and payload guardrails enabled.</p>
        </div>
      </div>
    </aside>
  );
};

const NavRow = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <button className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors">
    <span className="flex items-center gap-2 text-sm text-foreground/95">
      {icon}
      {label}
    </span>
    <span className="text-[11px] text-muted-foreground font-mono">{value}</span>
  </button>
);

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/70 bg-background px-2.5 py-2">
    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
    <p className="text-xs font-mono text-foreground truncate">{value}</p>
  </div>
);

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default WorkspaceSidebar;
