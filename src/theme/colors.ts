import { Appearance } from 'react-native';

// ── Token warna v2 — design.md §3.5 (tema Kemnaker: biru institusional + kuning emas) ──
// Catatan: hex di sini adalah pendekatan dari warna lambang Kemnaker.
// Sebelum rilis, verifikasi dengan eyedropper dari header portal dan lambang resmi,
// lalu sesuaikan `action` dan `gold`. Cukup ubah di file ini; seluruh komponen memakai token.

export const lightColors = {
  paper:        '#F3F5F9', // Latar layar — putih kebiruan dingin
  paperRaised:  '#FFFFFF', // Permukaan input dan hasil di atas paper
  ink:          '#0F1B2D', // Teks utama (biru-hitam)
  inkSoft:      '#4A5A70', // Teks sekunder, caption, placeholder
  rule:         '#D3DAE6', // Garis pembatas 1px, pengganti drop-shadow
  action:       '#14407F', // Biru Kemnaker — header, tombol primer, tab aktif
  actionPress:  '#0D2F5F', // State ditekan untuk action
  actionTint:   '#E2EAF6', // Latar solid elemen terpilih / info netral
  gold:         '#F2A900', // Kuning emas Kemnaker — garis identitas, border bar Monev
  goldTint:     '#FCF0CC', // Latar bar Portal Monev
  success:      '#1E7A4C', // Status berhasil
  successTint:  '#E1F1E8', // Latar chip sukses
  warn:         '#9A5B00', // Status menunggu / belum memenuhi syarat
  warnTint:     '#F6E9D2', // Latar chip peringatan
  error:        '#B3261E', // Status gagal
  errorTint:    '#F7E1DF', // Latar chip error
  onAction:     '#FFFFFF', // Teks/ikon di atas tombol action (mode terang)
  focusRing:    '#14407F', // Outline fokus
} as const;

export const darkColors = {
  // Bukan inversi — latar biru-malam, aksen dicerahkan untuk mempertahankan kontras
  paper:        '#0C1522',
  paperRaised:  '#142033',
  ink:          '#E8EDF5',
  inkSoft:      '#9AA9BD',
  rule:         '#243449',
  action:       '#7FAEF0',
  actionPress:  '#5E93DE',
  actionTint:   '#1B2D47',
  gold:         '#F5B82E',
  goldTint:     '#3A3016',
  success:      '#5CC48A',
  successTint:  '#163326',
  warn:         '#E0A040',
  warnTint:     '#3A2C14',
  error:        '#F08A80',
  errorTint:    '#3C1B18',
  onAction:     '#0C1522', // Teks di atas tombol action di mode gelap memakai paper
  focusRing:    '#7FAEF0',
} as const;

const colorScheme = Appearance.getColorScheme();

// Export tunggal yang dipakai di seluruh komponen
export const colors = colorScheme === 'dark' ? darkColors : lightColors;
