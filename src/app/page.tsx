'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Train, RefreshCw, Clock } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SiriHelp } from '@/components/siri-help';

type StatusState = 'OPEN' | 'CLOSED' | 'WARNING' | 'UNKNOWN';

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
  lastUpdated: string;
  error?: string;
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crossing-status');
      const json = await res.json();
      setData(json);
      setElapsed(0); // Reset elapsed counter
    } catch (err) {
      console.error(err);
      // Keep old data if possible, or show error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for real-time updates
    const timer = setInterval(() => setElapsed(e => e + 1), 1000); // 1s ticker
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Determine UI colors based on status
  // Adapted for Light (stronger contrast) and Dark (glowing)
  const getStatusColor = (status: StatusState) => {
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
  };

  const getStatusText = (status: StatusState) => {
    switch (status) {
      case 'OPEN': return 'Via Libera';
      case 'CLOSED': return 'Chiuso';
      case 'WARNING': return 'In Chiusura';
      default: return 'Caricamento...';
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4 sm:p-8 max-w-md mx-auto relative overflow-hidden transition-colors duration-300">
      
      {/* Background decoration - optimized for both modes */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[500px] bg-linear-to-b from-blue-200/40 to-transparent dark:from-blue-900/20 blur-3xl -z-10 rounded-full pointer-events-none" />


      {/* Header */}
      <header className="flex justify-between items-center mb-12 mt-4 relative z-20" role="banner">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Train className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            Bitonto Crossing
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Monitoraggio real-time stimato</p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button 
            onClick={fetchData} 
            disabled={loading}
            aria-label="Aggiorna dati"
            className={`p-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      
      {/* Main Status Indicator */}
      <div className="flex-1 flex flex-col justify-center items-center md:-mt-20" role="main" aria-label="Stato del passaggio a livello">
        
        <div 
           className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700 ${data ? getStatusColor(data.status) : 'border-[var(--border)]'}`}
           role="status"
           aria-live="polite"
        >
           {/* Inner Pulse Ring - Reduces motion if requested */}
           {data?.status === 'CLOSED' && (
             <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-500 motion-reduce:animate-none" aria-hidden="true" />
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
        <div className="mt-12 text-center max-w-[280px] space-y-4">
          <p className="text-lg font-medium" aria-live="polite">
            {data?.message || 'Attendere, recupero stato treni...'}
          </p>
          
          {/* Train Detail Card */}
          {data?.nextTrain && (
             <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl shadow-sm mt-6 text-left">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Prossimo Treno</span>
                 <span className={`text-xs px-2 py-0.5 rounded-full ${String(data.nextTrain.ritardo).includes('Orario') || data.nextTrain.ritardo === 0 ? 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>
                   {typeof data.nextTrain.ritardo === 'number' 
                      ? (data.nextTrain.ritardo === 0 ? 'In Orario' : `Ritardo ${data.nextTrain.ritardo}'`) 
                      : (data.nextTrain.ritardo || 'In Orario')}
                 </span>
               </div>
               <div className="font-medium text-[var(--card-foreground)]">
                 <span className="sr-only">Treno: </span>
                 {data.nextTrain.label}
               </div>
               <div className="text-sm text-[var(--muted-foreground)] mt-1 flex justify-between">
                 <span>Orario: <time>{data.nextTrain.orario}</time></span>
               </div>
             </div>
          )}
        </div>

      </div>

      {/* Footer / Disclaimer */}
      <footer className="mt-auto pt-8 pb-4 text-center space-y-4">
         <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 text-left">
           <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
           <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] leading-relaxed">
             <strong>Nota Importante:</strong> Lo stato è una stima basata sulla posizione dei treni (API Ferrotramviaria). Non affidarsi ciecamente a questa app per l&apos;attraversamento. Rispettare sempre la segnaletica fisica.
           </p>
         </div>
         <div className="space-y-1">
            <p className="text-[10px] text-[var(--muted-foreground)] opacity-80" aria-live="off">
               Ultimo agg: {elapsed}s fa
            </p>
            <a 
               href="https://tarantino.io" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-block text-[10px] text-[var(--muted-foreground)] hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
               aria-label="Visit Tarantino.io website"
            >
               Made with love by Tarantino.io
            </a>
         </div>
      </footer>

      <SiriHelp />
    </main>
  );
}
