import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { PenLine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

interface FabProps {
  onPress: () => void;
  scrollDirection?: Animated.SharedValue<number>; // -1: down, 1: up
}

export default function Fab({ onPress, scrollDirection }: FabProps) {
  const pressScale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => {
    let scale = pressScale.value;
    if (scrollDirection && scrollDirection.value < 0) {
      scale *= 0.9;
    }
    return {
      transform: [{ scale: withSpring(scale, { damping: 14 }) }],
    };
  });

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onPress();
  };

  return (
    <Animated.View style={[styles.fabWrap, animStyle, shadows.e2]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={() => {
          pressScale.value = 0.92;
        }}
        onPressOut={() => {
          pressScale.value = 1;
        }}
        style={styles.fab}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Buat laporan baru"
        activeOpacity={1}
      >
        <PenLine color={colors.onAction} size={24} strokeWidth={1.8} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
