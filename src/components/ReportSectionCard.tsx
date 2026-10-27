import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import StatusChip from './StatusChip';

const MIN_SECTION_CHARS = 100;

interface ReportSectionCardProps {
  letter: 'U' | 'P' | 'K';
  title: string;
  content: string;
  enteringDelay?: number;
}

export default function ReportSectionCard({
  letter,
  title,
  content,
  enteringDelay = 0,
}: ReportSectionCardProps) {
  const [copied, setCopied] = useState(false);
  const copyScale = useSharedValue(1);
  const charCount = content ? content.length : 0;
  const isOk = charCount >= MIN_SECTION_CHARS;

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setCopied(true);
    copyScale.value = withSpring(0.85, { damping: 10 }, () => {
      copyScale.value = withSpring(1, { damping: 15 });
    });
    setTimeout(() => setCopied(false), 1500);
  };

  const copyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(enteringDelay).duration(200).springify()}
      style={[styles.card, shadows.e1]}
    >
      {/* Header entri */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeLetter}>{letter}</Text>
        </View>
        <Text style={[typography.section, styles.title]}>{title}</Text>
        <Animated.View style={copyAnimStyle}>
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Tersalin' : `Salin ${title}`}
          >
            {copied ? (
              <Check color={colors.success} size={16} strokeWidth={2} />
            ) : (
              <Copy color={colors.action} size={16} strokeWidth={1.75} />
            )}
            <Text
              style={[
                styles.copyText,
                { color: copied ? colors.success : colors.action },
              ]}
            >
              {copied ? 'Tersalin' : 'Salin'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Konten teks laporan */}
      <Text style={[typography.body, styles.content]}>{content}</Text>

      {/* Indikator karakter minimum */}
      <StatusChip
        variant={isOk ? 'success' : 'warn'}
        label={
          isOk
            ? `${charCount} karakter, syarat terpenuhi`
            : `${charCount} karakter, kurang ${MIN_SECTION_CHARS - charCount}`
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLetter: {
    color: colors.onAction,
    fontWeight: '700',
    fontSize: 15,
  },
  title: {
    flex: 1,
    color: colors.ink,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    lineHeight: 22,
    color: colors.ink,
  },
});
