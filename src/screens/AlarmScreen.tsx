import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import {
  AlarmClock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Clock,
  Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import ProgressRing from '../components/ProgressRing';
import Toast from '../components/Toast';
import {
  getAlarmSettings,
  saveAlarmSettings,
  getAttendanceStatusToday,
  confirmAttendanceToday,
  cancelAttendanceToday,
} from '../services/alarm';

export default function AlarmScreen() {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [soundName, setSoundName] = useState('Absen Alert (Kustom)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Hitung sisa waktu hingga 23:59:00 WIB
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 0, 0);

      const start = new Date();
      start.setHours(16, 0, 0, 0);

      const totalMs = end.getTime() - start.getTime();
      const leftMs = end.getTime() - now.getTime();

      if (leftMs <= 0) {
        setTimeLeft('00:00:00');
        setProgress(1);
        return;
      }

      const hours = Math.floor(leftMs / 3600000);
      const mins = Math.floor((leftMs % 3600000) / 60000);
      const secs = Math.floor((leftMs % 60000) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      );

      const computedProgress = Math.max(0, Math.min(1, 1 - leftMs / totalMs));
      setProgress(computedProgress);
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, []);

  const refreshAlarmData = async () => {
    try {
      const status = await getAttendanceStatusToday();
      setIsDone(status?.isConfirmed ?? false);

      const settings = await getAlarmSettings();
      setIntervalMinutes(settings.intervalMinutes);
      setSoundName(
        settings.sound === 'absen_alarm.wav'
          ? 'Absen Alert (Kustom)'
          : settings.sound === 'chime.wav'
          ? 'Melodic Chime'
          : 'Nada Sistem',
      );
    } catch {}
  };

  useEffect(() => {
    refreshAlarmData();
  }, []);

  const handleToggleAttendance = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (isDone) {
      await cancelAttendanceToday();
      setIsDone(false);
      setToastMessage('Penanda kehadiran dibatalkan.');
    } else {
      await confirmAttendanceToday('manual_button');
      setIsDone(true);
      setToastMessage('Presensi tercatat! Seluruh sisa alarm hari ini dimatikan.');
    }
  };

  const handleSnooze = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setToastMessage(`Alarm ditunda selama ${intervalMinutes} menit.`);
  };

  const handleChangeInterval = async (val: number) => {
    setIntervalMinutes(val);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const s = await getAlarmSettings();
      await saveAlarmSettings({ ...s, intervalMinutes: val });
    } catch {}
    setToastMessage(`Interval pengingat diatur ke ${val} menit.`);
  };

  const INTERVALS = [15, 30, 60];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text
        entering={FadeIn.duration(350)}
        style={[typography.title, styles.screenTitle]}
      >
        Alarm Pengingat Absen
      </Animated.Text>

      {/* Interval Selector Chips */}
      <Animated.View entering={SlideInUp.delay(80).duration(300)} style={styles.chipRow}>
        {INTERVALS.map((iv) => (
          <TouchableOpacity
            key={iv}
            onPress={() => handleChangeInterval(iv)}
            style={[
              styles.intervalChip,
              intervalMinutes === iv && styles.intervalChipActive,
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Interval ${iv} menit`}
          >
            <Text
              style={[
                styles.intervalText,
                intervalMinutes === iv && styles.intervalTextActive,
              ]}
            >
              {iv} mnt
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Cincin Utama Hitung Mundur */}
      <Animated.View entering={FadeIn.delay(160).duration(500)} style={styles.ringWrap}>
        {isDone ? (
          <ProgressRing
            size={240}
            progress={1}
            label="✓ Selesai"
            sublabel="Presensi hari ini tercatat"
            strokeWidth={14}
            color={colors.success}
          />
        ) : (
          <ProgressRing
            size={240}
            progress={progress}
            label={timeLeft}
            sublabel="sisa waktu absen"
            strokeWidth={14}
            color={colors.action}
          />
        )}
      </Animated.View>

      {/* Tombol Tunda & Sudah Absen */}
      <Animated.View entering={SlideInUp.delay(240).duration(400)} style={styles.btnRow}>
        {!isDone && (
          <TouchableOpacity
            style={styles.btnNeutral}
            onPress={handleSnooze}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Tunda pengingat alarm"
          >
            <Text style={styles.btnNeutralText}>Tunda</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, isDone && styles.btnSuccess]}
          onPress={handleToggleAttendance}
          accessible
          accessibilityRole="button"
          accessibilityLabel={isDone ? 'Batalkan penanda kehadiran' : 'Konfirmasi sudah absen'}
        >
          {isDone ? (
            <View style={styles.btnInnerRow}>
              <CheckCircle2 color={colors.onAction} size={18} strokeWidth={2} />
              <Text style={styles.btnPrimaryText}>Batalkan Penanda</Text>
            </View>
          ) : (
            <View style={styles.btnInnerRow}>
              <CheckCircle2 color={colors.onAction} size={18} strokeWidth={2} />
              <Text style={styles.btnPrimaryText}>Sudah Absen</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Kartu Informasi Pengingat Berikutnya */}
      <Animated.View entering={FadeInDown.delay(320).duration(400)} style={[styles.infoCard, shadows.e1]}>
        <View style={styles.infoHeader}>
          <Clock color={colors.action} size={18} strokeWidth={2} />
          <Text style={[typography.section, { fontSize: 15, color: colors.ink }]}>
            Jadwal Pengingat
          </Text>
        </View>
        <Text style={[typography.body, { color: colors.ink }]}>
          Mulai pukul 16:00 WIB hingga batas akhir 23:59 WIB.
        </Text>
        <View style={styles.infoDivider} />
        <View style={styles.soundRow}>
          <Volume2 color={colors.inkSoft} size={16} strokeWidth={1.8} />
          <Text style={[typography.bodySmall, { color: colors.inkSoft }]}>
            Nada saat ini: <Text style={{ color: colors.ink, fontWeight: '600' }}>{soundName}</Text>
          </Text>
        </View>
      </Animated.View>

      {/* Toast Alert */}
      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        variant="success"
        onHide={() => setToastMessage(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.paper,
    flexGrow: 1,
  },
  screenTitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  intervalChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  intervalChipActive: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  intervalText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  intervalTextActive: {
    color: colors.onAction,
  },
  ringWrap: {
    marginBottom: 36,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  btnNeutral: {
    flex: 1,
    height: 52,
    backgroundColor: colors.neutralFill,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNeutralText: {
    ...typography.label,
    color: colors.ink,
    fontSize: 15,
  },
  btnPrimary: {
    flex: 1.6,
    height: 52,
    backgroundColor: colors.action,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: colors.success,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    color: colors.onAction,
    fontWeight: '600',
    fontSize: 15,
  },
  infoCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    gap: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.rule,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
