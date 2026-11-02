import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import {
  AlarmClock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Clock,
  Bell,
  Settings,
  X,
  Check,
  RotateCcw,
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
  isWorkday,
  testTriggerAlarmAsync,
  AVAILABLE_SOUNDS,
} from '../services/alarm';
import { AlarmSoundOption } from '../types';

export default function AlarmScreen() {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [startHour, setStartHour] = useState(16);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(24);
  const [volume, setVolume] = useState(100);
  const [soundId, setSoundId] = useState<AlarmSoundOption>('danger_alarm.mp3');
  const [soundName, setSoundName] = useState('Danger Alarm (Utama)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
  const isTodayWorkday = isWorkday(new Date());

  useEffect(() => {
    // Hitung sisa waktu mundur hingga batas akhir endHour WIB
    const tick = () => {
      const now = new Date();
      const end = new Date();
      if (endHour >= 24) {
        end.setHours(23, 59, 59, 999);
      } else {
        end.setHours(endHour, 0, 0, 0);
      }

      const start = new Date();
      start.setHours(startHour, startMinute, 0, 0);

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
  }, [startHour, startMinute, endHour]);

  const refreshAlarmData = async () => {
    try {
      const status = await getAttendanceStatusToday();
      setIsDone(status?.isConfirmed ?? false);

      const settings = await getAlarmSettings();
      setIntervalMinutes(settings.intervalMinutes ?? 30);
      setStartHour(settings.startHour ?? 16);
      setStartMinute(settings.startMinute ?? 0);
      setEndHour(settings.endHour ?? 24);
      setVolume(settings.volume ?? 100);
      setSoundId(settings.sound ?? 'danger_alarm.mp3');

      const s = settings.sound || 'danger_alarm.mp3';
      setSoundName(
        s.toLowerCase().includes('danger')
          ? 'Danger Alarm (Utama)'
          : s === 'absen_alarm.wav'
          ? 'Absen Alert (Kustom)'
          : s === 'chime.wav'
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
      setToastMessage('Penanda kehadiran dibatalkan. Alarm diaktifkan kembali.');
    } else {
      await confirmAttendanceToday('manual_button');
      setIsDone(true);
      setToastMessage('Presensi tercatat! Seluruh sisa alarm looping hari ini dimatikan.');
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
    setToastMessage(`Interval looping diatur ke ${val} menit.`);
  };

  const handleChangeVolume = async (val: number) => {
    setVolume(val);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const s = await getAlarmSettings();
      await saveAlarmSettings({ ...s, volume: val });
    } catch {}
    setToastMessage(`Volume alarm diatur ke ${val}%.`);
  };

  const handleSaveModalSettings = async () => {
    try {
      const s = await getAlarmSettings();
      await saveAlarmSettings({
        ...s,
        startHour,
        startMinute,
        endHour,
        intervalMinutes,
        volume,
        sound: soundId,
      });
      setIsSettingModalVisible(false);
      await refreshAlarmData();
      const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      setToastMessage(`Waktu alarm diperbarui: ${timeStr} WIB • Looping tiap ${intervalMinutes}m`);
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat memperbarui pengaturan waktu alarm.');
    }
  };

  const handleTestAlarm = async () => {
    try {
      setToastMessage('Memutar uji coba Danger Alarm...');
      await testTriggerAlarmAsync(2);
    } catch (e: any) {
      Alert.alert('Uji Alarm', e.message || 'Gagal memicu alarm.');
    }
  };

  const INTERVALS = [10, 15, 30, 60];
  const VOLUMES = [25, 50, 75, 100];
  const START_HOURS = [15, 16, 17, 18, 19];
  const START_MINUTES = [0, 15, 30, 45];

  const formattedStartTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
  const formattedEndTime = endHour >= 24 ? '23:59' : `${String(endHour).padStart(2, '0')}:00`;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Animated.Text
          entering={FadeIn.duration(350)}
          style={[typography.title, styles.screenTitle]}
        >
          Alarm Pengingat Absen
        </Animated.Text>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => setIsSettingModalVisible(true)}
          accessible
          accessibilityLabel="Atur waktu dan nada alarm"
        >
          <Settings color={colors.action} size={22} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Interval Selector Chips */}
      <View style={styles.sectionTitleRow}>
        <Text style={[typography.meta, { color: colors.inkSoft }]}>
          INTERVAL LOOPING PENGINGAT
        </Text>
      </View>
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

      {/* Volume Selector Chips */}
      <View style={styles.sectionTitleRow}>
        <Text style={[typography.meta, { color: colors.inkSoft }]}>
          VOLUME ALARM ({volume}%)
        </Text>
      </View>
      <Animated.View entering={SlideInUp.delay(120).duration(300)} style={styles.chipRow}>
        {VOLUMES.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => handleChangeVolume(v)}
            style={[
              styles.intervalChip,
              volume === v && styles.intervalChipActive,
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Volume ${v} persen`}
          >
            <Text
              style={[
                styles.intervalText,
                volume === v && styles.intervalTextActive,
              ]}
            >
              {v}%
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
        ) : !isTodayWorkday ? (
          <ProgressRing
            size={240}
            progress={0}
            label="Libur"
            sublabel="Alarm aktif Senin – Jumat"
            strokeWidth={14}
            color={colors.inkSoft}
          />
        ) : (
          <ProgressRing
            size={240}
            progress={progress}
            label={timeLeft}
            sublabel={`menuju ${formattedEndTime} WIB`}
            strokeWidth={14}
            color={colors.action}
          />
        )}
      </Animated.View>

      {/* Looping Info Banner */}
      {!isDone && isTodayWorkday && (
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.loopingBanner}>
          <AlertTriangle color="#B91C1C" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.loopingBannerText}>
            Mode Looping: Alarm akan terus mengulang tiap {intervalMinutes} menit sampai Anda klik "Sudah Absen".
          </Text>
        </Animated.View>
      )}

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
              <RotateCcw color={colors.onAction} size={18} strokeWidth={2} />
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

      {/* Kartu Informasi Pengingat */}
      <Animated.View entering={FadeInDown.delay(320).duration(400)} style={[styles.infoCard, shadows.e1]}>
        <View style={styles.infoHeader}>
          <Clock color={colors.action} size={18} strokeWidth={2} />
          <Text style={[typography.section, { fontSize: 15, color: colors.ink, flex: 1 }]}>
            Jadwal Pengingat
          </Text>
          <TouchableOpacity
            onPress={() => setIsSettingModalVisible(true)}
            style={styles.editTimeBtn}
          >
            <Text style={styles.editTimeText}>Ubah Waktu</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.body, { color: colors.ink }]}>
          Senin – Jumat, pukul {formattedStartTime} WIB hingga batas akhir {formattedEndTime} WIB.
        </Text>

        {!isTodayWorkday && (
          <Text style={[typography.bodySmall, { color: colors.inkSoft, fontStyle: 'italic' }]}>
            Hari ini akhir pekan (Sabtu/Minggu). Alarm libur dan otomatis aktif kembali pada hari Senin pukul {formattedStartTime} WIB.
          </Text>
        )}

        <View style={styles.infoDivider} />

        <View style={styles.soundRow}>
          <Volume2 color={colors.action} size={16} strokeWidth={1.8} />
          <Text style={[typography.bodySmall, { color: colors.inkSoft, flex: 1 }]}>
            Suara: <Text style={{ color: colors.ink, fontWeight: '600' }}>{soundName}</Text> (Vol: {volume}%)
          </Text>
          <TouchableOpacity onPress={handleTestAlarm} style={styles.testSmallBtn}>
            <Text style={styles.testSmallBtnText}>Uji Bunyi</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* MODAL PENGATURAN WAKTU & NADA ALARM */}
      <Modal
        visible={isSettingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSettingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.section}>Atur Waktu & Nada Alarm</Text>
                <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                  Pilih jam mulai dan konfigurasi looping
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettingModalVisible(false)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Jam Mulai */}
              <Text style={[typography.label, styles.subheading]}>
                ⏰ Jam Mulai Alarm:
              </Text>
              <View style={styles.modalChipRow}>
                {START_HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.modalIntervalPill,
                      startHour === h && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setStartHour(h)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        startHour === h && styles.modalIntervalTextActive,
                      ]}
                    >
                      {String(h).padStart(2, '0')}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Menit Mulai */}
              <Text style={[typography.label, styles.subheading]}>
                Menit Mulai:
              </Text>
              <View style={styles.modalChipRow}>
                {START_MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modalIntervalPill,
                      startMinute === m && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setStartMinute(m)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        startMinute === m && styles.modalIntervalTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Interval Looping */}
              <Text style={[typography.label, styles.subheading]}>
                🔁 Interval Pengingat Looping (Menit):
              </Text>
              <View style={styles.modalChipRow}>
                {INTERVALS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modalIntervalPill,
                      intervalMinutes === m && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setIntervalMinutes(m)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        intervalMinutes === m && styles.modalIntervalTextActive,
                      ]}
                    >
                      {m} mnt
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Volume Alarm */}
              <Text style={[typography.label, styles.subheading]}>
                🔊 Volume Alarm:
              </Text>
              <View style={styles.modalChipRow}>
                {VOLUMES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.modalIntervalPill,
                      volume === v && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setVolume(v)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        volume === v && styles.modalIntervalTextActive,
                      ]}
                    >
                      {v}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pilihan Nada Suara */}
              <Text style={[typography.label, styles.subheading]}>
                🎵 Pilihan Nada Alarm:
              </Text>
              {AVAILABLE_SOUNDS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.soundSelectRow,
                    soundId === s.id && styles.soundSelectRowActive,
                  ]}
                  onPress={() => setSoundId(s.id)}
                >
                  <Volume2
                    color={soundId === s.id ? colors.action : colors.inkSoft}
                    size={16}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { fontSize: 14, color: colors.ink }]}>
                      {s.label}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.inkSoft, fontSize: 12 }]}>
                      {s.description}
                    </Text>
                  </View>
                  {soundId === s.id && (
                    <Check color={colors.action} size={18} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.testAlarmModalBtn} onPress={handleTestAlarm}>
                <Bell color={colors.action} size={16} />
                <Text style={styles.testAlarmModalText}>Uji Coba Alarm (Danger Sound)</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { marginTop: 14 }]}
              onPress={handleSaveModalSettings}
            >
              <Text style={styles.modalBtnPrimaryText}>Simpan Pengaturan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  screenTitle: {
    textAlign: 'center',
    color: colors.ink,
  },
  settingsIconBtn: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  sectionTitleRow: {
    width: '100%',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    width: '100%',
    justifyContent: 'flex-start',
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
  },
  intervalChipActive: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  intervalText: {
    ...typography.label,
    color: colors.inkSoft,
    fontSize: 13,
  },
  intervalTextActive: {
    color: colors.onAction,
  },
  ringWrap: {
    marginVertical: 18,
  },
  loopingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    width: '100%',
  },
  loopingBannerText: {
    ...typography.meta,
    color: '#991B1B',
    flex: 1,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
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
  editTimeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(20, 64, 127, 0.08)',
    borderRadius: 8,
  },
  editTimeText: {
    ...typography.meta,
    color: colors.action,
    fontWeight: '600',
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
  testSmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(20, 64, 127, 0.1)',
    borderRadius: 6,
  },
  testSmallBtnText: {
    ...typography.meta,
    color: colors.action,
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  subheading: {
    marginTop: 12,
    marginBottom: 6,
    color: colors.ink,
    fontSize: 13,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  modalIntervalPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.paper,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  modalIntervalPillActive: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  modalIntervalText: {
    ...typography.meta,
    color: colors.inkSoft,
    fontWeight: '500',
  },
  modalIntervalTextActive: {
    color: colors.onAction,
    fontWeight: '600',
  },
  soundSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.paper,
  },
  soundSelectRowActive: {
    borderColor: colors.action,
    backgroundColor: 'rgba(20, 64, 127, 0.05)',
  },
  testAlarmModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 64, 127, 0.08)',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(20, 64, 127, 0.2)',
  },
  testAlarmModalText: {
    ...typography.label,
    color: colors.action,
    fontSize: 13,
  },
  modalBtnPrimary: {
    paddingVertical: 13,
    backgroundColor: colors.action,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    ...typography.label,
    color: colors.onAction,
    fontWeight: '600',
  },
});
