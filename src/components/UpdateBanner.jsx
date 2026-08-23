import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

// How an installed copy gets a new build.
//
// There is no store and no update API. The service worker is the only thing that
// notices a new release: it is registered on every launch, the browser fetches
// `sw.js`, and a changed `CACHE_NAME` makes it a different file, so a new worker
// installs. `main.jsx` fires `ws-update-ready` at that point.
//
// The page still runs the old bundle until it reloads, which is what this offers.
// It matters most on iOS, where a home-screen app is often left open for days and
// never reloads on its own.
export default function UpdateBanner() {
  const { theme, t } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener('ws-update-ready', onReady);
    return () => window.removeEventListener('ws-update-ready', onReady);
  }, []);

  if (!ready) return null;

  const reload = () => {
    // Drop the caches first, or the old bundle can be served straight back.
    const clear = 'caches' in window
      ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      : Promise.resolve();
    clear.catch(() => {}).then(() => window.location.reload());
  };

  return (
    <div
      className="rounded-xl border-2 p-3 flex items-center gap-3"
      style={{
        backgroundColor: theme.accent,
        borderColor: theme.border,
        boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
      }}
      role="status"
    >
      <span
        className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
      >
        <Icon icon="tabler:download" width={18} style={{ color: theme.text }} />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-extrabold" style={{ color: theme.text }}>
          {t.updateReady}
        </span>
        <span className="text-[11px] leading-snug" style={{ color: theme.textMuted }}>
          {t.updateReadyNote}
        </span>
      </span>
      <button
        type="button"
        onClick={reload}
        className="rounded-lg border-2 px-3 py-2 text-xs font-bold shrink-0 active:translate-x-[1.5px] active:translate-y-[1.5px] transition-all touch-manipulation"
        style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
      >
        {t.updateReload}
      </button>
    </div>
  );
}
