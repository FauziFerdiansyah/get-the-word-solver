import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { useTheme } from './contexts/ThemeContext';
import LevelSelector from './components/LevelSelector';
import ClueGrid, { MAX_EXCLUDED } from './components/ClueGrid';
import BoardGrid from './components/BoardGrid';
import ModeSelector from './components/ModeSelector';
import ViewSwitcher from './components/ViewSwitcher';
import InstallButton from './components/InstallButton';
import LaunchScreen from './components/LaunchScreen';
import UpdateBanner from './components/UpdateBanner';
import Keyboard from './components/Keyboard';
import ResultsList, { PAGE_SIZE } from './components/ResultsList';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import CoachMark from './components/CoachMark';
import RandomWordModal from './components/RandomWordModal';
import { getUniqueWords, getTopWords } from './data/words';
import { findMatches, findMatchesFromBoard } from './utils/solver';

const BOARD_ROWS = 6;
const emptyClues = (length) => Array.from({ length }, () => '');
const emptyStates = (length) => Array.from({ length }, () => 'green');
const emptyBoard = (length) =>
  Array.from({ length: BOARD_ROWS }, () => ({
    letters: Array.from({ length }, () => ''),
    states: Array.from({ length }, () => 'gray'),
  }));

export default function App() {
  const { theme, showDefinition, multiExcluded, t } = useTheme();
  const [wordLength, setWordLength] = useState(5);
  const [mode, setMode] = useState('single'); // 'single' = one clue row, 'board' = full 6-row board
  const [clues, setClues] = useState(emptyClues(5));
  const [clueStates, setClueStates] = useState(() => emptyStates(5));
  const [excluded, setExcluded] = useState(emptyClues(5));
  const [board, setBoard] = useState(() => emptyBoard(5));
  // The two modes share nothing: resetting the board must not disturb the clue
  // row, so even the crossed-out letters are kept per mode.
  const [disabledByMode, setDisabledByMode] = useState({ single: new Set(), board: new Set() });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingLength, setPendingLength] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [category, setCategory] = useState('all'); // 'common', 'rare', or 'all'
  const [mobileView, setMobileView] = useState('input'); // phone only: 'input' | 'results'
  const [pendingReset, setPendingReset] = useState(false);

  const disabledLetters = disabledByMode[mode];

  // Reading the cap instead of trimming state keeps one source of truth: turning
  // the setting off hides the extra letters without destroying them.
  const maxExcluded = multiExcluded ? MAX_EXCLUDED : 1;

  const singleFilled =
    clues.some((c) => c !== '') || excluded.some((c) => c !== '') || disabledByMode.single.size > 0;
  const boardFilled =
    board.some((row) => row.letters.some((l) => l !== '')) || disabledByMode.board.size > 0;
  // What the active mode has, for the results and the reset button…
  const hasFilledFields = mode === 'board' ? boardFilled : singleFilled;
  // …and what either mode has, for the level-change warning.
  const anythingFilled = singleFilled || boardFilled;

  // Suggestions are recomputed on every change — no need to press a button.
  const results = useMemo(() => {
    if (!hasFilledFields) return { common: [], rare: [] };

    const words = getUniqueWords(wordLength, 'all');

    // A top-box letter marked yellow means the same thing as listing it in that
    // position's excluded box, so it is folded in rather than special-cased.
    const greens = clues.map((letter, i) => (clueStates[i] === 'yellow' ? '' : letter));
    const ruledOut = excluded.map((box, i) => {
      const yellowTop = clueStates[i] === 'yellow' ? clues[i] : '';
      return [...new Set(`${(box || '').slice(0, maxExcluded)}${yellowTop}`)].join('');
    });

    const matches =
      mode === 'board'
        ? findMatchesFromBoard(words, board, disabledLetters)
        : findMatches(words, greens, ruledOut, disabledLetters);

    // `matches` is already ordered best-first, so splitting keeps the ranking.
    const commonWords = new Set(getUniqueWords(wordLength, 'common'));
    return {
      common: matches.filter((w) => commonWords.has(w)),
      rare: matches.filter((w) => !commonWords.has(w)),
    };
  }, [hasFilledFields, wordLength, mode, board, clues, clueStates, excluded, maxExcluded, disabledLetters]);

  const resultCount = results.common.length + results.rare.length;

  // Once there are matches, the dice should pick from them — common tier first,
  // since that is where a real answer almost always sits. It falls back to the
  // best-ranked words of the level when nothing has been entered yet.
  const RANDOM_POOL = 30;
  const randomWords = (() => {
    if (results.common.length > 0) return results.common.slice(0, RANDOM_POOL);
    if (results.rare.length > 0) return results.rare.slice(0, RANDOM_POOL);
    return getTopWords(wordLength);
  })();

  // A letter cannot be absent and present at once. When that happens the result
  // list is empty for a reason the user cannot see, so name the letters.
  const conflicts = useMemo(() => {
    const present = new Set();
    if (mode === 'board') {
      for (const row of board) {
        row.letters.forEach((letter, i) => {
          if (letter && row.states[i] !== 'gray') present.add(letter);
        });
      }
    } else {
      clues.forEach((letter, i) => {
        if (letter && clueStates[i] !== 'yellow') present.add(letter);
        else if (letter) present.add(letter);
      });
      for (const box of excluded) for (const letter of box || '') present.add(letter);
    }
    return [...present].filter((letter) => disabledLetters.has(letter));
  }, [mode, board, clues, clueStates, excluded, disabledLetters]);

  // Changing word length has to clear both models, since the box counts change.
  const clearEverything = (length) => {
    setClues(emptyClues(length));
    setClueStates(emptyStates(length));
    setExcluded(emptyClues(length));
    setBoard(emptyBoard(length));
    setDisabledByMode({ single: new Set(), board: new Set() });
    setVisibleCount(PAGE_SIZE);
  };

  // Reset only touches the mode you are looking at.
  const clearActiveMode = () => {
    if (mode === 'board') setBoard(emptyBoard(wordLength));
    else {
      setClues(emptyClues(wordLength));
      setClueStates(emptyStates(wordLength));
      setExcluded(emptyClues(wordLength));
    }
    setDisabledByMode((prev) => ({ ...prev, [mode]: new Set() }));
    setVisibleCount(PAGE_SIZE);
  };

  const applyLevelChange = (length) => {
    setWordLength(length);
    clearEverything(length);
  };

  const handleSelectLevel = (length) => {
    if (length === wordLength) return;
    if (anythingFilled) {
      setPendingLength(length);
    } else {
      applyLevelChange(length);
    }
  };

  const confirmLevelChange = () => {
    if (pendingLength !== null) {
      applyLevelChange(pendingLength);
      setPendingLength(null);
    }
  };

  const cancelLevelChange = () => setPendingLength(null);

  // Switching mode no longer wipes anything: the single-row clues and the board
  // are separate pieces of state, so each is still there when you come back.
  const handleSelectMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setVisibleCount(PAGE_SIZE);
  };

  // Once a position is settled by a green letter, nothing else can sit there, so
  // that position's ruled-out box is cleared rather than left as dead clutter.
  const clearExcludedAt = (index) => {
    setExcluded((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = '';
      return next;
    });
  };

  const handleClueChange = (index, value) => {
    setClues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (!value) {
      setClueStates((prev) => {
        const next = [...prev];
        next[index] = 'green';
        return next;
      });
    } else if (clueStates[index] !== 'yellow') {
      clearExcludedAt(index);
    }
    setVisibleCount(PAGE_SIZE);
  };

  const handleClueStateToggle = (index) => {
    const nextState = clueStates[index] === 'yellow' ? 'green' : 'yellow';
    setClueStates((prev) => {
      const next = [...prev];
      next[index] = nextState;
      return next;
    });
    if (nextState === 'green') clearExcludedAt(index);
    setVisibleCount(PAGE_SIZE);
  };

  const handleExcludedChange = (index, value) => {
    setExcluded((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  };

  const handleBoardLetterChange = (rowIndex, col, value) => {
    setBoard((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        const letters = [...row.letters];
        const states = [...row.states];
        letters[col] = value;
        if (!value) states[col] = 'gray';
        return { letters, states };
      })
    );
    setVisibleCount(PAGE_SIZE);
  };

  const handleBoardStateToggle = (rowIndex, col, nextState) => {
    setBoard((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        const states = [...row.states];
        states[col] = nextState;
        return { ...row, states };
      })
    );
    setVisibleCount(PAGE_SIZE);
  };

  const handleToggleLetter = (letter) => {
    setDisabledByMode((prev) => {
      const next = new Set(prev[mode]);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return { ...prev, [mode]: next };
    });
    setVisibleCount(PAGE_SIZE);
  };

  // 4. Reset throws work away, so it asks first whenever there is work to lose.
  const handleReset = () => {
    if (hasFilledFields) setPendingReset(true);
    else applyReset();
  };

  const applyReset = () => {
    clearActiveMode();
    setCategory('all');
    setPendingReset(false);
  };

  const handleShowMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  // Taken at save time, not on render, so a saved session is never a stale copy.
  // Sets are stored as arrays because JSON has no Set.
  const snapshotSession = () => ({
    wordLength,
    mode,
    clues,
    clueStates,
    excluded,
    board,
    disabled: {
      single: [...disabledByMode.single],
      board: [...disabledByMode.board],
    },
  });

  const restoreSession = (state) => {
    setWordLength(state.wordLength);
    setMode(state.mode);
    setClues(state.clues);
    setClueStates(state.clueStates);
    setExcluded(state.excluded);
    setBoard(state.board);
    setDisabledByMode({
      single: new Set(state.disabled.single),
      board: new Set(state.disabled.board),
    });
    setVisibleCount(PAGE_SIZE);
    setCategory('all');
    setShowSettings(false);
  };

  // Reset the page when switching tiers: carrying a large visibleCount over to a
  // tier with few matches collapsed the list and shifted the page under you.
  const handleCategoryChange = (next) => {
    setCategory(next);
    setVisibleCount(PAGE_SIZE);
  };

  // Keyboard tinting: green wins over yellow when a letter is both.
  const letterColors = new Map();
  if (mode === 'single') {
    clues.forEach((letter, i) => {
      if (!letter || disabledLetters.has(letter)) return;
      if (clueStates[i] === 'yellow') {
        if (!letterColors.has(letter)) letterColors.set(letter, 'yellow');
      } else {
        letterColors.set(letter, 'green');
      }
    });
    excluded.forEach((box) => {
      for (const letter of box || '') {
        if (!disabledLetters.has(letter) && !letterColors.has(letter)) {
          letterColors.set(letter, 'yellow');
        }
      }
    });
  } else {
    board.forEach((row) => {
      row.letters.forEach((letter, i) => {
        if (!letter || disabledLetters.has(letter)) return;
        const state = row.states[i] || 'gray';
        if (state === 'green') letterColors.set(letter, 'green');
        else if (state === 'yellow' && letterColors.get(letter) !== 'green') {
          letterColors.set(letter, 'yellow');
        }
      });
    });
  }

  return (
    <div className="min-h-screen w-full transition-colors" style={{ backgroundColor: theme.bg }}>
      <LaunchScreen />
      <GooeyToaster position="bottom-center" expand={true} visibleToasts={3} duration={2500} preset="snappy" />

      <main className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-10">
        {/* Header keeps the icons in the flow so a long subtitle can never
            slide underneath them on a narrow screen. */}
        <div className="mb-3 empty:mb-0"><UpdateBanner /></div>

        <header className="flex items-center gap-3 mb-3 sm:mb-4">
          <img src="./word.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold truncate" style={{ color: theme.text }}>
              {t.appTitle}
            </h1>
            <p className="text-[11px] sm:text-xs font-medium" style={{ color: theme.textMuted }}>
              {t.appSubtitle}
            </p>
          </div>
          <div className="ml-auto flex gap-2 shrink-0">
            <button
              onClick={() => setShowCoach(true)}
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 touch-manipulation"
              style={{ borderColor: theme.border, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
              aria-label={t.help}
            >
              <Icon icon="tabler:info-circle" width={20} style={{ color: theme.text }} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 touch-manipulation"
              style={{ borderColor: theme.border, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
              aria-label="Settings"
            >
              <Icon icon="tabler:settings" width={20} style={{ color: theme.text }} />
            </button>
          </div>
        </header>

        {/* Sits under the header, then sticks to the top edge once the page
            scrolls that far — phones only, since desktop shows both panels. */}
        <ViewSwitcher view={mobileView} onSelect={setMobileView} resultCount={resultCount} />

        <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
          {/* Left panel */}
          <div
            data-testid="input-panel"
            className={`w-full lg:w-1/2 flex-col gap-4 sm:gap-5 ${
              mobileView === 'results' ? 'hidden lg:flex' : 'flex'
            }`}
          >
          <LevelSelector wordLength={wordLength} onSelect={handleSelectLevel} />

          <ModeSelector mode={mode} onSelect={handleSelectMode} />

          <section
            className="rounded-xl border-2 p-3 sm:p-4 flex flex-col gap-3"
            style={{ backgroundColor: theme.accent, borderColor: theme.border, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <h2 className="text-sm font-bold text-center" style={{ color: theme.text }}>
              {mode === 'board' ? t.boardTitle : t.clueTitle} ({wordLength} {t.letters})
            </h2>
            {mode === 'board' ? (
              <BoardGrid
                rows={board}
                onLetterChange={handleBoardLetterChange}
                onStateToggle={handleBoardStateToggle}
              />
            ) : (
              <ClueGrid
                clues={clues}
                clueStates={clueStates}
                excluded={excluded}
                maxExcluded={maxExcluded}
                onChange={handleClueChange}
                onStateToggle={handleClueStateToggle}
                onExcludedChange={handleExcludedChange}
                disabledLetters={disabledLetters}
              />
            )}
          </section>

          {/* Tighter padding here: the keyboard wants every pixel of width it
              can get on a small phone. */}
          {/* No heading: the keys speak for themselves and the row was eating
              vertical space on a phone. */}
          <section
            className="rounded-xl border-2 p-2 sm:p-4 flex flex-col gap-3"
            style={{ backgroundColor: theme.accent2, borderColor: theme.border, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <Keyboard disabledLetters={disabledLetters} letterColors={letterColors} onToggle={handleToggleLetter} />
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasFilledFields}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] disabled:opacity-50 touch-manipulation"
              style={{ backgroundColor: theme.btnSecondary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
            >
              <Icon icon="tabler:eraser" width={18} />
              {t.reset}
            </button>
            <button
              type="button"
              onClick={() => setShowRandom(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
              style={{ backgroundColor: theme.keyboard, borderColor: theme.border, color: theme.text, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
            >
              <Icon icon="tabler:dice-3" width={18} />
              {t.randomWord}
            </button>
          </div>

          <InstallButton />
        </div>

        {/* Right panel: results */}
        <div
          data-testid="results-panel"
          className={`w-full lg:w-1/2 mt-4 sm:mt-5 lg:mt-0 ${
            mobileView === 'input' ? 'hidden lg:block' : 'block'
          }`}
        >
          <ResultsList
            results={results}
            visibleCount={visibleCount}
            onShowMore={handleShowMore}
            hasSearched={hasFilledFields}
            showDefinition={showDefinition}
            category={category}
            conflicts={conflicts}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        </div>
      </main>

      <ConfirmModal
        open={pendingLength !== null}
        message={t.confirmLevelChange}
        onConfirm={confirmLevelChange}
        onCancel={cancelLevelChange}
      />

      <ConfirmModal
        open={pendingReset}
        message={mode === 'board' ? t.confirmResetBoard : t.confirmResetClues}
        onConfirm={applyReset}
        onCancel={() => setPendingReset(false)}
      />

      {/* Mounted only while open: the sheet holds its own state for the sessions
          and changelog popups, and keeping it mounted meant reopening Settings
          reopened whichever popup was last on screen. */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          snapshot={snapshotSession}
          onRestoreSession={restoreSession}
        />
      )}
      <CoachMark open={showCoach} onClose={() => setShowCoach(false)} />
      {showRandom && (
        <RandomWordModal
          onClose={() => setShowRandom(false)}
          wordLength={wordLength}
          words={randomWords}
          fromResults={resultCount > 0}
        />
      )}
    </div>
  );
}
