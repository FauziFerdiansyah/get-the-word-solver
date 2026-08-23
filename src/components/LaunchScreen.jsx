import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { isStandalone } from '../utils/platform';

// A web app manifest cannot carry a splash image: Android builds its splash from
// `name`, `background_color` and the icons, and nothing else. The only place a
// custom launch image is possible natively is iOS, via a matrix of
// `apple-touch-startup-image` PNGs — one per exact device size, several hundred
// kilobytes for a handful of iPhones.
//
// This is the cheap way to get the same result everywhere: paint the launch
// screen inside the app, over the platform's own, using the two 10 kB SVGs. It
// only runs when launched as an installed app, so a browser tab is not delayed.
const HOLD_MS = 900;
const FADE_MS = 350;

export default function LaunchScreen() {
  const { darkMode } = useTheme();
  const [phase, setPhase] = useState(() => (isStandalone() ? 'visible' : 'gone'));

  useEffect(() => {
    if (phase !== 'visible') return undefined;
    const fade = setTimeout(() => setPhase('fading'), HOLD_MS);
    const gone = setTimeout(() => setPhase('gone'), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: darkMode ? '#000000' : '#ffffff',
        backgroundImage: `url(${darkMode ? './screen-dark.svg' : './screen-light.svg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      <img
        src="./icon-512.png"
        alt=""
        className="w-32 h-32 sm:w-40 sm:h-40"
        style={{ animation: 'launch-pop 420ms ease-out' }}
      />
    </div>
  );
}
