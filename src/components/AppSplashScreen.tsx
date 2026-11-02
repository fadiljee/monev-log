import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlarmClock, ShieldCheck } from 'lucide-react-native';

interface AppSplashScreenProps {
  onFinish?: () => void;
}

export default function AppSplashScreen({ onFinish }: AppSplashScreenProps) {
  const [loadingText, setLoadingText] = useState('Memuat aplikasi...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setLoadingText('Memeriksa jadwal alarm presensi...');
    }, 800);

    const t2 = setTimeout(() => {
      setLoadingText('Menyiapkan sistem pengingat...');
    }, 1600);

    const t3 = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(400)}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F2F5E" />

      <View style={styles.centerBox}>
        {/* Logo / Icon Badge */}
        <View style={styles.iconCircle}>
          <AlarmClock color="#FFFFFF" size={44} strokeWidth={2} />
        </View>

        {/* Title & Tagline */}
        <Text style={styles.appTitle}>MonevApp</Text>
        <Text style={styles.appSubtitle}>Pengingat Absen Sore & Logbook Harian</Text>

        {/* Loading Spinner & Status */}
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <ShieldCheck color="#93C5FD" size={14} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>Alarm Aktif Senin – Jumat • Looping Otomatis</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2F5E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '500',
  },
});
