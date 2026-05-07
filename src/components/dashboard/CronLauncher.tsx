'use client';

import { useState } from 'react';

type Status = 'idle' | 'step1' | 'waiting' | 'step2' | 'done' | 'error';

export default function CronLauncher() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(35);

  async function runCron() {
    setStatus('step1');
    setError('');

    try {
      const r1 = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'blog' }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error ?? `Erreur ${r1.status}`);

      // Countdown 35s
      setStatus('waiting');
      let remaining = 35;
      setCountdown(remaining);
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });

      setStatus('step2');
      const r2 = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'social' }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error ?? `Erreur ${r2.status}`);

      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  const isRunning = status === 'step1' || status === 'waiting' || status === 'step2';

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runCron}
        disabled={isRunning}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
          bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <span className="w-3 h-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : '🚀'}
        {status === 'idle' && 'Lancer le cron'}
        {status === 'step1' && 'Étape 1/2 en cours...'}
        {status === 'waiting' && `Attente ${countdown}s...`}
        {status === 'step2' && 'Étape 2/2 en cours...'}
        {status === 'done' && '✅ Terminé'}
        {status === 'error' && '❌ Réessayer'}
      </button>

      {status === 'done' && (
        <button onClick={() => setStatus('idle')} className="text-xs text-gray-500 hover:text-gray-300">
          Réinitialiser
        </button>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-400 max-w-xs truncate" title={error}>{error}</span>
      )}
    </div>
  );
}
