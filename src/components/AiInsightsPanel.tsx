import { type ReactNode, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode,
  Lightbulb,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { AiAnalysis, AnalysisItem, AnalysisTone } from '@/types/api';

interface Props {
  analysis: AiAnalysis | null;
  isLoading: boolean;
  tone: AnalysisTone;
  onToneChange: (t: AnalysisTone) => void;
  onRegenerate: () => void;
}

const AiInsightsPanel = ({ analysis, isLoading, tone, onToneChange, onRegenerate }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  const counts = useMemo(() => {
    if (!analysis) {
      return { design: 0, security: 0, suggestions: 0, total: 0 };
    }

    const design = analysis.designIssues.length;
    const security = analysis.securityIssues.length;
    const suggestions = analysis.suggestions.length;

    return { design, security, suggestions, total: design + security + suggestions };
  }, [analysis]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full flex flex-col">
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 border-b border-border/70 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Insights</span>
          {analysis && (
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
              {counts.total} observations
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="flex-1 data-[state=open]:animate-slide-down min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : analysis ? (
          <div className="h-full p-4 grid grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Select value={tone} onValueChange={(v) => onToneChange(v as AnalysisTone)}>
                <SelectTrigger className="w-[155px] h-9 text-xs border-border/70 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={onRegenerate}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>

            <div className="space-y-3">
              <div className="surface-soft p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1">Executive Summary</p>
                <p className="text-sm leading-6 text-foreground/90">{analysis.summary}</p>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                <CountTile label="Design" value={counts.design} tone="warn" />
                <CountTile label="Security" value={counts.security} tone="bad" />
                <CountTile label="Suggestions" value={counts.suggestions} tone="good" />
                <CountTile label="Total" value={counts.total} tone="neutral" />
              </div>
            </div>

            <Tabs defaultValue="findings" className="min-h-0 flex flex-col">
              <TabsList className="h-9 bg-muted/40 border border-border/70 rounded-lg w-fit">
                <TabsTrigger value="findings" className="text-xs px-4 data-[state=active]:bg-background">Findings</TabsTrigger>
                <TabsTrigger value="suggestions" className="text-xs px-4 data-[state=active]:bg-background">Suggestions</TabsTrigger>
                <TabsTrigger value="artifacts" className="text-xs px-4 data-[state=active]:bg-background">Artifacts</TabsTrigger>
              </TabsList>

              <TabsContent value="findings" className="mt-3 min-h-0 flex-1">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 h-full min-h-0">
                  <InsightList
                    title="Design Findings"
                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    items={analysis.designIssues}
                    emptyLabel="No design concerns identified."
                  />
                  <InsightList
                    title="Security Findings"
                    icon={<Shield className="h-3.5 w-3.5" />}
                    items={analysis.securityIssues}
                    emptyLabel="No security concerns identified."
                  />
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-3 min-h-0 flex-1">
                <InsightList
                  title="Recommended Improvements"
                  icon={<Lightbulb className="h-3.5 w-3.5" />}
                  items={analysis.suggestions}
                  emptyLabel="No suggestions returned."
                  fullHeight
                />
              </TabsContent>

              <TabsContent value="artifacts" className="mt-3 min-h-0 flex-1">
                <div className="grid grid-cols-1 gap-3 h-full min-h-0">
                  {analysis.openApiSnippet && <CodeBlock title="OpenAPI Snippet" code={analysis.openApiSnippet} />}
                  {analysis.improvedResponse && (
                    <CodeBlock title="Improved Response Example" code={JSON.stringify(analysis.improvedResponse, null, 2)} />
                  )}
                  {!analysis.openApiSnippet && !analysis.improvedResponse && (
                    <div className="surface-soft p-4 text-sm text-muted-foreground">No artifacts available.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="h-full p-5">
            <div className="surface-soft h-full grid place-items-center">
              <div className="text-center max-w-sm px-6">
                <p className="text-sm font-semibold text-foreground">Insights Workspace</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send a request to populate this area with design findings, security observations, suggestions, and artifacts.
                </p>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

const InsightList = ({
  title,
  icon,
  items,
  emptyLabel,
  fullHeight = false,
}: {
  title: string;
  icon: ReactNode;
  items: AnalysisItem[];
  emptyLabel: string;
  fullHeight?: boolean;
}) => (
  <section className={cn('surface-soft p-3.5 flex flex-col min-h-0', fullHeight && 'h-full')}>
    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
      {icon}
      <span className="text-xs uppercase tracking-[0.12em] font-semibold">{title}</span>
      <Badge variant="secondary" className="ml-auto text-[10px]">{items.length}</Badge>
    </div>

    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground">{emptyLabel}</p>
    ) : (
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <article key={`${title}-${item.title}-${i}`} className="rounded-md border border-border/70 bg-background p-2.5">
              <div className="flex items-start gap-2 mb-1">
                <p className="text-xs font-semibold leading-5 text-foreground flex-1">{item.title}</p>
                {item.severity && <SeverityBadge severity={item.severity} />}
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </ScrollArea>
    )}
  </section>
);

const CountTile = ({ label, value, tone }: { label: string; value: number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) => {
  const toneClass =
    tone === 'good'
      ? 'text-status-success'
      : tone === 'warn'
        ? 'text-status-warning'
        : tone === 'bad'
          ? 'text-status-error'
          : 'text-foreground';

  return (
    <div className="rounded-md border border-border/70 bg-background px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold', toneClass)}>{value}</p>
    </div>
  );
};

const SeverityBadge = ({ severity }: { severity: NonNullable<AnalysisItem['severity']> }) => (
  <Badge
    variant="outline"
    className={cn(
      'text-[9px] mt-0.5',
      severity === 'critical' || severity === 'high'
        ? 'text-status-error border-status-error/30'
        : severity === 'medium'
          ? 'text-status-warning border-status-warning/30'
          : 'text-muted-foreground border-border/50'
    )}
  >
    {severity}
  </Badge>
);

const CodeBlock = ({ title, code }: { title: string; code: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: `${title} copied` });
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="surface-soft p-3.5 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileCode className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-[0.12em] font-semibold">{title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <pre className="text-[11px] font-mono text-foreground/85 rounded-md border border-border/70 bg-background p-2.5">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </section>
  );
};

export default AiInsightsPanel;
