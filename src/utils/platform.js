// Platform checks shared by the install flow and the launch screen.

// True when the page is running as an installed app rather than a browser tab.
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true);

// iPadOS 13+ reports a Mac user agent, so touch points are the giveaway.
export const isIOS = () => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1)
  );
};

// Every iOS browser is WebKit; only the real Safari lacks these markers.
export const isIOSSafari = () =>
  isIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent || '');
