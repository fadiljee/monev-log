import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Home, AlarmClock, BarChart3, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

export const TAB_ITEMS = [
  { name: 'Beranda', Icon: Home, label: 'Beranda' },
  { name: 'Alarm', Icon: AlarmClock, label: 'Alarm Absen' },
  { name: 'Statistik', Icon: BarChart3, label: 'Statistik' },
  { name: 'Profil', Icon: User, label: 'Profil' },
] as const;

interface BottomTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
}

function TabButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const dotAnim = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    dotAnim.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotAnim.value,
    transform: [{ scale: dotAnim.value }],
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    scale.value = withSpring(0.85, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    onPress();
  };

  const iconColor = active ? colors.action : colors.inkSoft;

  return (
    <Animated.View style={[styles.tabItemWrap, btnAnimStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.tabButton}
        accessible
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        activeOpacity={1}
      >
        <Icon color={iconColor} size={22} strokeWidth={1.8} />
        <Animated.View style={[styles.activeDot, dotStyle]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BottomTabBar({ activeIndex, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        shadows.e2,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {TAB_ITEMS.map((item, idx) => (
        <TabButton
          key={item.name}
          icon={item.Icon}
          label={item.label}
          active={activeIndex === idx}
          onPress={() => onTabPress(idx)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  tabItemWrap: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    gap: 4,
    paddingVertical: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.action,
  },
});
