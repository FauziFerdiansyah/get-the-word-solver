// Saved sessions.
//
// localStorage rather than cookies: cookies ride along with every HTTP request,
// which is pure waste for a site with no backend, and they cap out around 4 kB.
// localStorage gives ~5 MB per origin, is synchronous, and already holds the
// settings under the same `ws-` prefix.
//
// Everything here tolerates corrupt or foreign data: a saved session is user
// data that may have been written by an older version of the app, so it is
// validated on the way in rather than trusted.

const KEY = 'ws-sessions';
const SCHEMA = 1;
const MAX_SESSIONS = 12;

const isLetters = (value, length) =>
  Array.isArray(value) && value.length === length && value.every((v) => typeof v === 'string');

// A session is only restorable if every array matches the word length it claims.
export function isValidSession(session) {
  if (!session || typeof session !== 'object') return false;
  const { wordLength, mode, clues, clueStates, excluded, board, disabled } = session;
  if (![4, 5, 6].includes(wordLength)) return false;
  if (mode !== 'single' && mode !== 'board') return false;
  if (!isLetters(clues, wordLength)) return false;
  if (!isLetters(clueStates, wordLength)) return false;
  if (!isLetters(excluded, wordLength)) return false;
  if (!Array.isArray(board) || board.length === 0) return false;
  if (!board.every((row) => isLetters(row?.letters, wordLength) && isLetters(row?.states, wordLength))) {
    return false;
  }
  if (!disabled || !Array.isArray(disabled.single) || !Array.isArray(disabled.board)) return false;
  return true;
}

export function listSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry) => entry?.schema === SCHEMA && isValidSession(entry.state))
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return [];
  }
}

const write = (sessions) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    // Storage full or blocked (private mode): the app keeps working unsaved.
  }
  return listSessions();
};

export function saveSession(name, state) {
  if (!isValidSession(state)) return listSessions();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    schema: SCHEMA,
    name: String(name || '').slice(0, 40) || defaultSessionName(state),
    savedAt: Date.now(),
    state,
  };
  return write([entry, ...listSessions()]);
}

export function removeSession(id) {
  return write(listSessions().filter((entry) => entry.id !== id));
}

export function clearSessions() {
  return write([]);
}

// How many boxes actually carry something — shown next to a saved session so the
// list is not just a column of timestamps.
export function sessionSummary(state) {
  if (!isValidSession(state)) return { letters: 0, crossed: 0 };
  if (state.mode === 'board') {
    return {
      letters: state.board.reduce((n, row) => n + row.letters.filter(Boolean).length, 0),
      crossed: state.disabled.board.length,
    };
  }
  return {
    letters: state.clues.filter(Boolean).length + state.excluded.filter(Boolean).length,
    crossed: state.disabled.single.length,
  };
}

export function defaultSessionName(state) {
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${state?.wordLength ?? '?'}L · ${state?.mode === 'board' ? '6' : '1'} · ${stamp}`;
}

export { MAX_SESSIONS };
