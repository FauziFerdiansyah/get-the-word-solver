import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import { SWITCHES, FEELS } from '../data/switches';
import { playKeySound, loadSwitch, setSoundSwitch, setSoundVolume } from '../utils/sound';

const FEEL_ICONS = {
  linear: 'tabler:arrow-down',
  tactile: 'tabler:wave-sine',
  clicky: 'tabler:bell',
};

// A popup of its own: the switch list plus a slider is more than a settings row
// can hold without pushing everything else out of reach.
export default function SoundModal({ onClose }) {
  const { theme, t, soundSwitch, setSoundSwitchId, soundVolume, setSoundVolumeValue } = useTheme();

  // Preview as you change things — a slider you cannot hear is guesswork.
  const handleVolume = (value) => {
    setSoundVolumeValue(value);
    setSoundVolume(value);
    if (value > 0) playKeySound('F');
  };

  const handleSwitch = (id) => {
    setSoundSwitchId(id);
    setSoundSwitch(id);
    loadSwitch(id).then(() => playKeySound('J'));
  };

  const percent = Math.round(soundVolume * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.soundSettings}
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
              <Icon icon="tabler:keyboard" width={18} style={{ color: theme.text }} />
            </span>
            {t.soundSettings}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
            style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon="tabler:x" width={18} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Volume */}
        <div
          className="rounded-xl border-2 p-3 flex flex-col gap-2 mb-4"
          style={{ backgroundColor: theme.accent, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Icon icon={percent === 0 ? 'tabler:volume-off' : 'tabler:volume'} width={14} />
              {t.soundVolume}
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: theme.keyboard, color: theme.text }}
            >
              {percent}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent}
            onChange={(e) => handleVolume(Number(e.target.value) / 100)}
            aria-label={t.soundVolume}
            className="w-full h-6 touch-manipulation"
            style={{ accentColor: theme.green }}
          />
        </div>

        {/* Switch, grouped by how it feels and sounds */}
        <div className="flex flex-col gap-4">
          {FEELS.map((feel) => {
            const options = SWITCHES.filter((entry) => entry.feel === feel);
            if (options.length === 0) return null;
            return (
              <div key={feel} className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                  <Icon icon={FEEL_ICONS[feel]} width={14} />
                  {t.feels[feel].title}
                  <span className="font-normal normal-case">— {t.feels[feel].note}</span>
                </span>
                <div className="flex flex-col gap-2">
                  {options.map((entry) => {
                    const active = entry.id === soundSwitch;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSwitch(entry.id)}
                        aria-pressed={active}
                        className="flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
                        style={{
                          backgroundColor: active ? theme.btnPrimary : theme.card,
                          borderColor: theme.border,
                          boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
                        }}
                      >
                        <Icon
                          icon={active ? 'tabler:circle-check-filled' : 'tabler:circle'}
                          width={18}
                          style={{ color: active ? '#1e293b' : theme.textMuted }}
                        />
                        <span className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-extrabold" style={{ color: active ? '#1e293b' : theme.text }}>
                            {entry.name}
                          </span>
                        </span>
                        <Icon
                          icon="tabler:player-play"
                          width={16}
                          style={{ color: active ? '#1e293b' : theme.textMuted }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: theme.textMuted }}>
          {t.soundSource}
        </p>
      </div>
    </div>
  );
}
