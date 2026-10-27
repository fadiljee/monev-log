import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Typography tokens v3 — Plus Jakarta Sans & IBM Plex Mono (redesign-v3.md §4)
 */
export const typography = StyleSheet.create({
  // Angka besar hitung mundur / metrik — 40px/48px
  numeral: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '600',
    color: colors.ink,
  },
  // Judul display Welcome / layar besar — 28px/34px
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.ink,
  },
  // Title layar / profil — 20px/26px
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.ink,
  },
  // Seksi konten ("Tugas Hari Ini", dsb.) — 17px/24px
  section: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.ink,
  },
  // Body laporan / input catatan — 15px/22px
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: colors.ink,
  },
  // Deskripsi pembantu / caption — 13px/19px
  bodySmall: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: colors.inkSoft,
  },
  // Label tombol, tab, chip — 13px/18px
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  // Data teknis / URL / hitungan karakter (monospace) — 12px/17px
  meta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.inkSoft,
    fontFamily: 'monospace',
  },
});
