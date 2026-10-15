import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AlarmSettings, AlarmSoundItem, AlarmSoundOption, AttendanceStatus } from '../types';

export const BACKGROUND_ATTENDANCE_TASK = 'BACKGROUND_ATTENDANCE_TASK';
export const CATEGORY_ATTENDANCE_ALARM = 'ATTENDANCE_ALARM';
export const ACTION_CONFIRM_ATTENDANCE = 'ACTION_CONFIRM_ATTENDANCE';
export const CHANNEL_ID_PREFIX = 'monev-alarm-channel';

const STORAGE_KEY_SETTINGS = '@monev_alarm_settings';
const STORAGE_KEY_STATUS = '@monev_attendance_status';

export const AVAILABLE_SOUNDS: AlarmSoundItem[] = [
  {
    id: 'absen_alarm.wav',
    label: 'Absen Alert (Kustom)',
    description: 'Nada dering kustom Monev 4-nada tegas',
  },
  {
    id: 'chime.wav',
    label: 'Melodic Chime',
    description: 'Dua nada lembut bersahabat',
  },
  {
    id: 'default',
    label: 'Nada Dering Sistem',
    description: 'Suara notifikasi standar perangkat',
  },
];

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  isEnabled: true,
  startHour: 16, // 16:00 WIB
  startMinute: 0,
  endHour: 24, // 24:00 WIB
  intervalMinutes: 30, // Nagging interval tiap 30 menit
  sound: 'absen_alarm.wav',
};

// ── Notification Handler (Foreground Presentation) ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Helper untuk format tanggal lokal YYYY-MM-DD
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Top-Level Task Definition untuk Background Action Button ──
// Sesuai PRD §2.B & §2.C: Dieksekusi ketika pengguna menekan " Sudah Absen"
// pada lockscreen/notification center saat aplikasi di latar belakang / ditutup.
TaskManager.defineTask<any>(BACKGROUND_ATTENDANCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[Alarm Task] Background task error:', error);
    return Notifications.BackgroundNotificationTaskResult.Failed;
  }

  try {
    const actionIdentifier = data?.actionIdentifier;
    if (actionIdentifier === ACTION_CONFIRM_ATTENDANCE) {
      console.log('[Alarm Task] Quick action "Sudah Absen" received in background!');
      await confirmAttendanceToday('notification_action');
      return Notifications.BackgroundNotificationTaskResult.NewData;
    }
    return Notifications.BackgroundNotificationTaskResult.NoData;
  } catch (err) {
    console.error('[Alarm Task] Failed to handle background notification action:', err);
    return Notifications.BackgroundNotificationTaskResult.Failed;
  }
});

/**
 * Inisialisasi awal notifikasi & task: dipanggil saat aplikasi bootstrap (misal di index.ts/App.tsx)
 */
export async function initAlarmServiceAsync(): Promise<void> {
  try {
    // 1. Daftarkan background task jika belum
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ATTENDANCE_TASK);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_ATTENDANCE_TASK);
    }

    // 2. Setup category dan channel dengan setting tersimpan
    const settings = await getAlarmSettings();
    await setupCategoriesAndChannelsAsync(settings.sound);

    // 3. Jika alarm aktif, sinkronkan jadwal hari ini
    if (settings.isEnabled) {
      await syncScheduleForCurrentDayAsync();
    }
  } catch (e) {
    console.warn('[Alarm] Error initializing alarm service:', e);
  }
}

/**
 * Setup Notification Category dengan tombol aksi " Sudah Absen"
 * dan Android Notification Channel dengan suara kustom
 */
export async function setupCategoriesAndChannelsAsync(sound: AlarmSoundOption): Promise<string> {
  const channelId = `${CHANNEL_ID_PREFIX}-${sound.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    // 1. Kategori notifikasi interaktif (Action Button)
    // Sesuai PRD §2.C: Tombol " Sudah Absen" dengan opensAppToForeground: false
    await Notifications.setNotificationCategoryAsync(CATEGORY_ATTENDANCE_ALARM, [
      {
        identifier: ACTION_CONFIRM_ATTENDANCE,
        buttonTitle: ' Sudah Absen',
        options: {
          opensAppToForeground: false, // Zero-friction UX: matikan alarm tanpa buka app
          isAuthenticationRequired: false,
        },
      },
    ]);

    // 2. Android Notification Channel khusus dengan level HIGH dan custom sound
    // Sesuai PRD §2.D: Level IMPORTANCE_HIGH agar suara kustom berbunyi
    if (Platform.OS === 'android') {
      const soundFile = sound === 'default' ? undefined : (Platform.OS === 'android' ? sound.replace(/\.[^/.]+$/, '') : sound);
      await Notifications.setNotificationChannelAsync(channelId, {
        name: `Pengingat Absen Monev (${sound === 'default' ? 'Default' : 'Kustom'})`,
        description: 'Notifikasi pengingat absen sore dan pengisian logbook Monev',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14407F', // token action v2 — design.md §3.6 (era lama: #1F4D3D)
        sound: soundFile,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });
    }
  } catch (err) {
    console.warn('[Alarm] Error configuring categories and channels:', err);
  }

  return channelId;
}

/**
 * Meminta izin notifikasi dari pengguna
 */
export async function requestNotificationPermissionAsync(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Alarm] Failed to request permissions:', err);
    return false;
  }
}

/**
 * Ambil konfigurasi alarm dari AsyncStorage
 */
export async function getAlarmSettings(): Promise<AlarmSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[Alarm] Failed to get alarm settings:', err);
  }
  return DEFAULT_ALARM_SETTINGS;
}

/**
 * Simpan konfigurasi alarm dan jadwalkan ulang
 */
export async function saveAlarmSettings(newSettings: AlarmSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    await setupCategoriesAndChannelsAsync(newSettings.sound);

    if (newSettings.isEnabled) {
      await scheduleAttendanceAlarmsAsync(newSettings);
    } else {
      await cancelAllAttendanceAlarmsAsync();
    }
  } catch (err) {
    console.error('[Alarm] Failed to save alarm settings:', err);
    throw err;
  }
}

/**
 * Ambil status absensi hari ini
 */
export async function getAttendanceStatusToday(): Promise<AttendanceStatus> {
  const todayKey = getLocalDateString();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATUS);
    if (raw) {
      const status: AttendanceStatus = JSON.parse(raw);
      if (status.date === todayKey) {
        return status;
      }
    }
  } catch (err) {
    console.warn('[Alarm] Failed to get attendance status:', err);
  }

  return {
    date: todayKey,
    isConfirmed: false,
  };
}

/**
 * Konfirmasi absensi hari ini (Zero friction atau dari UI):
 * 1. Simpan status confirmed di AsyncStorage
 * 2. Batalkan seluruh sisa antrean alarm hari ini
 * 3. Tutup notifikasi yang sedang aktif
 * 4. Jadwalkan alarm untuk esok hari pukul 16:00
 */
export async function confirmAttendanceToday(
  source: 'notification_action' | 'manual_button' | 'logbook_submit' = 'manual_button'
): Promise<AttendanceStatus> {
  const todayKey = getLocalDateString();
  const newStatus: AttendanceStatus = {
    date: todayKey,
    isConfirmed: true,
    confirmedAt: new Date().toISOString(),
    source,
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(newStatus));

    // 1. Batalkan seluruh notifikasi alarm yang terjadwal untuk hari ini
    await cancelTodayAttendanceAlarmsAsync();

    // 2. Dismiss notifikasi yang sedang tampil di status bar
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (_) {}

    // 3. Jadwalkan untuk esok hari
    const settings = await getAlarmSettings();
    if (settings.isEnabled) {
      await scheduleNextDayAlarmAsync(settings);
    }

    console.log(`[Alarm] Kehadiran hari ini (${todayKey}) berhasil dikonfirmasi via ${source}.`);
  } catch (err) {
    console.error('[Alarm] Error confirming attendance:', err);
  }

  return newStatus;
}

/**
 * Reset status absensi hari ini (misal untuk testing atau jika tidak sengaja tertekan)
 */
export async function resetAttendanceStatusToday(): Promise<AttendanceStatus> {
  const todayKey = getLocalDateString();
  const resetStatus: AttendanceStatus = {
    date: todayKey,
    isConfirmed: false,
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(resetStatus));
    const settings = await getAlarmSettings();
    if (settings.isEnabled) {
      await scheduleAttendanceAlarmsAsync(settings);
    }
  } catch (err) {
    console.error('[Alarm] Error resetting attendance:', err);
  }

  return resetStatus;
}

/**
 * Hitung daftar waktu (slot) dari startHour:startMinute hingga endHour:00 dengan intervalMinutes
 * Misal: 16:00, 16:30, 17:00, ..., 23:30, 24:00 (atau 23:59)
 */
export function generateNaggingSlots(
  startHour = 16,
  startMinute = 0,
  endHour = 24,
  intervalMinutes = 30
): { hour: number; minute: number }[] {
  const slots: { hour: number; minute: number }[] = [];
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60; // 24 * 60 = 1440

  for (let current = startTotal; current <= endTotal; current += intervalMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    if (h === 24 && m === 0) {
      slots.push({ hour: 23, minute: 59 });
    } else if (h < 24) {
      slots.push({ hour: h, minute: m });
    }
  }

  return slots;
}

/**
 * Sinkronkan jadwal alarm: jika hari baru dan belum absen, jadwalkan hari ini.
 */
export async function syncScheduleForCurrentDayAsync(): Promise<void> {
  const settings = await getAlarmSettings();
  if (!settings.isEnabled) return;

  const status = await getAttendanceStatusToday();
  if (status.isConfirmed) {
    // Hari ini sudah absen, pastikan jadwal besok siap
    await scheduleNextDayAlarmAsync(settings);
  } else {
    // Belum absen, jadwalkan sisa alarm hari ini
    await scheduleAttendanceAlarmsAsync(settings);
  }
}

/**
 * Jadwalkan alarm untuk siklus hari ini (Nagging Mode 16:00 - 24:00 WIB)
 * Sesuai PRD §2.A:
 * - Pemicu mulai 16:00 WIB
 * - Interval pengingat (16:00, 16:30, 17:00, dst. s.d. 24:00 WIB)
 * - Hanya slot yang belum lewat yang dijadwalkan
 */
export async function scheduleAttendanceAlarmsAsync(settings: AlarmSettings): Promise<number> {
  const channelId = await setupCategoriesAndChannelsAsync(settings.sound);
  await cancelTodayAttendanceAlarmsAsync();

  const now = new Date();
  const todayKey = getLocalDateString(now);
  const slots = generateNaggingSlots(
    settings.startHour,
    settings.startMinute,
    settings.endHour,
    settings.intervalMinutes
  );

  let scheduledCount = 0;

  for (const slot of slots) {
    const slotDate = new Date();
    slotDate.setHours(slot.hour, slot.minute, 0, 0);

    // Jangan jadwalkan waktu yang sudah lewat hari ini
    if (slotDate.getTime() <= now.getTime()) {
      continue;
    }

    const timeLabel = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Waktunya Absen Sore & Isi Logbook!',
          body: `Pengingat Absen Monev (${timeLabel} WIB). Tekan " Sudah Absen" jika Anda sudah absen & input kegiatan.`,
          sound: settings.sound !== 'default' ? (Platform.OS === 'android' ? settings.sound.replace(/\.[^/.]+$/, '') : settings.sound) : true,
          categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            tag: 'monev_attendance_alarm',
            date: todayKey,
            slot: timeLabel,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: slotDate,
          channelId,
        },
      });
      scheduledCount++;
    } catch (err) {
      console.warn(`[Alarm] Gagal menjadwalkan slot ${timeLabel}:`, err);
    }
  }

  // Juga jadwalkan pembuka untuk esok hari pukul 16:00 (siklus otomatis berikutnya)
  await scheduleNextDayAlarmAsync(settings);

  console.log(`[Alarm] Berhasil menjadwalkan ${scheduledCount} notifikasi nagging untuk hari ini.`);
  return scheduledCount;
}

/**
 * Jadwalkan alarm pembuka untuk esok hari pukul 16:00
 */
export async function scheduleNextDayAlarmAsync(settings: AlarmSettings): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(settings.startHour, settings.startMinute, 0, 0);

  const tomorrowKey = getLocalDateString(tomorrow);
  const channelId = `${CHANNEL_ID_PREFIX}-${settings.sound.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    // Batalkan trigger besok yang lama agar tidak ganda
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of all) {
      const data = item.content.data;
      if (data?.tag === 'monev_attendance_alarm' && data?.date === tomorrowKey) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Waktunya Absen Sore & Isi Logbook!',
        body: `Pengingat Absen Monev (16:00 WIB). Jangan lupa absen sore dan isi logbook harian Anda!`,
        sound: settings.sound !== 'default' ? settings.sound : true,
        categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          tag: 'monev_attendance_alarm',
          date: tomorrowKey,
          slot: '16:00',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: tomorrow,
        channelId,
      },
    });
  } catch (err) {
    console.warn('[Alarm] Gagal menjadwalkan alarm esok hari:', err);
  }
}

/**
 * Batalkan seluruh alarm yang terjadwal untuk hari ini
 * Sesuai PRD §2.C: Cancel All Scheduled Notifications untuk hari ini
 */
export async function cancelTodayAttendanceAlarmsAsync(): Promise<void> {
  const todayKey = getLocalDateString();
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of all) {
      const data = item.content.data;
      if (data?.tag === 'monev_attendance_alarm' && data?.date === todayKey) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (err) {
    console.warn('[Alarm] Error cancelling today attendance alarms:', err);
  }
}

/**
 * Batalkan semua notifikasi alarm yang terjadwal (misal saat fitur dinonaktifkan)
 */
export async function cancelAllAttendanceAlarmsAsync(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of all) {
      if (item.content.data?.tag === 'monev_attendance_alarm') {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (err) {
    console.warn('[Alarm] Error cancelling all attendance alarms:', err);
  }
}

/**
 * Ambil daftar notifikasi alarm yang sedang aktif terjadwal
 */
export async function getActiveScheduledAlarmsAsync(): Promise<
  { id: string; time: string; date: string }[]
> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all
      .filter((n) => n.content.data?.tag === 'monev_attendance_alarm')
      .map((n) => ({
        id: n.identifier,
        time: (n.content.data?.slot as string) || '16:00',
        date: (n.content.data?.date as string) || '',
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  } catch (err) {
    return [];
  }
}

/**
 * Fungsi Pengujian / Uji Coba:
 * Memunculkan notifikasi alarm dalam hitungan beberapa detik dengan custom sound
 * dan tombol " Sudah Absen" agar dapat langsung diuji di perangkat pengembang / user.
 */
export async function testTriggerAlarmAsync(delaySeconds = 3): Promise<string> {
  const hasPermission = await requestNotificationPermissionAsync();
  if (!hasPermission) {
    throw new Error('Izin notifikasi belum diberikan pada perangkat ini.');
  }

  const settings = await getAlarmSettings();
  const channelId = await setupCategoriesAndChannelsAsync(settings.sound);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '[TEST] Waktunya Absen Sore & Isi Logbook!',
      body: 'Ini adalah uji coba Alarm Absen Monev. Tekan tombol " Sudah Absen" di bawah untuk menguji pembatalan alarm!',
      sound: settings.sound !== 'default' ? settings.sound : true,
      categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        tag: 'monev_attendance_alarm_test',
        isTest: true,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, delaySeconds),
      repeats: false,
      channelId,
    },
  });

  return identifier;
}
