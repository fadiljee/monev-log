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
  Cloud,
  Key,
  Bell,
  Settings,
  Moon,
  Trash2,
  ChevronRight,
  X,
  Check,
  Volume2,
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
} from '../services/alarm';
import {
  getMonevUrl,
  saveMonevUrl,
  resetMonevUrl,
  openMonev,
} from '../config/links';
import {
  getSheetsWebhookUrl,
  saveSheetsWebhookUrl,
  testSheetsConnection,
} from '../services/sheets';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getOpenRouterApiKey,
  saveOpenRouterApiKey,
} from '../services/ai';
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
    'portal' | 'sheets' | 'apikey' | 'alarm' | 'profile' | null
  >(null);

  // Form states for modals
  const [portalUrl, setPortalUrl] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [alarmInterval, setAlarmInterval] = useState(30);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundOption>('absen_alarm.wav');
  const [profileName, setProfileName] = useState('Peserta Magang');
  const [profileEmail, setProfileEmail] = useState('');

  const loadSettings = async () => {
    try {
      const a = await getAlarmSettings();
      setAlarmEnabled(a.isEnabled);
      setAlarmInterval(a.intervalMinutes);
      setAlarmSound(a.sound);

      const pUrl = await getMonevUrl();
      setPortalUrl(pUrl);

      const sUrl = await getSheetsWebhookUrl();
      setSheetsUrl(sUrl);

      const gKey = await getGeminiApiKey();
      setGeminiKey(gKey);

      const oKey = await getOpenRouterApiKey();
      setOpenRouterKey(oKey);

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

  const handleSaveSheetsUrl = async () => {
    await saveSheetsWebhookUrl(sheetsUrl);
    setActiveModal(null);
    showToast('URL Webhook Google Sheets disimpan.');
  };

  const handleTestSheets = async () => {
    if (!sheetsUrl.trim()) {
      Alert.alert('Info', 'Masukkan URL webhook terlebih dahulu.');
      return;
    }
    const ok = await testSheetsConnection(sheetsUrl);
    Alert.alert(
      ok ? 'Koneksi Berhasil' : 'Koneksi Gagal',
      ok
        ? 'Webhook Google Apps Script merespons dengan benar.'
        : 'Tidak dapat menghubungi webhook. Periksa URL deployment Web App Anda.',
    );
  };

  const handleSaveApiKeys = async () => {
    await saveGeminiApiKey(geminiKey);
    await saveOpenRouterApiKey(openRouterKey);
    setActiveModal(null);
    showToast('Kunci API berhasil disimpan secara lokal.');
  };

  const handleSaveAlarmSettings = async () => {
    const s = await getAlarmSettings();
    await saveAlarmSettings({
      ...s,
      intervalMinutes: alarmInterval,
      sound: alarmSound,
    });
    setActiveModal(null);
    showToast('Pengaturan alarm disimpan.');
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
      key: 'sheets',
      label: 'Cadangan Google Sheets',
      Icon: Cloud,
      onPress: () => setActiveModal('sheets'),
    },
    {
      key: 'apikey',
      label: 'Kunci API AI (Opsional)',
      Icon: Key,
      onPress: () => setActiveModal('apikey'),
    },
  ];

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

        {/* Seksi Preferensi */}
        <Text style={[typography.section, styles.sectionHeading]}>Preferensi</Text>
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.card, shadows.e1]}
        >
          <View style={styles.menuRow}>
            <IconTile icon={<Bell color={colors.action} size={18} strokeWidth={2} />} />
            <Text style={[typography.body, styles.menuText]}>
              Alarm pengingat absen
            </Text>
            <Switch
              value={alarmEnabled}
              onValueChange={handleToggleAlarm}
              trackColor={{ false: colors.track, true: colors.action }}
              thumbColor={colors.paperRaised}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setActiveModal('alarm')}
          >
            <IconTile icon={<Settings color={colors.action} size={18} strokeWidth={2} />} />
            <Text style={[typography.body, styles.menuText]}>
              Pengaturan alarm
            </Text>
            <ChevronRight color={colors.inkSoft} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Seksi Bahaya: Hapus Data */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={[styles.card, shadows.e1, { marginTop: 8 }]}
        >
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleClearAllData}
            activeOpacity={0.7}
          >
            <IconTile
              icon={<Trash2 color={colors.error} size={18} strokeWidth={2} />}
              backgroundColor={colors.errorTint}
            />
            <Text style={[typography.body, { color: colors.error, flex: 1, fontWeight: '500' }]}>
              Hapus semua data lokal
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[typography.bodySmall, styles.footerText]}>
          MonevApp v3.0 · "Soft Focus" Edition · Offline First
        </Text>
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
              <Text style={typography.section}>Alamat Portal Monev</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[typography.bodySmall, { color: colors.inkSoft, marginBottom: 12 }]}>
              Alamat tujuan yang dibuka saat Anda menekan tombol "Portal Monev".
            </Text>
            <TextInput
              style={[typography.meta, styles.modalInput]}
              value={portalUrl}
              onChangeText={setPortalUrl}
              placeholder="https://monev.maganghub.kemnaker.go.id"
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

      {/* MODAL: GOOGLE SHEETS */}
      <Modal
        visible={activeModal === 'sheets'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <Text style={typography.section}>Cadangan Google Sheets</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[typography.bodySmall, { color: colors.inkSoft, marginBottom: 12 }]}>
              Tempelkan Web App URL Google Apps Script yang terhubung ke Spreadsheet logbook Anda.
            </Text>
            <TextInput
              style={[typography.meta, styles.modalInput]}
              value={sheetsUrl}
              onChangeText={setSheetsUrl}
              placeholder="https://script.google.com/macros/s/.../exec"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleTestSheets}>
                <Text style={styles.modalBtnSecondaryText}>Uji Ping</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSaveSheetsUrl}>
                <Text style={styles.modalBtnPrimaryText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: API KEYS */}
      <Modal
        visible={activeModal === 'apikey'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <Text style={typography.section}>Kunci API AI (Pribadi)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[typography.bodySmall, { color: colors.inkSoft, marginBottom: 10 }]}>
              Jika Anda ingin menggunakan kuota API sendiri (Gemini / OpenRouter):
            </Text>

            <Text style={[typography.label, { marginBottom: 4, color: colors.ink }]}>
              Gemini API Key:
            </Text>
            <TextInput
              style={[typography.meta, styles.modalInput]}
              value={geminiKey}
              onChangeText={setGeminiKey}
              placeholder="AIzaSy..."
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={[typography.label, { marginTop: 8, marginBottom: 4, color: colors.ink }]}>
              OpenRouter Key (Cadangan):
            </Text>
            <TextInput
              style={[typography.meta, styles.modalInput]}
              value={openRouterKey}
              onChangeText={setOpenRouterKey}
              placeholder="sk-or-v1-..."
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={[styles.modalBtnRow, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { width: '100%' }]}
                onPress={handleSaveApiKeys}
              >
                <Text style={styles.modalBtnPrimaryText}>Simpan Kunci API</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: PENGATURAN ALARM */}
      <Modal
        visible={activeModal === 'alarm'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.e2]}>
            <View style={styles.modalHeader}>
              <Text style={typography.section}>Pengaturan Alarm Absen</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color={colors.ink} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.label, { marginBottom: 6, color: colors.ink }]}>
              Interval Pengingat (Menit):
            </Text>
            <View style={styles.modalIntervalRow}>
              {[15, 30, 45, 60].map((m) => (
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

            <Text style={[typography.label, { marginTop: 12, marginBottom: 6, color: colors.ink }]}>
              Pilihan Nada Suara:
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

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { marginTop: 18 }]}
              onPress={handleSaveAlarmSettings}
            >
              <Text style={styles.modalBtnPrimaryText}>Terapkan Pengaturan</Text>
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
              placeholder="Contoh: Budi Santoso"
            />

            <Text style={[typography.label, { marginTop: 10, marginBottom: 4, color: colors.ink }]}>
              Email (Opsional):
            </Text>
            <TextInput
              style={[typography.body, styles.modalInput]}
              value={profileEmail}
              onChangeText={setProfileEmail}
              placeholder="budi@example.com"
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
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.actionTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.paperRaised,
    ...shadows.e1,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.action,
  },
  profileNameText: {
    color: colors.ink,
  },
  editProfilePill: {
    backgroundColor: colors.action,
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 8,
    marginTop: 4,
  },
  editProfileText: {
    color: colors.onAction,
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeading: {
    marginBottom: 8,
    color: colors.inkSoft,
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  menuText: {
    flex: 1,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.rule,
    marginHorizontal: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.inkSoft,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: colors.paperRaised,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.paper,
    color: colors.ink,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    color: colors.ink,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1,
    height: 46,
    backgroundColor: colors.action,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    color: colors.onAction,
    fontWeight: '600',
  },
  modalIntervalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modalIntervalPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  modalIntervalPillActive: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  modalIntervalText: {
    color: colors.inkSoft,
    fontSize: 13,
  },
  modalIntervalTextActive: {
    color: colors.onAction,
    fontWeight: '600',
  },
  soundSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 8,
  },
  soundSelectRowActive: {
    borderColor: colors.action,
    backgroundColor: colors.actionTint,
  },
});
