import { useState } from 'react';
import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import {
  listSessions, saveSession, removeSession, sessionSummary, defaultSessionName, MAX_SESSIONS,
} from '../utils/sessions';

// Lives inside the settings sheet. `snapshot()` is called at save time rather
// than on render, so the list never holds a stale copy of the board.
export default function SessionManager({ snapshot, onRestore }) {
  const { theme, t } = useTheme();
  const [sessions, setSessions] = useState(listSessions);
  const [name, setName] = useState('');

  const handleSave = () => {
    const state = snapshot();
    const next = saveSession(name.trim(), state);
    setSessions(next);
    setName('');
    gooeyToast(next.length === sessions.length ? t.sessionSaveFailed : t.sessionSaved, {
      duration: 1800,
    });
  };

  const handleLoad = (entry) => {
    onRestore(entry.state);
    gooeyToast(`${t.sessionLoaded} ${entry.name}`, { duration: 1800 });
  };

  const handleRemove = (entry) => {
    setSessions(removeSession(entry.id));
    gooeyToast(t.sessionRemoved, { duration: 1500 });
  };

  const full = sessions.length >= MAX_SESSIONS;

  return (
    <div className="py-3 border-b flex flex-col gap-3" style={{ borderColor: theme.border + '40' }}>
      <span className="text-sm font-semibold flex flex-col gap-0.5" style={{ color: theme.text }}>
        <span className="flex items-center gap-2">
          <Icon icon="tabler:bookmarks" width={18} />
          {t.sessions}
        </span>
        <span className="text-[11px] font-normal" style={{ color: theme.textMuted }}>
          {t.sessionsNote}
        </span>
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
        <p className="text-[11px]" style={{ color: theme.red }}>
          {t.sessionsFull}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-[11px]" style={{ color: theme.textMuted }}>
          {t.sessionsEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((entry) => {
            const { letters, crossed } = sessionSummary(entry.state);
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border-2 px-3 py-2"
                style={{ backgroundColor: theme.accent, borderColor: theme.border }}
              >
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate" style={{ color: theme.text }}>
                    {entry.name}
                  </span>
                  <span className="text-[11px]" style={{ color: theme.textMuted }}>
                    {entry.state.wordLength} {t.letters} ·{' '}
                    {entry.state.mode === 'board' ? t.modeBoard : t.modeSingle} ·{' '}
                    {letters} {t.sessionLetters}
                    {crossed > 0 ? ` · ${crossed} ${t.sessionCrossed}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleLoad(entry)}
                  aria-label={`${t.sessionLoad} ${entry.name}`}
                  className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
                  style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border }}
                >
                  <Icon icon="tabler:folder-open" width={16} style={{ color: '#1e293b' }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  aria-label={`${t.sessionRemove} ${entry.name}`}
                  className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <Icon icon="tabler:trash" width={16} style={{ color: theme.red }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
