import { useState } from 'react';
import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import {
  listSessions, saveSession, removeSession, sessionSummary, sessionPreview,
  defaultSessionName, formatSavedAt, MAX_SESSIONS,
} from '../utils/sessions';

// A popup of its own rather than a block inside the settings sheet: the list
// grows, and burying it between toggles meant scrolling past the whole of
// Settings to reach it.
//
// `snapshot()` is called at save time, not on render, so a saved session can
// never be a stale copy of the board.
export default function SessionManager({ snapshot, onRestore, onClose }) {
  const { theme, t, lang } = useTheme();
  const [sessions, setSessions] = useState(listSessions);
  const [name, setName] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  const handleSave = () => {
    const next = saveSession(name.trim(), snapshot());
    const saved = next.length !== sessions.length;
    setSessions(next);
    setName('');
    gooeyToast(saved ? t.sessionSaved : t.sessionSaveFailed, { duration: 1800 });
  };

  const handleRemove = (entry) => {
    setSessions(removeSession(entry.id));
    setConfirmingId(null);
    gooeyToast(t.sessionRemoved, { duration: 1500 });
  };

  const tileColor = (state) => {
    if (state === 'green') return { backgroundColor: theme.green, color: theme.textOnColor };
    if (state === 'yellow') return { backgroundColor: theme.yellow, color: '#1e293b' };
    if (state === 'gray') return { backgroundColor: theme.disabled, color: '#ffffff' };
    return { backgroundColor: theme.card, color: theme.textMuted };
  };

  const full = sessions.length >= MAX_SESSIONS;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.sessions}
    >
      <div
        className="w-full h-full flex flex-col overflow-y-auto p-4 sm:h-auto sm:max-h-[88vh] sm:max-w-md sm:rounded-xl sm:border-2 sm:p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-3 mb-4 border-b-2 sticky -top-4 sm:-top-5 z-10"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: theme.text }}>
            <span
              className="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent, borderColor: theme.border }}
            >
              <Icon icon="tabler:bookmarks" width={18} style={{ color: theme.text }} />
            </span>
            {t.sessions}
          </h2>
          <span
            className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg shrink-0"
            style={{ backgroundColor: theme.keyboard, color: theme.textMuted }}
          >
            {sessions.length}/{MAX_SESSIONS}
          </span>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
            style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon="tabler:x" width={18} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Save the current puzzle */}
        <div
          className="rounded-xl border-2 p-3 flex flex-col gap-2 mb-4"
          style={{ backgroundColor: theme.accent, borderColor: theme.border }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>
            {t.sessionSaveCurrent}
          </span>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={defaultSessionName(snapshot())}
              aria-label={t.sessionName}
              className="flex-1 min-w-0 rounded-lg border-2 px-3 py-2 text-[16px] focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
                '--tw-ring-color': theme.border,
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={full}
              className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold shrink-0 transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] disabled:opacity-50 touch-manipulation"
              style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
            >
              <Icon icon="tabler:device-floppy" width={16} />
              {t.sessionSave}
            </button>
          </div>
          {full && (
            <p className="text-[11px]" style={{ color: theme.red }}>{t.sessionsFull}</p>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Icon icon="tabler:bookmark-off" width={32} style={{ color: theme.textMuted }} />
            <p className="text-sm" style={{ color: theme.textMuted }}>{t.sessionsEmpty}</p>
            <p className="text-[11px] max-w-[18rem]" style={{ color: theme.textMuted }}>{t.sessionsNote}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((entry) => {
              const { letters, crossed } = sessionSummary(entry.state);
              const preview = sessionPreview(entry.state);
              const confirming = confirmingId === entry.id;
              return (
                <li
                  key={entry.id}
                  className="rounded-xl border-2 p-3 flex flex-col gap-2"
                  style={{ backgroundColor: theme.accent, borderColor: theme.border }}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <span className="text-sm font-extrabold truncate" style={{ color: theme.text }}>
                        {entry.name}
                      </span>
                      <span className="text-[11px] flex items-center gap-1" style={{ color: theme.textMuted }}>
                        <Icon icon="tabler:clock" width={12} className="shrink-0" />
                        {formatSavedAt(entry.savedAt, lang)}
                      </span>
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: theme.keyboard, color: theme.textMuted }}
                    >
                      {entry.state.wordLength}L · {entry.state.mode === 'board' ? t.modeBoard : t.modeSingle}
                    </span>
                  </div>

                  {/* What the puzzle looked like, so a session is recognisable */}
                  <div className="flex gap-1">
                    {preview.map((tile, i) => (
                      <span
                        key={i}
                        className="flex-1 max-w-8 aspect-square rounded border-2 flex items-center justify-center text-[11px] font-extrabold"
                        style={{ ...tileColor(tile.state), borderColor: theme.border }}
                      >
                        {tile.letter}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] flex-1" style={{ color: theme.textMuted }}>
                      {letters} {t.sessionLetters}
                      {crossed > 0 ? ` · ${crossed} ${t.sessionCrossed}` : ''}
                    </span>

                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRemove(entry)}
                          className="rounded-lg border-2 px-3 py-2 text-xs font-bold active:scale-95 transition-transform touch-manipulation"
                          style={{ backgroundColor: theme.red, borderColor: theme.border, color: '#ffffff' }}
                        >
                          {t.sessionRemoveConfirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded-lg border-2 px-3 py-2 text-xs font-bold active:scale-95 transition-transform touch-manipulation"
                          style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
                        >
                          {t.cancel}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onRestore(entry.state)}
                          aria-label={`${t.sessionLoad} ${entry.name}`}
                          className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold active:translate-x-[1.5px] active:translate-y-[1.5px] transition-all touch-manipulation"
                          style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
                        >
                          <Icon icon="tabler:folder-open" width={14} />
                          {t.sessionOpen}
                        </button>
                        {/* Two taps to delete: one stray tap should not lose work */}
                        <button
                          type="button"
                          onClick={() => setConfirmingId(entry.id)}
                          aria-label={`${t.sessionRemove} ${entry.name}`}
                          className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
                          style={{ backgroundColor: theme.card, borderColor: theme.border }}
                        >
                          <Icon icon="tabler:trash" width={16} style={{ color: theme.red }} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
