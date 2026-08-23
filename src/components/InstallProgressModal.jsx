import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

// Installation itself reports no progress: `prompt()` resolves with
// accepted/dismissed and `appinstalled` fires when the OS is done. There is no
// percentage to read, and inventing one would be a fake loading bar.
//
// So this measures something real and genuinely useful at that moment: pulling
// the app's own files into the cache so the installed copy works offline. The
// percentage is files fetched over files total.
//
// The asset list is read from the document rather than hardcoded, because Vite
// gives the JS and CSS bundles hashed names that change on every build.
function assetList() {
  const urls = new Set(['./', './index.html', './manifest.json']);
  for (const el of document.querySelectorAll('script[src]')) urls.add(el.getAttribute('src'));
  for (const el of document.querySelectorAll('link[rel="stylesheet"][href]')) {
    urls.add(el.getAttribute('href'));
  }
  for (const extra of [
    './keys.mp3', './error.wav', './bell.wav',
    './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
    './screen-light.svg', './screen-dark.svg', './word.png',
  ]) {
    urls.add(extra);
  }
  return [...urls].filter(Boolean);
}

const CACHE = 'wordle-solver-offline';

export default function InstallProgressModal({ onClose }) {
  const { theme, t } = useTheme();
  // The list never changes once the modal is open, so it is read during init
  // rather than inside the effect.
  const [assets] = useState(assetList);
  const total = assets.length;
  const [done, setDone] = useState(0);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const cacheAll = async () => {
      const cache = 'caches' in window ? await caches.open(CACHE).catch(() => null) : null;
      let misses = 0;
      for (const url of assets) {
        if (cancelled) return;
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok && cache) await cache.put(url, res.clone());
          else if (!res.ok) misses += 1;
        } catch {
          misses += 1;
        }
        if (!cancelled) setDone((n) => n + 1);
      }
      if (!cancelled) {
        setFailed(misses);
        setFinished(true);
      }
    };

    cacheAll();
    return () => { cancelled = true; };
  }, [assets]);

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.installPreparing}
    >
      <div
        className="w-full h-full flex flex-col justify-center gap-4 p-6 sm:h-auto sm:max-w-sm sm:rounded-xl sm:border-2 sm:p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
      >
        <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: theme.text }}>
          <span
            className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0"
            style={{ backgroundColor: theme.accent, borderColor: theme.border }}
          >
            <Icon
              icon={finished ? 'tabler:circle-check' : 'tabler:cloud-download'}
              width={20}
              style={{ color: theme.text }}
            />
          </span>
          {finished ? t.installReady : t.installPreparing}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
          {finished ? t.installReadyNote : t.installPreparingNote}
        </p>

        {/* Real numbers: files fetched over files total */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: theme.text }}>
            <span>{done}/{total} {t.installFiles}</span>
            <span
              className="px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: theme.keyboard, color: theme.textMuted }}
            >
              {percent}%
            </span>
          </div>
          <div
            className="h-4 rounded-lg border-2 overflow-hidden"
            style={{ borderColor: theme.border, backgroundColor: theme.keyboard }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-all duration-200"
              style={{ width: `${percent}%`, backgroundColor: theme.green }}
            />
          </div>
        </div>

        {finished && failed > 0 && (
          <p className="text-[11px]" style={{ color: theme.red }}>
            {failed} {t.installSkipped}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={!finished}
          className="py-3 rounded-xl border-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] disabled:opacity-50 touch-manipulation"
          style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
        >
          {finished ? t.coachDone : `${percent}%`}
        </button>
      </div>
    </div>
  );
}
