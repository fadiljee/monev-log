import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { colors } from './src/theme/colors';
import {
  initAlarmServiceAsync,
  confirmAttendanceToday,
  ACTION_CONFIRM_ATTENDANCE,
} from './src/services/alarm';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import AlarmScreen from './src/screens/AlarmScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BottomTabBar from './src/components/BottomTabBar';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Beranda, 1: Alarm, 2: Statistik, 3: Profil
  const [activeOverlay, setActiveOverlay] = useState<'create_report' | 'history' | null>(null);

  useEffect(() => {
    // 1. Inisialisasi Service Alarm & Background Task
    initAlarmServiceAsync();

    // 2. Response listener untuk Quick Action Notification "Sudah Absen"
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (response.actionIdentifier === ACTION_CONFIRM_ATTENDANCE) {
          confirmAttendanceToday('notification_action');
        }
      },
    );

    // 3. Cek Onboarding status
    AsyncStorage.getItem('@monev_onboarded').then((val) => {
      setIsOnboarded(val === 'true');
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  // Tunggu pengecekan onboarding awal
  if (isOnboarded === null) {
    return <View style={styles.splash} />;
  }

  // Jika pertama kali buka aplikasi -> Tampilkan Welcome Screen
  if (!isOnboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.action} />
        <WelcomeScreen onDone={() => setIsOnboarded(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
      <View style={styles.container}>
        {/* Konten Tab Aktif */}
        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <HomeScreen
              onOpenCreateReport={() => setActiveOverlay('create_report')}
              onOpenHistory={() => setActiveOverlay('history')}
              onOpenNotifications={() => setActiveTab(1)}
            />
          )}
          {activeTab === 1 && <AlarmScreen />}
          {activeTab === 2 && <StatsScreen />}
          {activeTab === 3 && (
            <ProfileScreen onOpenHistory={() => setActiveOverlay('history')} />
          )}
        </View>

        {/* Bottom Tab Navigation Bar (4 Tab) */}
        {!activeOverlay && (
          <BottomTabBar
            activeIndex={activeTab}
            onTabPress={(idx) => setActiveTab(idx)}
          />
        )}

        {/* OVERLAY SCREEN: Buat Laporan */}
        {activeOverlay === 'create_report' && (
          <View style={StyleSheet.absoluteFill}>
            <CreateReportScreen
              onBack={() => setActiveOverlay(null)}
              onReportCreated={() => {
                // Berhasil dibuat
              }}
            />
          </View>
        )}

        {/* OVERLAY SCREEN: Riwayat Laporan */}
        {activeOverlay === 'history' && (
          <View style={StyleSheet.absoluteFill}>
            <HistoryScreen
              onBack={() => setActiveOverlay(null)}
              onOpenCreateReport={() => setActiveOverlay('create_report')}
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  tabContent: {
    flex: 1,
  },
});
