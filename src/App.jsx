import { useState } from 'react';
import { Icon } from '@iconify/react';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { useTheme } from './contexts/ThemeContext';
import { playSuccessSound, warmUp } from './utils/sound';
import LevelSelector from './components/LevelSelector';
import ClueGrid from './components/ClueGrid';
import Keyboard from './components/Keyboard';
import ResultsList, { PAGE_SIZE } from './components/ResultsList';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import CoachMark from './components/CoachMark';
import { WORD_LISTS } from './data/words';
import { findMatches } from './utils/solver';

const emptyClues = (length) => Array.from({ length }, () => '');
const emptyColors = (length) => Array.from({ length }, () => 'green');

export default function App() {
  const { theme, soundEnabled } = useTheme();
  const [wordLength, setWordLength] = useState(5);
  const [clues, setClues] = useState(emptyClues(5));
  const [colorStates, setColorStates] = useState(emptyColors(5));
  const [disabledLetters, setDisabledLetters] = useState(new Set());
  const [results, setResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingLength, setPendingLength] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const hasFilledFields = () =>
    clues.some((c) => c !== '') || disabledLetters.size > 0;

  const applyLevelChange = (length) => {
    setWordLength(length);
    setClues(emptyClues(length));
    setColorStates(emptyColors(length));
    setDisabledLetters(new Set());
    setResults([]);
    setVisibleCount(PAGE_SIZE);
    setHasSearched(false);
  };

  const handleSelectLevel = (length) => {
    if (length === wordLength) return;
    if (hasFilledFields()) {
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

  const handleClueChange = (index, value) => {
    setClues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (!value) {
      setColorStates((prev) => {
        const next = [...prev];
        next[index] = 'green';
        return next;
      });
    }
  };

  const handleColorToggle = (index) => {
    setColorStates((prev) => {
      const next = [...prev];
      next[index] = prev[index] === 'green' ? 'yellow' : 'green';
      return next;
    });
  };

  const handleToggleLetter = (letter) => {
    setDisabledLetters((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const handleSearch = () => {
    const words = WORD_LISTS[wordLength] || [];
    const matches = findMatches(words, clues, colorStates, disabledLetters);
    setResults(matches);
    setVisibleCount(PAGE_SIZE);
    setHasSearched(true);
    if (soundEnabled && matches.length > 0) playSuccessSound();
  };

  const handleReset = () => {
    setClues(emptyClues(wordLength));
    setColorStates(emptyColors(wordLength));
    setDisabledLetters(new Set());
    setResults([]);
    setVisibleCount(PAGE_SIZE);
    setHasSearched(false);
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const letterColors = new Map();
  clues.forEach((letter, i) => {
    if (!letter || disabledLetters.has(letter)) return;
    const state = colorStates[i] || 'green';
    const existing = letterColors.get(letter);
    if (!existing || (state === 'green' && existing === 'yellow')) {
      letterColors.set(letter, state);
    }
  });

  return (
    <div className="min-h-screen w-full transition-colors" style={{ backgroundColor: theme.bg }} onPointerDown={warmUp}>
      <GooeyToaster position="bottom-center" expand={true} visibleToasts={3} duration={1500} preset="snappy" />

      {/* Top bar with icons */}
      <div className="absolute top-4 right-4 flex gap-2 z-40">
        <button
          onClick={() => setShowCoach(true)}
          className="w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90"
          style={{ borderColor: theme.border, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          aria-label="Info"
        >
          <Icon icon="tabler:info-circle" width={20} style={{ color: theme.text }} />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90"
          style={{ borderColor: theme.border, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          aria-label="Settings"
        >
          <Icon icon="tabler:settings" width={20} style={{ color: theme.text }} />
        </button>
      </div>

      {/* Main layout: desktop 50-50, mobile stacked */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row lg:gap-8 lg:items-start lg:py-10">
        {/* Left panel: solver input */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5">
          {/* Header with logo */}
          <header className="flex items-center gap-3">
            <img src="./word.png" alt="Logo" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-extrabold" style={{ color: theme.text }}>
                Wordle Solver
              </h1>
              <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
                Cari jawaban Wordle / Get the Word
              </p>
            </div>
          </header>

          <LevelSelector wordLength={wordLength} onSelect={handleSelectLevel} />

          <section
            className="rounded-xl border-2 p-4 flex flex-col gap-3"
            style={{ backgroundColor: theme.accent, borderColor: theme.border, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <h2 className="text-sm font-bold text-center" style={{ color: theme.text }}>
              Clue Kata ({wordLength} Huruf)
            </h2>
            <ClueGrid
              clues={clues}
              colorStates={colorStates}
              onChange={handleClueChange}
              onColorToggle={handleColorToggle}
              disabledLetters={disabledLetters}
            />
          </section>

          <section
            className="rounded-xl border-2 p-4 flex flex-col gap-3"
            style={{ backgroundColor: theme.accent2, borderColor: theme.border, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <h2 className="text-sm font-bold text-center" style={{ color: theme.text }}>
              Coret Huruf yang Tidak Ada
            </h2>
            <Keyboard disabledLetters={disabledLetters} letterColors={letterColors} onToggle={handleToggleLetter} />
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
              style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
            >
              Cari Jawaban
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
              style={{ backgroundColor: theme.btnSecondary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right panel: results */}
        <div className="w-full lg:w-1/2 mt-5 lg:mt-0">
          <ResultsList
            results={results}
            visibleCount={visibleCount}
            onShowMore={handleShowMore}
            hasSearched={hasSearched}
          />
        </div>
      </div>

      <ConfirmModal
        open={pendingLength !== null}
        message="Mengganti level akan mereset clue dan huruf yang sudah diisi. Lanjutkan?"
        onConfirm={confirmLevelChange}
        onCancel={cancelLevelChange}
      />

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <CoachMark open={showCoach} onClose={() => setShowCoach(false)} />
    </div>
  );
}
