import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Check, AlertTriangle, WifiOff, Clock } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type ChipVariant = 'success' | 'warn' | 'error' | 'neutral' | 'offline';

interface StatusChipProps {
  variant: ChipVariant;
  label: string;
  style?: ViewStyle;
}

const CHIP_CONFIG = {
  success: { bg: colors.successTint, text: colors.success, Icon: Check },
  warn: { bg: colors.warnTint, text: colors.warn, Icon: AlertTriangle },
  error: { bg: colors.errorTint, text: colors.error, Icon: AlertTriangle },
  neutral: { bg: colors.actionTint, text: colors.action, Icon: Clock },
  offline: { bg: colors.warnTint, text: colors.warn, Icon: WifiOff },
};

export default function StatusChip({ variant, label, style }: StatusChipProps) {
  const { bg, text, Icon } = CHIP_CONFIG[variant] || CHIP_CONFIG.neutral;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.chip, { backgroundColor: bg }, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Icon color={text} size={12} strokeWidth={2} />
      <Text style={[typography.label, styles.label, { color: text }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
