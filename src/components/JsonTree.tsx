import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: unknown;
  searchTerm?: string;
  depth?: number;
}

const JsonTree = ({ data, searchTerm = '', depth = 0 }: Props) => {
  if (data === null) return <span className="text-method-put">null</span>;
  if (data === undefined) return <span className="text-muted-foreground">undefined</span>;
  if (typeof data === 'boolean') return <span className="text-method-put">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-method-post">{data}</span>;
  if (typeof data === 'string') {
    const highlighted = searchTerm && data.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      <span className={cn('text-status-success', highlighted && 'bg-primary/20 rounded px-0.5')}>
        "{data}"
      </span>
    );
  }

  if (Array.isArray(data)) {
    return <CollapsibleNode label={`Array(${data.length})`} bracket={['[', ']']} data={data} searchTerm={searchTerm} depth={depth} isArray />;
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    return <CollapsibleNode label={`{${keys.length}}`} bracket={['{', '}']} data={data} searchTerm={searchTerm} depth={depth} />;
  }

  return <span>{String(data)}</span>;
};

const CollapsibleNode = ({
  label,
  bracket,
  data,
  searchTerm,
  depth,
  isArray,
}: {
  label: string;
  bracket: [string, string];
  data: unknown;
  searchTerm: string;
  depth: number;
  isArray?: boolean;
}) => {
  const [open, setOpen] = useState(depth < 2);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  return (
    <span>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-muted-foreground/60 text-[10px] ml-1">{label}</span>
      </button>
      {open ? (
        <span>
          <span className="text-muted-foreground">{bracket[0]}</span>
          <div className="ml-4 border-l border-border/50 pl-3">
            {entries.map(([key, value], i) => (
              <div key={key} className="leading-6">
                {!isArray && (
                  <>
                    <span className="text-accent-foreground">"{key}"</span>
                    <span className="text-muted-foreground">: </span>
                  </>
                )}
                <JsonTree data={value} searchTerm={searchTerm} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
          </div>
          <span className="text-muted-foreground">{bracket[1]}</span>
        </span>
      ) : (
        <span className="text-muted-foreground"> {bracket[0]}...{bracket[1]}</span>
      )}
    </span>
  );
};

export default JsonTree;
