import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface MonevHeaderButtonProps {
  /** Dipanggil saat tombol ditekan. Biasanya memanggil `openMonev()`. */
  onPress: () => void;
}

/**
 * MonevHeaderButton — Tombol ikon + label di sisi kanan header aplikasi.
 *
 * Tampil di SEMUA layar — design.md §7.1, §7.5a, PRD §E.3 #1.
 * Ikon `external-link` + label "Monev" putih, tap target ≥ 44px.
 *
 * Aksesibilitas: role="link", label & hint sesuai PRD §E.5.
 *
 * Contoh pemakaian di header navigation:
 * ```tsx
 * headerRight: () => (
 *   <MonevHeaderButton onPress={handleOpenMonev} />
 * )
 * ```
 */
export default function MonevHeaderButton({ onPress }: MonevHeaderButtonProps) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      activeOpacity={0.7}
      accessible
      accessibilityRole="link"
      accessibilityLabel="Buka portal Monev"
      accessibilityHint="Membuka situs Monev di browser"
    >
      <ExternalLink
        color={colors.onAction}
        size={16}
        strokeWidth={1.75}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[typography.label, styles.label]}>Monev</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Tap target ≥ 44×44px — design.md §7.5a, §11
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  // Teks putih (onAction) di atas header action — design.md §7.1
  label: {
    color: colors.onAction,
  },
});
