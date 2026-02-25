import { useMemo, useState } from 'react';
import { Check, Clock3, Copy, Search, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ApiResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import JsonTree from './JsonTree';

interface Props {
  response: ApiResponse | null;
  isLoading: boolean;
}

const ResponseViewer = ({ response, isLoading }: Props) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const statusColor = response
    ? response.status < 300
      ? 'bg-status-success/15 text-status-success border-status-success/30'
      : response.status < 500
        ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
        : 'bg-status-error/15 text-status-error border-status-error/30'
    : '';

  const headerEntries = useMemo(() => Object.entries(response?.headers ?? {}), [response]);

  const copyResponse = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setCopied(true);
    toast({ title: 'Response copied' });
    setTimeout(() => setCopied(false), 1400);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full grid place-items-center p-8">
        <div className="surface-soft p-8 text-center max-w-sm">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl border border-border/70 bg-background/60 flex items-center justify-center text-primary">
            <Send className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold">Awaiting Response</h3>
          <p className="text-xs text-muted-foreground mt-1">Run an API call to inspect body, headers, latency, and AI feedback.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Response Console</h2>
            <p className="text-[11px] text-muted-foreground">Real-time payload inspection</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('font-mono border', statusColor)}>{response.status}</Badge>
            <Badge variant="outline" className="font-mono border-border/70 text-muted-foreground">
              <Clock3 className="h-3 w-3 mr-1" />{response.responseTime}ms
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search response body"
              className="h-9 pl-8 text-xs bg-background/55 border-border/70"
            />
          </div>
          <Button variant="secondary" size="icon" className="h-9 w-9" onClick={copyResponse}>
            {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3">
          <TabsList className="h-9 bg-muted/40 border border-border/70 rounded-lg">
            <TabsTrigger value="body" className="text-xs px-4 data-[state=active]:bg-background">Body</TabsTrigger>
            <TabsTrigger value="headers" className="text-xs px-4 data-[state=active]:bg-background">Headers ({headerEntries.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="body" className="flex-1 mt-0 p-4 overflow-auto">
          <div className="surface-soft p-3 font-mono text-xs leading-relaxed min-h-full">
            <JsonTree data={response.data} searchTerm={search} />
          </div>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 mt-0 p-4 overflow-auto">
          <div className="surface-soft overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr] px-3 py-2 bg-muted/45 border-b border-border/70 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <div>Header</div>
              <div>Value</div>
            </div>
            {headerEntries.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground">No headers returned.</div>
            ) : (
              headerEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr_2fr] px-3 py-2 border-b border-border/50 last:border-0 text-xs font-mono">
                  <span className="text-foreground/90">{key}</span>
                  <span className="text-muted-foreground break-all">{value}</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResponseViewer;
