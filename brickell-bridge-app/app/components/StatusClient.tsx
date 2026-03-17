'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ApiResult = {
  bridgeName: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  rawStatus: string;
  location?: string;
  roadway?: string;
  county?: string;
  checkedAt: string;
  sourceUrl: string;
  note?: string;
};

export default function StatusClient() {
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bridge-status?ts=${Date.now()}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiResult;
      setData(json);
      if (!res.ok) {
        setError(json.note || 'Could not fetch status');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const prettyStatus = useMemo(() => {
    if (!data) return 'Checking…';
    if (data.status === 'UP') return 'UP';
    if (data.status === 'DOWN') return 'DOWN';
    return 'UNKNOWN';
  }, [data]);

  const dotClass = data?.status === 'UP' ? 'dot up' : data?.status === 'DOWN' ? 'dot down' : 'dot unknown';

  return (
    <div className="card">
      <div className="badge">
        <span className={dotClass} />
        Live from FL511 proxy
      </div>

      <div className="statusWrap">
        <p className="statusLabel">Brickell Avenue Bridge</p>
        <h1 className="statusValue">{loading && !data ? '…' : prettyStatus}</h1>
        <p className="helper">
          {data?.status === 'UP' && 'Bridge is open to boat traffic and closed to road traffic.'}
          {data?.status === 'DOWN' && 'Bridge is down for road traffic.'}
          {(!data || data?.status === 'UNKNOWN') && 'Status could not be confidently parsed right now.'}
        </p>
      </div>

      <div className="meta">
        <div className="metaRow"><strong>FL511 raw status:</strong> {data?.rawStatus || 'Loading...'}</div>
        <div className="metaRow"><strong>Checked:</strong> {data ? new Date(data.checkedAt).toLocaleString() : 'Loading...'}</div>
        <div className="metaRow"><strong>Location:</strong> {data?.location || 'Miami'}</div>
        <div className="metaRow"><strong>Source:</strong> <a href={data?.sourceUrl || 'https://fl511.com/list/bridge'} target="_blank" rel="noreferrer">FL511 drawbridge list</a></div>
      </div>

      <div className="actions">
        <button className="button primary" onClick={refresh}>Refresh now</button>
        <a className="button secondary" href="https://fl511.com/list/bridge" target="_blank" rel="noreferrer">Open FL511</a>
      </div>

      {error && <p className="small">Warning: {error}</p>}
      {data?.note && <p className="small">Parser note: {data.note}</p>}
    </div>
  );
}
