import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface MonevLinkBarProps {
  /** Dipanggil saat bar ditekan. Biasanya memanggil `openMonev()`. */
  onPress: () => void;
  /** URL yang ditampilkan di baris kedua (tidak perlu mengandung `https://`). */
  displayUrl?: string;
}

/**
 * MonevLinkBar — Bar tautan menuju Portal Monev.
 *
 * Tampil di: Layar Hari Ini, Pengaturan — design.md §7.5b, PRD §E.3 #2,5.
 * Latar `gold-tint`, border 1px `gold`, radius 8px, tinggi min 56px.
 * Pressed: latar `gold` solid, teks tetap `ink`.
 *
 * Aksesibilitas: role="link", label & hint sesuai PRD §E.5.
 */
export default function MonevLinkBar({
  onPress,
  displayUrl = 'maganghub.kemnaker.go.id',
}: MonevLinkBarProps) {
  return (
    <TouchableOpacity
      style={styles.bar}
      onPress={onPress}
      activeOpacity={0.75}
      accessible
      accessibilityRole="link"
      accessibilityLabel="Buka portal Monev"
      accessibilityHint="Membuka situs Monev di browser"
    >
      <View style={styles.textGroup}>
        {/* Judul: ink 16/600 */}
        <Text style={styles.title}>Portal Monev</Text>
        {/* URL: ink-soft mono 12.5 */}
        <Text style={[typography.meta, styles.url]}>{displayUrl}</Text>
      </View>

      {/* Ikon external-link: menandakan keluar dari aplikasi — design.md §7.5 */}
      <ExternalLink
        color={colors.ink}
        size={18}
        strokeWidth={1.75}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Latar gold-tint, border 1px gold, radius 8px, min-height 56px — design.md §7.5b
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textGroup: {
    flex: 1,
    marginRight: 12,
  },
  // "Portal Monev": ink 16/600 — design.md §7.5
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  // URL: ink-soft mono — design.md §7.5
  url: {
    color: colors.inkSoft,
    marginTop: 2,
  },
});
