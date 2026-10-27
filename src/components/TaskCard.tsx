import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Check, CheckCircle2, AlertTriangle, Calendar, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface TaskCardProps {
  title: string;
  subtitle: string;
  category?: string;
  done: boolean;
  onToggle: () => void;
  isWarning?: boolean;
}

export default function TaskCard({
  title,
  subtitle,
  category = 'Wajib Harian',
  done,
  onToggle,
  isWarning = false,
}: TaskCardProps) {
  const checked = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    checked.value = withSpring(done ? 1 : 0, { damping: 14 });
  }, [done]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onToggle();
  };

  const checkboxAnim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      checked.value,
      [0, 1],
      [colors.paperRaised, colors.action],
    ),
    borderColor: interpolateColor(
      checked.value,
      [0, 1],
      [colors.rule, colors.action],
    ),
    transform: [{ scale: withSpring(done ? 1 : 1, { damping: 10 }) }],
  }));

  const textAnim = useAnimatedStyle(() => ({
    opacity: withTiming(done ? 0.6 : 1, { duration: 200 }),
  }));

  return (
    <View style={[styles.card, done ? styles.cardDone : shadows.e1]}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={handlePress}
        style={styles.checkboxTouch}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`${title}, ${done ? 'selesai' : 'belum selesai'}`}
      >
        <Animated.View style={[styles.checkbox, checkboxAnim]}>
          {done && <Check color={colors.onAction} size={14} strokeWidth={2.5} />}
        </Animated.View>
      </TouchableOpacity>

      {/* Konten teks */}
      <Animated.View style={[styles.content, textAnim]}>
        <Text
          style={[
            typography.body,
            styles.title,
            done && styles.titleDone,
          ]}
        >
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Clock color={colors.inkSoft} size={12} strokeWidth={1.75} />
          <Text style={[typography.meta, styles.metaText]}>{subtitle}</Text>
        </View>
      </Animated.View>

      {/* Status icon kanan */}
      <View style={styles.rightBadge}>
        {done ? (
          <CheckCircle2 color={colors.success} size={18} strokeWidth={1.75} />
        ) : isWarning ? (
          <AlertTriangle color={colors.warn} size={18} strokeWidth={1.75} />
        ) : null}
        <Text style={[typography.bodySmall, styles.categoryText]}>{category}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardDone: {
    borderWidth: 1,
    borderColor: colors.rule,
  },
  checkboxTouch: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontWeight: '500',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.inkSoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  rightBadge: {
    alignItems: 'flex-end',
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
});
