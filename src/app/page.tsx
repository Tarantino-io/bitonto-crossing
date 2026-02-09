'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Train, RefreshCw, Clock } from '@/lib/lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SiriHelp } from '@/components/siri-help';

type StatusState = 'OPEN' | 'CLOSED' | 'WARNING' | 'UNKNOWN';
type SourceStatus = 'FULL' | 'PARTIAL' | 'UNAVAILABLE';

const POLL_INTERVAL_MS = 8000;
const REQUEST_TIMEOUT_MS = 6500;
const STALE_AFTER_SECONDS = 25;

interface TrainInfo {
  orario: string;
  destinazione?: string;
  provenienza?: string;
  ritardo: string | number;
  minutesUntil: number;
  label: string;
}

interface ApiResponse {
  status: StatusState;
  message: string;
  nextTrain: TrainInfo | null;
  sourceStatus?: SourceStatus;
  lastUpdated: string;
  error?: string;
}

function getStatusColor(status: StatusState) {
  switch (status) {
    case 'OPEN':
      return 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]';
    case 'CLOSED':
      return 'text-red-700 dark:text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]';
    case 'WARNING':
      return 'text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]';
    default:
      return 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50';
  }
}

function getStatusText(status: StatusState) {
  switch (status) {
    case 'OPEN':
      return 'Via Libera';
    case 'CLOSED':
      return 'Chiuso';
    case 'WARNING':
      return 'In Chiusura';
    case 'UNKNOWN':
      return 'Dato Incerto';
    default:
      return 'Caricamento...';
  }
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async (manual = false) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    if (!hasLoadedRef.current) {
      setLoading(true);
    } else if (manual) {
      setRefreshing(true);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`/api/crossing-status?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      const json = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(json?.message || 'Aggiornamento non disponibile.');
      }

      if (!mountedRef.current) {
        return;
      }

      setData(json);
      hasLoadedRef.current = true;
      setElapsed(0);
      setFetchError(null);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      console.error('Fetch crossing status failed:', error);
      setFetchError('Aggiornamento live non riuscito. I dati potrebbero essere non aggiornati.');
    } finally {
      clearTimeout(timeout);
      inFlightRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData();

    const pollingInterval = setInterval(() => {
      void fetchData();
    }, POLL_INTERVAL_MS);
    const elapsedTicker = setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(pollingInterval);
      clearInterval(elapsedTicker);
    };
  }, [fetchData]);

  const isStale = elapsed >= STALE_AFTER_SECONDS;
  const refreshInProgress = loading || refreshing;

  const lastUpdatedDate = useMemo(() => {
    if (!data?.lastUpdated) {
      return null;
    }
    const parsed = new Date(data.lastUpdated);
    return Number.isNaN(parsed.valueOf()) ? null : parsed;
  }, [data?.lastUpdated]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdatedDate) {
      return null;
    }
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(lastUpdatedDate);
  }, [lastUpdatedDate]);

  const liveRegionMessage = useMemo(() => {
    if (fetchError) {
      return fetchError;
    }
    if (!data) {
      return 'Caricamento stato passaggio a livello in corso.';
    }

    const nextTrainMessage =
      data.status !== 'OPEN' && data.nextTrain
        ? ` Prossimo treno tra ${Math.max(data.nextTrain.minutesUntil, 0)} minuti.`
        : '';
    const staleMessage = isStale ? ' Attenzione: aggiornamento dati non recente.' : '';

    return `Stato: ${getStatusText(data.status)}.${nextTrainMessage}${staleMessage}`;
  }, [data, fetchError, isStale]);

  return (
    <main
      id="main-content"
      className="flex flex-col min-h-screen px-4 pb-4 pt-1 sm:px-8 sm:pb-8 sm:pt-2 max-w-md mx-auto relative overflow-hidden transition-colors duration-300 motion-reduce:transition-none"
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveRegionMessage}
      </p>

      {/* Background decoration - optimized for both modes */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[500px] bg-linear-to-b from-blue-200/40 to-transparent dark:from-blue-900/20 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-8 sm:mb-12 mt-0 sm:mt-0 relative z-20">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Train className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            Bitonto Crossing
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Monitoraggio real-time stimato
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void fetchData(true)}
            disabled={refreshInProgress}
            aria-busy={refreshInProgress}
            aria-label="Aggiorna dati"
            title={refreshInProgress ? 'Aggiornamento in corso' : 'Aggiorna dati'}
            className={`p-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${refreshInProgress ? 'animate-spin motion-reduce:animate-none' : ''}`}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">
              {refreshInProgress ? 'Aggiornamento in corso' : 'Aggiorna dati'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Status Indicator */}
      <section
        id="status-panel"
        className="flex-1 flex flex-col justify-start sm:justify-center items-center pt-2 sm:pt-4"
        aria-labelledby="crossing-status-heading"
      >
        <h2 id="crossing-status-heading" className="sr-only">
          Stato del passaggio a livello
        </h2>
        <div
          className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700 ${data ? getStatusColor(data.status) : 'border-[var(--border)]'}`}
          role="status"
          aria-live={isStale ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {/* Disable pulse if data is stale, to avoid false confidence */}
          {data?.status === 'CLOSED' && !isStale && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-500 motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}

          <div className="text-center z-10 space-y-2">
            <span className="text-5xl font-black tracking-tighter block">
              {data ? getStatusText(data.status) : '...'}
            </span>
            {data?.status !== 'OPEN' && data?.nextTrain && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium opacity-90">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span aria-label={`Il prossimo treno è tra ${data.nextTrain.minutesUntil} minuti`}>
                  {data.nextTrain.minutesUntil <= 0 ? 'Ora!' : `${data.nextTrain.minutesUntil} min`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Message */}
        <div className="mt-8 sm:mt-12 text-center max-w-[320px] space-y-4">
          <p className="text-lg font-medium" aria-live="polite">
            {data?.message || 'Attendere, recupero stato treni...'}
          </p>

          {isStale && (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Dati potenzialmente vecchi: ultimo aggiornamento riuscito {elapsed}s fa.
            </p>
          )}

          {data?.sourceStatus === 'PARTIAL' && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Alcune sorgenti treno non rispondono: stato calcolato con dati parziali.
            </p>
          )}

          {fetchError && <p className="text-xs text-red-700 dark:text-red-300">{fetchError}</p>}

          {/* Train Detail Card */}
          {data?.nextTrain && (
            <section
              className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl shadow-sm mt-6 text-left"
              aria-label="Dettaglio prossimo treno"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  Prossimo Treno
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${String(data.nextTrain.ritardo).includes('Orario') || data.nextTrain.ritardo === 0 ? 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}
                >
                  {typeof data.nextTrain.ritardo === 'number'
                    ? data.nextTrain.ritardo === 0
                      ? 'In Orario'
                      : `Ritardo ${data.nextTrain.ritardo}'`
                    : data.nextTrain.ritardo || 'In Orario'}
                </span>
              </div>
              <dl className="space-y-1">
                <div className="font-medium text-[var(--card-foreground)] text-center">
                  <dt className="sr-only">Treno</dt>
                  <dd>{data.nextTrain.label}</dd>
                </div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1 flex justify-between">
                  <dt>Orario:</dt>
                  <dd>
                    <time>{data.nextTrain.orario}</time>
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="mt-auto pt-8 pb-2 text-center space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] text-[var(--muted-foreground)] opacity-80" aria-live="off">
            Ultimo aggiornamento riuscito: {elapsed}s fa
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] opacity-80" aria-live="off">
            Ultimo aggiornamento API:{' '}
            {lastUpdatedDate && formattedLastUpdated ? (
              <time dateTime={lastUpdatedDate.toISOString()}>{formattedLastUpdated}</time>
            ) : (
              'n/d'
            )}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg flex gap-2 text-left">
          <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[9px] sm:text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            <strong>Nota Importante:</strong> Lo stato è una stima basata sulla posizione dei treni
            (API Ferrotramviaria). Non affidarsi ciecamente a questa app per l&apos;attraversamento.
            Rispettare sempre la segnaletica fisica.
          </p>
        </div>
        <div>
          <a
            href="https://tarantino.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[10px] text-[var(--muted-foreground)] hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
            aria-label="Visit Tarantino.io website"
          >
            Sviluppato con amore da Tarantino.io
          </a>
        </div>
      </footer>

      <SiriHelp />
    </main>
  );
}
