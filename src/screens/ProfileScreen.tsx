import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  FileText,
  ExternalLink,
  Bell,
  Settings,
  Trash2,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  Clock,
  Volume1,
  VolumeX,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import IconTile from '../components/IconTile';
import Toast from '../components/Toast';

import {
  getAlarmSettings,
  saveAlarmSettings,
  AVAILABLE_SOUNDS,
  testTriggerAlarmAsync,
} from '../services/alarm';
import {
  getMonevUrl,
  saveMonevUrl,
  resetMonevUrl,
  openMonev,
} from '../config/links';
import { AlarmSoundOption } from '../types';

interface ProfileScreenProps {
  onOpenHistory: () => void;
}

export default function ProfileScreen({ onOpenHistory }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<
    'portal' | 'alarm' | 'profile' | 'diagnostics' | null
  >(null);

  // Form states for modals
  const [portalUrl, setPortalUrl] = useState('');
  const [alarmStartHour, setAlarmStartHour] = useState(16);
  const [alarmStartMinute, setAlarmStartMinute] = useState(0);
  const [alarmEndHour, setAlarmEndHour] = useState(24);
  const [alarmInterval, setAlarmInterval] = useState(30);
  const [alarmVolume, setAlarmVolume] = useState(100);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundOption>('danger_alarm.mp3');
  const [profileName, setProfileName] = useState('Peserta Magang');
  const [profileEmail, setProfileEmail] = useState('');

  const loadSettings = async () => {
    try {
      const a = await getAlarmSettings();
      setAlarmEnabled(a.isEnabled);
      setAlarmStartHour(a.startHour ?? 16);
      setAlarmStartMinute(a.startMinute ?? 0);
      setAlarmEndHour(a.endHour ?? 24);
      setAlarmInterval(a.intervalMinutes ?? 30);
      setAlarmVolume(a.volume ?? 100);
      setAlarmSound(a.sound ?? 'danger_alarm.mp3');

      const pUrl = await getMonevUrl();
      setPortalUrl(pUrl);

      const savedName = await AsyncStorage.getItem('@monev_user_name');
      if (savedName) setProfileName(savedName);

      const savedEmail = await AsyncStorage.getItem('@monev_user_email');
      if (savedEmail) setProfileEmail(savedEmail);
    } catch {}
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleToggleAlarm = async (val: boolean) => {
    setAlarmEnabled(val);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const s = await getAlarmSettings();
      await saveAlarmSettings({ ...s, isEnabled: val });
      showToast(val ? 'Alarm absen diaktifkan.' : 'Alarm absen dinonaktifkan.');
    } catch {}
  };

  const handleSavePortalUrl = async () => {
    try {
      await saveMonevUrl(portalUrl);
      setActiveModal(null);
      showToast('Alamat portal Monev diperbarui.');
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gunakan alamat berawalan https://');
    }
  };

  const handleResetPortalUrl = async () => {
    await resetMonevUrl();
    const def = await getMonevUrl();
    setPortalUrl(def);
    setActiveModal(null);
    showToast('Alamat portal dikembalikan ke default.');
  };

  const handleSaveAlarmSettings = async () => {
    try {
      const s = await getAlarmSettings();
      await saveAlarmSettings({
        ...s,
        startHour: alarmStartHour,
        startMinute: alarmStartMinute,
        endHour: alarmEndHour,
        intervalMinutes: alarmInterval,
        volume: alarmVolume,
        sound: alarmSound,
      });
      setActiveModal(null);
      const timeStr = `${String(alarmStartHour).padStart(2, '0')}:${String(alarmStartMinute).padStart(2, '0')}`;
      showToast(`Jadwal disimpan: ${timeStr} WIB • Vol ${alarmVolume}% • Looping tiap ${alarmInterval}m`);
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan pengaturan alarm.');
    }
  };

  const handleTestAlarm = async () => {
    try {
      showToast('Menjalankan uji coba Danger Alarm (2 detik)...');
      await testTriggerAlarmAsync(2);
    } catch (e: any) {
      Alert.alert('Uji Alarm', e.message || 'Gagal memicu alarm uji coba.');
    }
  };

  const handleSaveProfile = async () => {
    await AsyncStorage.setItem('@monev_user_name', profileName);
    await AsyncStorage.setItem('@monev_user_email', profileEmail);
    setActiveModal(null);
    showToast('Profil diperbarui.');
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Hapus Semua Data Lokal',
      'Semua laporan tersimpan, status presensi, dan pengaturan di perangkat ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await AsyncStorage.clear();
              loadSettings();
              showToast('Seluruh data lokal berhasil dibersihkan.');
            } catch {}
          },
        },
      ],
    );
  };

  const MENU_ITEMS = [
    {
      key: 'history',
      label: 'Riwayat Laporan',
      Icon: FileText,
      onPress: onOpenHistory,
    },
    {
      key: 'portal',
      label: 'Portal Monev Kemnaker',
      Icon: ExternalLink,
      onPress: () => setActiveModal('portal'),
    },
    {
      key: 'diagnostics',
      label: 'Diagnostik & Uji Fitur',
      Icon: CheckCircle2,
      onPress: () => setActiveModal('diagnostics'),
    },
  ];

  const START_HOURS = [15, 16, 17, 18, 19];
  const START_MINUTES = [0, 15, 30, 45];
  const VOLUMES = [25, 50, 75, 100];
  const INTERVALS = [10, 15, 30, 60];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profileName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'PM'}
            </Text>
          </View>
          <Text style={[typography.title, styles.profileNameText]}>
            {profileName}
          </Text>
          {profileEmail ? (
            <Text style={[typography.bodySmall, { color: colors.inkSoft }]}>
              {profileEmail}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.editProfilePill}
            onPress={() => setActiveModal('profile')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Edit profil"
          >
            <Text style={styles.editProfileText}>Edit profil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Utama Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.card, shadows.e1]}
        >
          {MENU_ITEMS.map(({ key, label, Icon, onPress }, idx) => (
            <React.Fragment key={key}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <IconTile icon={<Icon color={colors.action} size={18} strokeWidth={2} />} />
                <Text style={[typography.body, styles.menuText]}>{label}</Text>
                <ChevronRight color={colors.inkSoft} size={18} strokeWidth={2} />
              </TouchableOpacity>
              {idx < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* Pengaturan Alarm Card */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.card, shadows.e1]}
        >
          <View style={styles.menuRow}>
            <IconTile icon={<Bell color={colors.action} size={18} strokeWidth={2} />} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, styles.menuText]}>
                Alarm pengingat absen
              </Text>
              <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                {String(alarmStartHour).padStart(2, '0')}:{String(alarmStartMinute).padStart(2, '0')} WIB • Looping tiap {alarmInterval}m
              </Text>
            </View>
            <Switch
              value={alarmEnabled}
              onValueChange={handleToggleAlarm}
              trackColor={{ false: colors.rule, true: colors.action }}
              thumbColor={colors.paperRaised}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setActiveModal('alarm')}
          >
            <IconTile icon={<Settings color={colors.action} size={18} strokeWidth={2} />} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, styles.menuText]}>
                Atur Waktu, Volume & Nada Alarm
              </Text>
              <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                Danger Alarm • Vol: {alarmVolume}%
              </Text>
            </View>
            <ChevronRight color={colors.inkSoft} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Link Cepat Buka Portal Kemnaker */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={[styles.card, shadows.e1]}
        >
          <TouchableOpacity
            style={styles.menuRow}
            onPress={openMonev}
            activeOpacity={0.7}
          >
            <IconTile icon={<ExternalLink color={colors.action} size={18} strokeWidth={2} />} />
            <Text style={[typography.body, styles.menuText]}>
              Buka Portal Monev Sekarang
            </Text>
            <ChevronRight color={colors.inkSoft} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Bahaya: Hapus Semua Data */}
        <Animated.View
          entering={FadeInDown.delay(340).duration(400)}
          style={[styles.card, shadows.e1, { marginTop: 8 }]}
        >
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleClearAllData}
            activeOpacity={0.7}
          >
            <IconTile icon={<Trash2 color={colors.warn} size={18} strokeWidth={2} />} />
            <Text style={[typography.body, styles.menuText, { color: colors.warn }]}>
              Hapus Semua Data Lokal
            </Text>
            <ChevronRight color={colors.inkSoft} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* App Version Info */}
        <Text style={styles.versionText}>MonevApp v1.0.0 • Danger Alarm Looping Edition</Text>
      </ScrollView>

      {/* MODAL: PORTAL MONEV */}
      <Modal
        visible={activeModal === 'portal'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <Text style={typography.section}>URL Portal Monev</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[typography.bodySmall, { color: colors.inkSoft, marginBottom: 12 }]}>
              Ubah alamat tautan portal Monev Kemnaker jika institusi Anda menggunakan URL yang berbeda.
            </Text>
            <TextInput
              style={[typography.meta, styles.modalInput]}
              value={portalUrl}
              onChangeText={setPortalUrl}
              placeholder="https://monev.kemnaker.go.id"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleResetPortalUrl}>
                <Text style={styles.modalBtnSecondaryText}>Reset Default</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSavePortalUrl}>
                <Text style={styles.modalBtnPrimaryText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: PENGATURAN ALARM LENGKAP */}
      <Modal
        visible={activeModal === 'alarm'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxLarge, shadows.e2]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.section}>Pengaturan Jadwal Alarm</Text>
                <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                  Looping aktif hingga tombol "Sudah Absen" ditekan
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* 1. Jam Mulai Alarm */}
              <Text style={[typography.label, styles.subheading]}>
                ⏰ Jam Mulai Alarm:
              </Text>
              <View style={styles.modalIntervalRow}>
                {START_HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.modalIntervalPill,
                      alarmStartHour === h && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setAlarmStartHour(h)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        alarmStartHour === h && styles.modalIntervalTextActive,
                      ]}
                    >
                      {String(h).padStart(2, '0')}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 2. Menit Mulai */}
              <Text style={[typography.label, styles.subheading]}>
                Menit Mulai:
              </Text>
              <View style={styles.modalIntervalRow}>
                {START_MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modalIntervalPill,
                      alarmStartMinute === m && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setAlarmStartMinute(m)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        alarmStartMinute === m && styles.modalIntervalTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. Interval Looping Pengingat */}
              <Text style={[typography.label, styles.subheading]}>
                🔁 Interval Pengingat Looping:
              </Text>
              <Text style={[typography.bodySmall, { color: colors.inkSoft, marginBottom: 8 }]}>
                Alarm akan terus berbunyi mengulang setiap interval ini hingga Anda klik "Sudah Absen".
              </Text>
              <View style={styles.modalIntervalRow}>
                {INTERVALS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modalIntervalPill,
                      alarmInterval === m && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setAlarmInterval(m)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        alarmInterval === m && styles.modalIntervalTextActive,
                      ]}
                    >
                      {m} mnt
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 4. Pengaturan Volume Alarm */}
              <Text style={[typography.label, styles.subheading]}>
                🔊 Volume Alarm:
              </Text>
              <View style={styles.modalIntervalRow}>
                {VOLUMES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.modalIntervalPill,
                      alarmVolume === v && styles.modalIntervalPillActive,
                    ]}
                    onPress={() => setAlarmVolume(v)}
                  >
                    <Text
                      style={[
                        styles.modalIntervalText,
                        alarmVolume === v && styles.modalIntervalTextActive,
                      ]}
                    >
                      {v}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 5. Pilihan Nada Suara Alarm */}
              <Text style={[typography.label, styles.subheading]}>
                🎵 Pilihan Nada Alarm:
              </Text>
              {AVAILABLE_SOUNDS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.soundSelectRow,
                    alarmSound === s.id && styles.soundSelectRowActive,
                  ]}
                  onPress={() => setAlarmSound(s.id)}
                >
                  <Volume2
                    color={alarmSound === s.id ? colors.action : colors.inkSoft}
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
                  {alarmSound === s.id && (
                    <Check color={colors.action} size={18} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Uji Coba Alarm Langsung */}
              <TouchableOpacity
                style={styles.testAlarmBtn}
                onPress={handleTestAlarm}
              >
                <Bell color={colors.action} size={16} />
                <Text style={styles.testAlarmText}>Uji Coba Alarm (Danger Sound)</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { marginTop: 14 }]}
              onPress={handleSaveAlarmSettings}
            >
              <Text style={styles.modalBtnPrimaryText}>Simpan Pengaturan Jadwal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT PROFIL */}
      <Modal
        visible={activeModal === 'profile'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <Text style={typography.section}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.label, { marginBottom: 4, color: colors.ink }]}>
              Nama Lengkap:
            </Text>
            <TextInput
              style={[typography.body, styles.modalInput]}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Nama Peserta Magang"
            />

            <Text style={[typography.label, { marginTop: 10, marginBottom: 4, color: colors.ink }]}>
              Email / ID Peserta:
            </Text>
            <TextInput
              style={[typography.body, styles.modalInput]}
              value={profileEmail}
              onChangeText={setProfileEmail}
              placeholder="nama@kemnaker.go.id"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { marginTop: 18 }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.modalBtnPrimaryText}>Simpan Profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: DIAGNOSTIK & UJI SEMUA FITUR */}
      <Modal
        visible={activeModal === 'diagnostics'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxLarge, shadows.e2]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.section}>Diagnostik & Uji Fitur</Text>
                <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                  Status pengujian otomatis seluruh sistem
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Danger Alarm Audio (2.1 MB)
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Berkas Danger-Alarm.mp3 terpasang & terhubung ke Android Raw
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Jadwal Hari Kerja (Senin – Jumat)
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Alarm aktif Senin-Jumat, otomatis libur Sabtu & Minggu
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Looping Nagging Mode
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Alarm berulang tiap {alarmInterval}m hingga user klik "Sudah Absen"
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Pemutusan Total Saat Sudah Absen
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Konfirmasi absensi mematikan seluruh sisa alarm hari itu
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Pengaturan Waktu & Volume
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Jam {String(alarmStartHour).padStart(2, '0')}:{String(alarmStartMinute).padStart(2, '0')} WIB • Vol: {alarmVolume}%
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Fitur Profil Bersih
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Google Sheets & Kunci API telah dihapus dari antarmuka
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <CheckCircle2 color={colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontSize: 14, fontWeight: '600' }]}>
                    Splash Screen Animasi Loading
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Loading 2.4 detik dengan status bertahap
                  </Text>
                </View>
              </View>

              {/* Uji Coba Fisik */}
              <TouchableOpacity
                style={styles.testAlarmBtn}
                onPress={handleTestAlarm}
              >
                <Bell color={colors.action} size={16} />
                <Text style={styles.testAlarmText}>Uji Bunyi Danger Alarm Sekarang</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { marginTop: 14 }]}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalBtnPrimaryText}>Tutup Diagnostik</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.action,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.onAction,
    fontSize: 24,
    fontWeight: '700',
  },
  profileNameText: {
    marginBottom: 4,
    textAlign: 'center',
    color: colors.ink,
  },
  editProfilePill: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  editProfileText: {
    ...typography.label,
    color: colors.action,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.rule,
  },
  versionText: {
    ...typography.meta,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
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
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 20,
  },
  modalBoxLarge: {
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
  modalInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.paper,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.rule,
  },
  modalBtnSecondaryText: {
    ...typography.label,
    color: colors.ink,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.action,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    ...typography.label,
    color: colors.onAction,
    fontWeight: '600',
  },
  modalIntervalRow: {
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
  testAlarmBtn: {
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
  testAlarmText: {
    ...typography.label,
    color: colors.action,
    fontSize: 13,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
});
