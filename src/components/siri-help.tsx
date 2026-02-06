'use client';

import { useState } from 'react';
import { Mic, X, Share } from 'lucide-react';

export function SiriHelp() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-50 flex items-center gap-2"
        aria-label="Configura Siri"
      >
        <Mic className="w-5 h-5" />
        <span className="text-sm font-medium pr-1">Siri</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card)] text-[var(--card-foreground)] max-w-sm w-full rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
              <Mic className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold">Hey Siri, status?</h2>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Want to check the crossing status with Siri? Create a <strong>Shortcut</strong> in 1 minute.
            </p>

            <div className="bg-[var(--muted)]/50 rounded-xl p-4 text-left text-xs space-y-3 w-full border border-[var(--border)]">
              <ol className="list-decimal pl-4 space-y-2 marker:text-indigo-500 marker:font-bold">
                <li>Open the <strong>Shortcuts</strong> app on your iPhone.</li>
                <li>Tap <strong>+</strong> to create a new shortcut.</li>
                <li>Add action: <strong>Get contents of URL</strong>.</li>
                <li>Paste this link:
                  <div className="mt-1 p-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] font-mono break-all select-all">
                    https://bitonto-crossing.vercel.app/api/crossing-status
                  </div>
                </li>
                <li>Add action: <strong>Get dictionary value</strong>. Key: <code className="bg-indigo-500/10 text-indigo-500 px-1 rounded">message</code>.</li>
                <li>Add action: <strong>Speak text</strong>. Text: "Crossing status is: [Dictionary Value]".</li>
                <li>Name the shortcut <strong>"Check Level Crossing"</strong>.</li>
              </ol>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] italic">
              Now say: "Hey Siri, Check Level Crossing"!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
