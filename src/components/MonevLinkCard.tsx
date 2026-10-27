import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface MonevLinkCardProps {
  onPress: () => void;
  displayUrl?: string;
}

export default function MonevLinkCard({
  onPress,
  displayUrl = 'monev.maganghub.kemnaker.go.id',
}: MonevLinkCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={styles.card}
        accessible
        accessibilityRole="link"
        accessibilityLabel="Buka portal Monev"
        accessibilityHint="Membuka situs portal Monev di browser bawaan"
        activeOpacity={1}
      >
        <View style={styles.iconWrap}>
          <ExternalLink color={colors.action} size={18} strokeWidth={1.75} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Portal Monev</Text>
          <Text style={[typography.meta, styles.urlText]} numberOfLines={1}>
            {displayUrl}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Buka</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.actionTint,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    backgroundColor: colors.paperRaised,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.section,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  urlText: {
    marginTop: 2,
    color: colors.inkSoft,
  },
  badge: {
    backgroundColor: colors.action,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.onAction,
    fontSize: 12,
    fontWeight: '600',
  },
});
