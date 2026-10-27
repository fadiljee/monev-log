import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import IconTile from './IconTile';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function SectionHeader({
  icon,
  title,
  actionLabel,
  onActionPress,
  rightElement,
}: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <IconTile icon={icon} size={32} />
        <Text style={[typography.section, styles.title]}>{title}</Text>
      </View>

      {rightElement ? (
        rightElement
      ) : actionLabel && onActionPress ? (
        <TouchableOpacity
          onPress={onActionPress}
          style={styles.actionPill}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: colors.ink,
  },
  actionPill: {
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
});
