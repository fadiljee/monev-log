import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { WifiOff, AlertTriangle, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

export type ToastVariant = 'success' | 'warn' | 'error' | 'offline';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onHide?: () => void;
  bottomOffset?: number;
}

const ICONS = {
  success: Check,
  warn: AlertTriangle,
  error: AlertTriangle,
  offline: WifiOff,
};

const ICON_COLORS = {
  success: colors.success,
  warn: colors.warn,
  error: colors.error,
  offline: colors.warn,
};

export default function Toast({
  visible,
  message,
  variant = 'warn',
  onHide,
  bottomOffset = 80,
}: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 250 });

      if (onHide) {
        opacity.value = withDelay(
          3000,
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished) runOnJS(onHide)();
          }),
        );
        translateY.value = withDelay(3000, withTiming(20, { duration: 300 }));
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
    }
  }, [visible]);

  const Icon = ICONS[variant] || AlertTriangle;
  const iconColor = ICON_COLORS[variant] || colors.warn;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { bottom: bottomOffset },
        shadows.e2,
        animStyle,
      ]}
      pointerEvents="none"
      accessible
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Icon color={iconColor} size={18} strokeWidth={2} />
      <Text style={[typography.bodySmall, styles.msg]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 999,
  },
  msg: {
    flex: 1,
    color: colors.ink,
    fontWeight: '500',
  },
});
