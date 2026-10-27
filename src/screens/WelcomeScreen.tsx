import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Sparkles, FileText, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const { height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onDone: () => void;
}

export default function WelcomeScreen({ onDone }: WelcomeScreenProps) {
  const handleStart = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem('@monev_onboarded', 'true');
    } catch {}
    onDone();
  };

  return (
    <View style={styles.root}>
      {/* Area atas: gradient ungu dinas v3 */}
      <LinearGradient
        colors={[colors.action, colors.actionSoft]}
        style={styles.gradientTop}
      >
        <Animated.View
          entering={FadeInDown.delay(150).duration(600)}
          style={styles.illustrationWrap}
        >
          <View style={styles.badgeLarge}>
            <FileText color={colors.action} size={48} strokeWidth={1.5} />
            <View style={styles.badgeMiniCheck}>
              <CheckCircle2 color={colors.success} size={24} />
            </View>
            <View style={styles.badgeMiniSparkle}>
              <Sparkles color={colors.action} size={20} />
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Badan bawah melengkung 32px */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        style={styles.card}
      >
        <Animated.Text
          entering={FadeInDown.delay(450).duration(400)}
          style={styles.display}
        >
          Susun <Text style={{ color: colors.action }}>Laporanmu</Text>
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(550).duration(400)}
          style={[typography.body, styles.desc]}
        >
          Ketik poin kegiatan, biarkan MonevApp menyusun Uraian, Pembelajaran, dan
          Kendala. Tersalin rapi dan siap ditempel ke portal Monev Kemnaker.
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(650).duration(400)}
          style={styles.btnWrap}
        >
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleStart}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Mulai menggunakan aplikasi"
            activeOpacity={0.88}
          >
            <Text style={styles.btnText}>Mulai Sekarang</Text>
            <ArrowRight color={colors.onAction} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.action,
    justifyContent: 'flex-end',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLarge: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  badgeMiniCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.paperRaised,
    borderRadius: 14,
    padding: 2,
  },
  badgeMiniSparkle: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: colors.actionTint,
    borderRadius: 14,
    padding: 4,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
  },
  display: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 14,
    color: colors.ink,
  },
  desc: {
    color: colors.inkSoft,
    marginBottom: 32,
    lineHeight: 24,
  },
  btnWrap: {
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: colors.action,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: colors.onAction,
    fontSize: 16,
    fontWeight: '600',
  },
});
