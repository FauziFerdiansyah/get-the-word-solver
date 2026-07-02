import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

const STEPS = [
  {
    title: 'Pilih Panjang Kata',
    desc: 'Pilih jumlah huruf (4, 5, atau 6) sesuai level yang kamu mainkan di game.',
    icon: 'tabler:hash',
  },
  {
    title: 'Isi Clue Huruf',
    desc: 'Ketik huruf yang sudah kamu tahu. Tap bulatan kecil di pojok kotak untuk ubah warna: hijau = posisi benar, kuning = huruf ada tapi salah posisi.',
    icon: 'tabler:forms',
  },
  {
    title: 'Coret Huruf',
    desc: 'Tap huruf di keyboard virtual untuk menandai huruf yang TIDAK ADA di kata target (abu-abu di game). Huruf yang dicoret tidak akan muncul di hasil.',
    icon: 'tabler:keyboard',
  },
  {
    title: 'Cari & Acak Kata',
    desc: 'Tekan "Cari Jawaban" untuk melihat daftar kata cocok. Saat kondisi kosong, gunakan "Acak Kata" untuk mengisi clue dengan kata random.',
    icon: 'tabler:search',
  },
  {
    title: 'Salin Jawaban',
    desc: 'Tap icon copy di samping kata untuk salin satu kata. Atau gunakan "Salin Semua" untuk copy hingga 20 kata sekaligus (format daftar).',
    icon: 'tabler:clipboard-list',
  },
  {
    title: 'Arti Kata',
    desc: 'Aktifkan "Tampilkan Arti Kata" di Pengaturan untuk melihat pengucapan dan definisi di bawah setiap kata hasil pencarian.',
    icon: 'tabler:book',
  },
  {
    title: 'Install di HP',
    desc: 'Di browser HP, tap menu (⋮) lalu pilih "Add to Home Screen" / "Tambah ke Layar Utama". App ini bisa diakses seperti aplikasi native!',
    icon: 'tabler:device-mobile-plus',
  },
  {
    title: 'Pengaturan',
    desc: 'Tap ikon ⚙️ di pojok kanan atas untuk ubah tema (6 pilihan + mode buta warna), dark/light mode, sound effect, dan toggle arti kata.',
    icon: 'tabler:settings',
  },
];

export default function CoachMark({ open, onClose }) {
  const [step, setStep] = useState(0);
  const { theme } = useTheme();

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setStep(0);
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-xs rounded-xl border-2 p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === step ? theme.green : theme.border + '40' }}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold" style={{ color: theme.textMuted }}>
            {step + 1}/{STEPS.length}
          </span>
          <button onClick={handleClose} className="p-1 active:scale-90 transition-transform">
            <Icon icon="tabler:x" width={18} style={{ color: theme.textMuted }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
            style={{ backgroundColor: theme.accent, borderColor: theme.border }}
          >
            <Icon icon={current.icon} width={24} style={{ color: theme.text }} />
          </div>
          <h3 className="text-base font-extrabold" style={{ color: theme.text }}>
            {current.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
            {current.desc}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mt-4">
          {step > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              Kembali
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b' }}
          >
            {isLast ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
