import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Typography tokens sesuai design.md §4
 * Font: IBM Plex Sans (UI & body) / system mono (data & meta)
 * Menggunakan system font karena IBM Plex belum dipasang sebagai native asset.
 * Ketika font sudah dipasang, tambahkan fontFamily: 'IBMPlexSans' / 'IBMPlexMono'.
 */
export const typography = StyleSheet.create({
  // Display — 26px/1.2, weight 600
  display: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '600',
    color: colors.ink,
  },
  // Title — 19px/1.3, weight 600
  title: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.ink,
  },
  // Body — 16px/1.55, weight 400
  body: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '400',
    color: colors.ink,
  },
  // Body Small — 14px/1.5, weight 400
  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: colors.inkSoft,
  },
  // Meta (monospace) — 12.5px/1.4, weight 500
  // Untuk timestamp, kode status, nomor versi
  meta: {
    fontSize: 12.5,
    lineHeight: 17.5,
    fontWeight: '500',
    color: colors.inkSoft,
    fontFamily: 'monospace',
  },
  // Label — 13px/1.3, weight 600 (tombol, tab)
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.ink,
  },
});
