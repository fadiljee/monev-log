import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  progress: number; // 0..1
  label?: string;
  sublabel?: string;
  strokeWidth?: number;
  color?: string;
}

export default function ProgressRing({
  size = 140,
  progress,
  label,
  sublabel,
  strokeWidth = 10,
  color,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress));
    animatedProgress.value = withTiming(clamped, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - animatedProgress.value),
    };
  });

  const gradientId = `ringGrad_${size}_${strokeWidth}`;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ? `${label} ${sublabel || ''}` : 'Progres'}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color || colors.action} />
            <Stop offset="100%" stopColor={color || colors.actionSoft} />
          </LinearGradient>
        </Defs>
        {/* Track rail */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Label di tengah */}
      {label && (
        <View style={styles.center}>
          <Text
            style={[
              size > 180 ? typography.numeral : typography.title,
              { textAlign: 'center' },
            ]}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={[typography.bodySmall, { textAlign: 'center', marginTop: 2 }]}>
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
