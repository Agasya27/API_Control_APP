import type { ReactNode } from 'react';
import { Activity, Bell, Github, Rocket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getApiRuntimeConfig } from '@/services/api';

const Header = () => {
  const runtime = getApiRuntimeConfig();
  const location = useLocation();

  return (
    <header className="relative z-10 h-[74px] border-b border-border bg-card px-4 md:px-6">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">
              DevAPI Control Plane
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">API design, testing, and insights workspace</p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2">
          <HeaderChip icon={<Rocket className="h-3.5 w-3.5" />} label="Shipping Mode" />
          <HeaderChip icon={<Activity className="h-3.5 w-3.5" />} label="Observability" />
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center rounded-lg border border-border bg-background p-1">
            <Link
              to="/"
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                location.pathname === '/'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Workspace
            </Link>
            <Link
              to="/insights"
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                location.pathname === '/insights'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Insights
            </Link>
          </nav>

          <Badge
            variant="outline"
            className={runtime.mode === 'live'
              ? 'border-status-success/40 bg-status-success/10 text-status-success'
              : 'border-status-warning/40 bg-status-warning/10 text-status-warning'}
          >
            {runtime.mode === 'live' ? 'LIVE BACKEND' : 'MOCK PREVIEW'}
          </Badge>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

const HeaderChip = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <div className="px-2.5 py-1.5 rounded-md border border-border/70 bg-background/45 text-xs text-muted-foreground flex items-center gap-1.5">
    {icon}
    {label}
  </div>
);

export default Header;
