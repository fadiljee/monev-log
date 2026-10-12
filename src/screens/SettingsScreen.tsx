import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExternalLink,
  Moon,
  Database,
  ChevronRight,
  Info,
  Check,
  X,
  Bell,
  Volume2,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { getSheetsWebhookUrl, saveSheetsWebhookUrl } from '../services/sheets';
import {
  getAlarmSettings,
  saveAlarmSettings,
  getAttendanceStatusToday,
  confirmAttendanceToday,
  resetAttendanceStatusToday,
  testTriggerAlarmAsync,
  requestNotificationPermissionAsync,
  getActiveScheduledAlarmsAsync,
  AVAILABLE_SOUNDS,
  DEFAULT_ALARM_SETTINGS,
} from '../services/alarm';
import { AlarmSettings, AlarmSoundOption, AttendanceStatus } from '../types';

/**
 * SettingsScreen — Pengaturan
 * Sesuai design.md §9.5 dan PRD Fitur Alarm Absen §4
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // ── State Fitur Alarm Absen (PRD §4) ──
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>(DEFAULT_ALARM_SETTINGS);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    date: '',
    isConfirmed: false,
  });
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    const url = await getSheetsWebhookUrl();
    setWebhookUrl(url);
    setInputUrl(url);

    const settings = await getAlarmSettings();
    setAlarmSettings(settings);

    const status = await getAttendanceStatusToday();
    setAttendanceStatus(status);

    const activeList = await getActiveScheduledAlarmsAsync();
    setScheduledCount(activeList.length);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  const handleSaveUrl = async () => {
    try {
      await saveSheetsWebhookUrl(inputUrl.trim());
      setWebhookUrl(inputUrl.trim());
      setModalVisible(false);
      Alert.alert('Berhasil', 'URL Google Apps Script Webhook berhasil disimpan.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan Webhook URL.');
    }
  };

  const handleToggleAlarm = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissionAsync();
      if (!granted) {
        Alert.alert(
          'Izin Notifikasi Diperlukan',
          'Aktifkan izin notifikasi pada pengaturan ponsel agar alarm pengingat absen dapat berfungsi.'
        );
        return;
      }
    }

    try {
      const updated = { ...alarmSettings, isEnabled: value };
      setAlarmSettings(updated);
      await saveAlarmSettings(updated);

      if (value) {
        showToast('Jadwal alarm aktif: 16:00 – 24:00 WIB (Tiap 30 mnt)');
      } else {
        showToast('Alarm pengingat absen dinonaktifkan.');
      }

      const activeList = await getActiveScheduledAlarmsAsync();
      setScheduledCount(activeList.length);
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat memperbarui pengaturan alarm.');
    }
  };

  const handleSelectSound = async (soundId: AlarmSoundOption) => {
    try {
      const updated = { ...alarmSettings, sound: soundId };
      setAlarmSettings(updated);
      await saveAlarmSettings(updated);
      setSoundModalVisible(false);

      const chosen = AVAILABLE_SOUNDS.find((s) => s.id === soundId);
      showToast(`Suara alarm diubah: ${chosen?.label || soundId}`);
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat mengubah nada dering.');
    }
  };

  const handleManualConfirmAttendance = async () => {
    try {
      const updated = await confirmAttendanceToday('manual_button');
      setAttendanceStatus(updated);
      const activeList = await getActiveScheduledAlarmsAsync();
      setScheduledCount(activeList.length);
      showToast('Status diperbarui: Anda sudah absen hari ini. Sisa alarm dimatikan.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat memperbarui status absensi.');
    }
  };

  const handleResetAttendance = async () => {
    try {
      const reset = await resetAttendanceStatusToday();
      setAttendanceStatus(reset);
      const activeList = await getActiveScheduledAlarmsAsync();
      setScheduledCount(activeList.length);
      showToast('Status absensi hari ini direset. Alarm diaktifkan kembali.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat mereset status absensi.');
    }
  };

  const handleTestAlarm = async () => {
    if (isTestingAlarm) return;
    setIsTestingAlarm(true);
    try {
      await testTriggerAlarmAsync(2);
      showToast('Alarm uji coba dikirim! Periksa notifikasi dalam 2 detik.');
    } catch (err: any) {
      Alert.alert('Uji Coba Gagal', err.message || 'Gagal mengirim notifikasi uji coba.');
    } finally {
      setTimeout(() => setIsTestingAlarm(false), 2500);
    }
  };

  const isConnected = Boolean(webhookUrl.trim());
  const selectedSoundItem =
    AVAILABLE_SOUNDS.find((s) => s.id === alarmSettings.sound) || AVAILABLE_SOUNDS[0];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Judul layar — display typography, dikelola layar sendiri (headerShown: false) */}
      <Text style={[typography.display, styles.screenTitle]}>Pengaturan</Text>

      {/* ── Toast / Umpan Balik Visual Alarm (PRD §4) ── */}
      {feedbackToast && (
        <View style={styles.toastBanner}>
          <CheckCircle2 color={colors.success} size={16} strokeWidth={2} style={{ marginRight: 8 }} />
          <Text style={[typography.meta, { color: colors.success, flex: 1 }]}>
            {feedbackToast}
          </Text>
        </View>
      )}

      {/* ── Seksi Alarm Pengingat Absen (PRD Fitur Alarm Absen §4) ── */}
      <Text style={styles.sectionLabel}>PENGINGAT ABSEN SORE</Text>
      <View style={styles.section}>
        {/* Toggle Switch Alarm */}
        <View style={styles.item}>
          <View style={styles.itemLeftFlex}>
            <Bell
              color={alarmSettings.isEnabled ? colors.action : colors.inkSoft}
              size={18}
              strokeWidth={1.75}
              style={styles.itemIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>Alarm Pengingat Absen</Text>
              <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                Mulai 16:00 – 24:00 WIB (Interval tiap 30 mnt)
              </Text>
            </View>
          </View>
          <Switch
            value={alarmSettings.isEnabled}
            onValueChange={handleToggleAlarm}
            trackColor={{ false: colors.rule, true: colors.action }}
            thumbColor={alarmSettings.isEnabled ? colors.paperRaised : '#FFFFFF'}
          />
        </View>

        <View style={styles.rule} />

        {/* Status Absensi & Alarm Hari Ini */}
        <View style={styles.itemColumn}>
          <View style={styles.rowBetween}>
            <Text style={[typography.meta, { color: colors.inkSoft }]}>STATUS HARI INI</Text>
            <View
              style={[
                styles.statusChip,
                attendanceStatus.isConfirmed ? styles.chipSuccess : styles.chipWarn,
              ]}
            >
              <Text
                style={[
                  typography.meta,
                  { color: attendanceStatus.isConfirmed ? colors.success : colors.warn },
                ]}
              >
                {attendanceStatus.isConfirmed ? 'Sudah Absen' : 'Belum Absen'}
              </Text>
            </View>
          </View>

          {attendanceStatus.isConfirmed ? (
            <View style={styles.confirmedInfoBox}>
              <Text style={[typography.meta, { color: colors.success, marginBottom: 6 }]}>
                ✅ Absen terkonfirmasi pukul{' '}
                {attendanceStatus.confirmedAt
                  ? new Intl.DateTimeFormat('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(attendanceStatus.confirmedAt))
                  : '16:00'}{' '}
                WIB. Sisa jadwal alarm hari ini telah dibatalkan.
              </Text>
              <TouchableOpacity
                style={styles.btnActionInline}
                onPress={handleResetAttendance}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Reset status absen hari ini"
              >
                <RotateCcw color={colors.inkSoft} size={14} style={{ marginRight: 6 }} />
                <Text style={[typography.meta, { color: colors.inkSoft }]}>
                  Reset Status Hari Ini
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.unconfirmedInfoBox}>
              <Text style={[typography.meta, { color: colors.inkSoft, marginBottom: 8 }]}>
                {alarmSettings.isEnabled
                  ? `Sistem aktif mengingatkan (${scheduledCount} jadwal tersisa hari ini). Notifikasi memiliki tombol cepat "Sudah Absen".`
                  : 'Alarm saat ini nonaktif.'}
              </Text>
              <TouchableOpacity
                style={styles.btnQuickConfirm}
                onPress={handleManualConfirmAttendance}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Tandai sudah absen hari ini"
              >
                <Check color="#FFFFFF" size={15} strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={[typography.label, { color: '#FFFFFF', fontSize: 13 }]}>
                  Tandai Sudah Absen Hari Ini
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.rule} />

        {/* Pilihan Suara Alarm */}
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={() => setSoundModalVisible(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Pilih nada dering alarm absen"
        >
          <View style={styles.itemLeft}>
            <Volume2 color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Suara Alarm</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[typography.meta, { marginRight: 6 }]}>
              {selectedSoundItem.label}
            </Text>
            <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
          </View>
        </TouchableOpacity>

        <View style={styles.rule} />

        {/* Uji Coba Alarm (Test Notification Button) */}
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={handleTestAlarm}
          disabled={isTestingAlarm}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Uji coba alarm pengingat absen"
        >
          <View style={styles.itemLeft}>
            <PlayCircle
              color={colors.action}
              size={18}
              strokeWidth={1.75}
              style={styles.itemIcon}
            />
            <Text style={[typography.body, { color: colors.action }]}>
              {isTestingAlarm ? 'Mengirim Uji Coba…' : 'Uji Coba Alarm (2 dtk)'}
            </Text>
          </View>
          <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* ── Seksi Penyimpanan ── */}
      <Text style={styles.sectionLabel}>PENYIMPANAN</Text>
      <View style={styles.section}>
        {/* Status koneksi Google Sheets */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Database color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Koneksi Google Sheets</Text>
          </View>
          {/* Status chip — design.md §7.4: ikon + teks + warna */}
          <View style={[styles.statusChip, isConnected ? styles.chipSuccess : styles.chipWarn]}>
            <Text style={[typography.meta, { color: isConnected ? colors.success : colors.warn }]}>
              {isConnected ? 'Terhubung' : 'Belum terhubung'}
            </Text>
          </View>
        </View>

        <View style={styles.rule} />

        {/* Hubungkan / Pengaturan Webhook */}
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={() => setModalVisible(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Konfigurasi URL Google Sheets Apps Script"
        >
          <View style={styles.itemLeft}>
            <ExternalLink color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>
              {isConnected ? 'Ubah URL Webhook' : 'Hubungkan Webhook'}
            </Text>
          </View>
          <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* ── Seksi Aplikasi ── */}
      <Text style={styles.sectionLabel}>APLIKASI</Text>
      <View style={styles.section}>
        {/* Mode gelap */}
        <TouchableOpacity
          style={styles.itemTouchable}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Atur mode gelap"
        >
          <View style={styles.itemLeft}>
            <Moon color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Mode gelap</Text>
          </View>
          {/* Nilai saat ini — font mono sesuai §4 */}
          <Text style={[typography.meta, { marginRight: 4 }]}>Ikuti sistem</Text>
        </TouchableOpacity>

        <View style={styles.rule} />

        {/* Tentang aplikasi */}
        <TouchableOpacity
          style={styles.itemTouchable}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Tentang aplikasi"
        >
          <View style={styles.itemLeft}>
            <Info color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Tentang aplikasi</Text>
          </View>
          <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>

        <View style={styles.rule} />

        {/* Versi — nilai pakai font mono (design.md §4 "Meta") */}
        <View style={[styles.item, styles.itemLast]}>
          <View style={styles.itemLeft}>
            <Text style={typography.body}>Versi</Text>
          </View>
          <Text style={typography.meta}>1.0.0</Text>
        </View>
      </View>

      {/* ── Modal Pilihan Suara Alarm (PRD §4) ── */}
      <Modal visible={soundModalVisible} animationType="fade" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.modalHeader}>
              <Text style={typography.title}>Pilih Suara Alarm</Text>
              <TouchableOpacity
                onPress={() => setSoundModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={colors.inkSoft} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.body, { color: colors.inkSoft, marginBottom: 16 }]}>
              Pilih nada dering kustom agar alarm absen Monev langsung dikenali.
            </Text>

            {AVAILABLE_SOUNDS.map((item) => {
              const isSelected = alarmSettings.sound === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    soundModalStyles.soundItem,
                    isSelected && soundModalStyles.soundItemSelected,
                  ]}
                  onPress={() => handleSelectSound(item.id)}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.body,
                        isSelected && { fontWeight: '600', color: colors.action },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[typography.meta, { color: colors.inkSoft, marginTop: 2 }]}>
                      {item.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check color={colors.action} size={18} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Modal Input Webhook URL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={[typography.title, { marginBottom: 12 }]}>Google Sheets Webhook URL</Text>
            <Text style={[typography.body, { color: colors.inkSoft, marginBottom: 16 }]}>
              Masukkan URL Web App dari Google Apps Script yang sudah dideploy.
            </Text>
            <TextInput
              style={modalStyles.input}
              placeholder="https://script.google.com/macros/s/.../exec"
              placeholderTextColor={colors.inkSoft}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={typography.label}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnSave]}
                onPress={handleSaveUrl}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  input: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  btnCancel: {
    backgroundColor: colors.rule,
  },
  btnSave: {
    backgroundColor: colors.action,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

const soundModalStyles = StyleSheet.create({
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 8,
    backgroundColor: colors.paperRaised,
  },
  soundItemSelected: {
    borderColor: colors.action,
    backgroundColor: 'rgba(31, 77, 61, 0.05)',
  },
});

/* ── Styles ──────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  contentContainer: {
    paddingHorizontal: 20, // margin layar 20px — design.md §5
    paddingBottom: 40,
  },
  screenTitle: {
    marginTop: 20,
    marginBottom: 24,
  },

  // Toast / Status banner feedback — PRD §4
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 107, 79, 0.10)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },

  // Label seksi — ALL-CAPS hanya untuk label grup navigasi (bukan body text)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 2,
  },

  // Blok seksi — permukaan statis radius 4px (design.md §5)
  section: {
    backgroundColor: colors.paperRaised,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 24,
    overflow: 'hidden',
  },

  // Item non-touchable
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLast: {
    // tidak ada borderBottom di item terakhir
  },

  // Item column layout untuk status absensi
  itemColumn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmedInfoBox: {
    backgroundColor: 'rgba(44, 107, 79, 0.06)',
    borderRadius: 4,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(44, 107, 79, 0.20)',
  },
  unconfirmedInfoBox: {
    backgroundColor: colors.paper,
    borderRadius: 4,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  btnActionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  btnQuickConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 4,
  },

  // Item touchable — tap target ≥44px (design.md §11)
  itemTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
    paddingVertical: 12,
  },

  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeftFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemIcon: {
    marginRight: 12,
  },

  // Garis pemisah 1px — design.md §5 (bukan shadow)
  rule: {
    height: 1,
    backgroundColor: colors.rule,
    marginHorizontal: 0,
  },

  // Status chip — design.md §7.4
  // Pill shape (radius penuh) = pengecualian yang disengaja sebagai "penanda status"
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  chipWarn: {
    backgroundColor: 'rgba(148, 107, 29, 0.10)',
  },
  chipSuccess: {
    backgroundColor: 'rgba(44, 107, 79, 0.10)',
  },
});
