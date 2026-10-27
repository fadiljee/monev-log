import { Appearance } from 'react-native';

// ── Token warna v3 — "Soft Focus" Design System (redesign-v3.md §3) ──
export const lightColors = {
  paper:        '#F4F0FB', // Latar dasar layar (lavender sangat muda)
  paperRaised:  '#FFFFFF', // Kartu, input, bottom nav, sheet
  ink:          '#1E1535', // Teks utama (ungu-hitam)
  inkSoft:      '#5E5675', // Teks sekunder, placeholder, meta
  rule:         '#E4DCF3', // Garis pemisah tipis 1px di dalam kartu
  action:       '#5B3FA0', // Tombol primer, tab aktif, ikon aktif, FAB, cincin progres
  actionPress:  '#4A3285', // State tertekan action
  actionSoft:   '#A98BE0', // Aksen dekoratif, cincin gradient
  actionTint:   '#EDE6FA', // Latar ubin ikon, chip netral, item terpilih, bar Portal Monev
  onAction:     '#FFFFFF', // Teks/ikon di atas action
  neutralFill:  '#E6E1EE', // Tombol sekunder berlatar abu
  track:        '#E3DCF2', // Rel cincin progres, rel bar progres
  success:      '#1E7A4C', // Karakter >= 100, tersalin, tersinkron, sudah absen
  successTint:  '#E1F1E8',
  warn:         '#8A5200', // Karakter < 100, mode offline, mendekati tenggat
  warnTint:     '#F6E9D2',
  error:        '#B3261E', // Gagal sinkron, gagal buka browser, hapus data
  errorTint:    '#F7E1DF',
  focusRing:    '#5B3FA0',
  // Backward compatibility alias:
  gold:         '#5B3FA0',
  goldTint:     '#EDE6FA',
} as const;

export const darkColors = {
  paper:        '#150F26', // Latar layar gelap
  paperRaised:  '#201738', // Kartu, input, bottom nav gelap
  ink:          '#EFEAFB', // Teks utama
  inkSoft:      '#B1A7CC', // Teks sekunder
  rule:         '#35294F', // Garis pemisah
  action:       '#B9A0F0', // Tombol primer, tab aktif
  actionPress:  '#A488E6', // State tertekan
  actionSoft:   '#6E55AE', // Aksen dekoratif
  actionTint:   '#2D2250', // Ubin ikon, chip netral
  onAction:     '#1A1030', // Teks di atas action (gelap)
  neutralFill:  '#35294F', // Tombol sekunder abu
  track:        '#35294F', // Rel cincin & bar
  success:      '#5CC48A',
  successTint:  '#163326',
  warn:         '#E0A040',
  warnTint:     '#3A2C14',
  error:        '#F08A80',
  errorTint:    '#3C1B18',
  focusRing:    '#B9A0F0',
  // Backward compatibility alias:
  gold:         '#B9A0F0',
  goldTint:     '#2D2250',
} as const;

const colorScheme = Appearance.getColorScheme();
export const colors = colorScheme === 'dark' ? darkColors : lightColors;
