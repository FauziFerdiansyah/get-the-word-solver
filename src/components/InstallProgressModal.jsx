import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

// Installation itself reports no progress: `prompt()` resolves with
// accepted/dismissed and `appinstalled` fires when the OS is done. There is no
// percentage to read, and inventing one would be a fake loading bar.
//
// So this measures the two things that are real at that moment:
//
//   1. pulling the app's own files down and into the cache, weighted by the
//      bytes actually received — not by file count, which finishes in a blink
//      because most files are small
//   2. waiting for the OS to report `appinstalled`, which is the second or two
//      of apparent hang the user noticed after the bar filled
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
    './screen-light.svg', './screen-dark.svg', './word.png', './og-image.png',
  ]) {
    urls.add(extra);
  }
  return [...urls].filter(Boolean);
}

const CACHE = 'wordle-solver-offline';
// How much of the bar belongs to downloading; the rest waits on the OS.
const DOWNLOAD_SHARE = 0.9;
// If `appinstalled` never arrives (some browsers skip it), stop waiting.
const INSTALL_TIMEOUT_MS = 15000;

export default function InstallProgressModal({ onClose }) {
  const { theme, t } = useTheme();
  // The list never changes once the modal is open, so it is read during init
  // rather than inside the effect.
  const [assets] = useState(assetList);
  const total = assets.length;
  const [done, setDone] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [downloadRatio, setDownloadRatio] = useState(0);
  const [stage, setStage] = useState('downloading'); // downloading → installing → ready
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let installed = false;

    const onInstalled = () => {
      installed = true;
      if (!cancelled) setStage((s) => (s === 'downloading' ? s : 'ready'));
    };
    window.addEventListener('appinstalled', onInstalled);

    const cacheAll = async () => {
      const cache = 'caches' in window ? await caches.open(CACHE).catch(() => null) : null;
      let misses = 0;
      let received = 0;

      // Sizes are unknown up front, so the bar advances per file while the byte
      // counter shows the real volume moved.
      for (let i = 0; i < assets.length; i += 1) {
        if (cancelled) return;
        const url = assets[i];
        try {
          // `reload` skips the HTTP cache, so this is a genuine download.
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok) {
            const body = await res.clone().arrayBuffer();
            received += body.byteLength;
            if (cache) await cache.put(url, res);
          } else {
            misses += 1;
          }
        } catch {
          misses += 1;
        }
        if (cancelled) return;
        setDone(i + 1);
        setBytes(received);
        setDownloadRatio((i + 1) / assets.length);
      }

      if (cancelled) return;
      setFailed(misses);

      // Files are down; now wait for the OS to finish the install itself.
      setStage(installed ? 'ready' : 'installing');
      if (!installed) {
        const started = Date.now();
        while (!installed && !cancelled && Date.now() - started < INSTALL_TIMEOUT_MS) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (!cancelled) setStage('ready');
      }
    };

    cacheAll();
    return () => {
      cancelled = true;
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [assets]);

  const finished = stage === 'ready';
  const percent = finished
    ? 100
    : Math.round(downloadRatio * DOWNLOAD_SHARE * 100);
  const megabytes = (bytes / 1024 / 1024).toFixed(2);

  const title = finished ? t.installReady : stage === 'installing' ? t.installFinishing : t.installPreparing;
  const note = finished
    ? t.installReadyNote
    : stage === 'installing'
      ? t.installFinishingNote
      : t.installPreparingNote;

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
              icon={finished ? 'tabler:circle-check' : stage === 'installing' ? 'tabler:loader-2' : 'tabler:cloud-download'}
              width={20}
              style={{ color: theme.text }}
              className={stage === 'installing' ? 'animate-spin' : ''}
            />
          </span>
          {title}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
          {note}
        </p>

        {/* Real numbers: files fetched, and the bytes they actually weighed */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: theme.text }}>
            <span>{done}/{total} {t.installFiles} · {megabytes} MB</span>
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
              style={{
                width: `${percent}%`,
                backgroundColor: theme.green,
                // A barber-pole while the OS works, since that part has no size.
                backgroundImage: stage === 'installing'
                  ? `repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 6px, transparent 6px 12px)`
                  : 'none',
              }}
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
