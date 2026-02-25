import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ApiRequest, AuthConfig, HttpMethod, KeyValuePair } from '@/types/api';
import { METHOD_BG_COLORS, METHOD_COLORS } from '@/types/api';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface Props {
  onSend: (request: ApiRequest) => void;
  isLoading: boolean;
  presetRequest?: ApiRequest | null;
}

const newHeader = (): KeyValuePair => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
  enabled: true,
});

const RequestBuilder = ({ onSend, isLoading, presetRequest = null }: Props) => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/users');
  const [headers, setHeaders] = useState<KeyValuePair[]>([newHeader()]);
  const [body, setBody] = useState('{\n  \n}');
  const [auth, setAuth] = useState<AuthConfig>({ type: 'none' });

  useEffect(() => {
    if (!presetRequest) return;

    setMethod(presetRequest.method);
    setUrl(presetRequest.url);
    setHeaders(
      presetRequest.headers.length > 0
        ? presetRequest.headers.map((header) => ({
            ...header,
            id: header.id || crypto.randomUUID(),
          }))
        : [newHeader()]
    );
    setBody(presetRequest.body);
    setAuth(presetRequest.auth);
  }, [presetRequest]);

  const handleSend = () => {
    if (!url.trim()) return;
    onSend({ method, url: url.trim(), headers, body, auth });
  };

  const addHeader = () => setHeaders((h) => [...h, newHeader()]);
  const removeHeader = (id: string) => setHeaders((h) => h.filter((x) => x.id !== id));
  const updateHeader = (id: string, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Request Composer</h2>
          <p className="text-[11px] text-muted-foreground">Craft endpoint calls with full control</p>
        </div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-primary/90">Interactive</div>
      </div>

      <div className="p-4 border-b border-border/70">
        <div className="surface-soft p-2 flex flex-col xl:flex-row gap-2">
          <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
            <SelectTrigger className={cn('w-full xl:w-[130px] font-mono font-semibold border-border/70', METHOD_BG_COLORS[method], METHOD_COLORS[method])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m} className={cn('font-mono font-semibold', METHOD_COLORS[m])}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/resource"
            className="flex-1 font-mono text-sm bg-background/60 border-border/70"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <Button onClick={handleSend} disabled={isLoading || !url.trim()} className="xl:min-w-[120px] font-semibold">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Execute
          </Button>
        </div>
      </div>

      <Tabs defaultValue="headers" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3">
          <TabsList className="h-9 bg-muted/40 border border-border/70 rounded-lg">
            <TabsTrigger value="headers" className="text-xs px-4 data-[state=active]:bg-background">Headers</TabsTrigger>
            <TabsTrigger value="body" className="text-xs px-4 data-[state=active]:bg-background">Body</TabsTrigger>
            <TabsTrigger value="auth" className="text-xs px-4 data-[state=active]:bg-background">Auth</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="headers" className="flex-1 mt-0 p-4 overflow-auto space-y-2">
          {headers.map((h) => (
            <div key={h.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                value={h.key}
                onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                placeholder="Header"
                className="h-9 font-mono text-xs bg-background/55 border-border/70"
              />
              <Input
                value={h.value}
                onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                placeholder="Value"
                className="h-9 font-mono text-xs bg-background/55 border-border/70"
              />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeHeader(h.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addHeader} className="text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Header
          </Button>
        </TabsContent>

        <TabsContent value="body" className="flex-1 mt-0 p-4 min-h-0">
          <div className="h-full surface-soft p-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "key": "value" }'
              className="h-full min-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none font-mono text-xs"
            />
          </div>
        </TabsContent>

        <TabsContent value="auth" className="flex-1 mt-0 p-4 overflow-auto space-y-4">
          <div className="surface-soft p-3 flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Credentials are attached only to outbound request headers.
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Auth Mode</Label>
            <Select value={auth.type} onValueChange={(v) => setAuth({ type: v as AuthConfig['type'] })}>
              <SelectTrigger className="border-border/70 bg-background/55 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {auth.type === 'bearer' && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Token</Label>
              <Input
                value={auth.token || ''}
                onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                placeholder="Bearer token"
                className="font-mono text-xs bg-background/55 border-border/70"
              />
            </div>
          )}

          {auth.type === 'basic' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Username</Label>
                <Input
                  value={auth.username || ''}
                  onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                  placeholder="Username"
                  className="font-mono text-xs bg-background/55 border-border/70"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  value={auth.password || ''}
                  onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                  placeholder="Password"
                  className="font-mono text-xs bg-background/55 border-border/70"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestBuilder;
