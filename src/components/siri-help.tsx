'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X } from '@/lib/lucide-react';

export function SiriHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all motion-reduce:transition-none hover:scale-105 active:scale-95 z-50 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        aria-label="Apri guida Siri"
      >
        <Mic className="w-5 h-5" />
        <span className="text-sm font-medium pr-1">Siri</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="siri-help-title"
        aria-describedby="siri-help-description"
        className="bg-[var(--card)] text-[var(--card-foreground)] max-w-sm w-full rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 relative">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--muted)] transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label="Chiudi guida Siri"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
              <Mic className="w-8 h-8 text-white" />
            </div>

            <h2 id="siri-help-title" className="text-xl font-bold">
              Hey Siri, status?
            </h2>
            <p id="siri-help-description" className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Want to check the crossing status with Siri? Create a <strong>Shortcut</strong> in 1
              minute.
            </p>

            <div className="bg-[var(--muted)]/50 rounded-xl p-4 text-left text-xs space-y-3 w-full border border-[var(--border)]">
              <ol className="list-decimal pl-4 space-y-2 marker:text-indigo-500 marker:font-bold">
                <li>
                  Open the <strong>Shortcuts</strong> app on your iPhone.
                </li>
                <li>
                  Tap <strong>+</strong> to create a new shortcut.
                </li>
                <li>
                  Add action: <strong>Get contents of URL</strong>.
                </li>
                <li>
                  Paste this link:
                  <div className="mt-1 p-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] font-mono break-all select-all">
                    https://bitonto-crossing.vercel.app/api/crossing-status
                  </div>
                </li>
                <li>
                  Add action: <strong>Get dictionary value</strong>. Key:{' '}
                  <code className="bg-indigo-500/10 text-indigo-500 px-1 rounded">message</code>.
                </li>
                <li>
                  Add action: <strong>Speak text</strong>. Text: &quot;Crossing status is:
                  [Dictionary Value]&quot;.
                </li>
                <li>Name the shortcut <strong>&quot;Check Level Crossing&quot;</strong>.</li>
              </ol>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] italic">
              Now say: &quot;Hey Siri, Check Level Crossing&quot;!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
