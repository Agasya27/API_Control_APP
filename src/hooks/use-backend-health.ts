import { useCallback, useEffect, useState } from 'react';
import { getApiRuntimeConfig } from '@/services/api';

export type BackendHealthStatus = 'mock' | 'checking' | 'online' | 'offline';

interface BackendHealth {
  status: BackendHealthStatus;
  lastCheckedAt: string | null;
  markOnline: () => void;
}

const POLL_INTERVAL_MS = 15000;

async function probe(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function connectivityProbe(url: string): Promise<boolean> {
  try {
    await fetch(`${url}?ping=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  }
}

export function useBackendHealth(): BackendHealth {
  const runtime = getApiRuntimeConfig();
  const [status, setStatus] = useState<BackendHealthStatus>(() =>
    runtime.mode === 'mock' ? 'mock' : 'checking'
  );
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const markOnline = useCallback(() => {
    setStatus('online');
    setLastCheckedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (runtime.mode === 'mock' || !runtime.baseUrl) {
      setStatus('mock');
      setLastCheckedAt(null);
      return;
    }

    let mounted = true;

    const check = async () => {
      setStatus((prev) => (prev === 'online' ? 'online' : 'checking'));

      const healthOk = await probe(`${runtime.baseUrl}/health`);
      const rootOk = healthOk ? true : await probe(runtime.baseUrl);
      const localConnectivityOk =
        healthOk || rootOk ? false : isLocalBaseUrl(runtime.baseUrl) ? await connectivityProbe(runtime.baseUrl) : false;

      if (!mounted) return;

      setStatus(healthOk || rootOk || localConnectivityOk ? 'online' : 'offline');
      setLastCheckedAt(new Date().toISOString());
    };

    void check();

    const intervalId = window.setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void check();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [runtime.baseUrl, runtime.mode]);

  return { status, lastCheckedAt, markOnline };
}

function isLocalBaseUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
