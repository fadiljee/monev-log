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
    id: 'danger_alarm.mp3',
    label: 'Danger Alarm (Eksklusif)',
    description: 'Alarm bahaya intensif looping hingga tombol Sudah Absen ditekan',
  },
];

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  isEnabled: true,
  startHour: 16, // 16:00 WIB
  startMinute: 0,
  endHour: 24, // 24:00 WIB
  intervalMinutes: 30, // Nagging interval tiap 30 menit
  sound: 'danger_alarm.mp3',
  volume: 100, // Volume 100%
};

/**
 * Helper untuk normalisasi nama suara notifikasi sesuai platform
 */
export function getNotificationSoundIdentifier(sound: AlarmSoundOption): string | boolean {
  if (sound === 'default') return true;
  if (Platform.OS === 'android') {
    return sound.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_]/g, '_');
  }
  return sound;
}

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

/**
 * Mengecek apakah tanggal tertentu merupakan hari kerja (Senin s.d. Jumat).
 * getDay(): 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu.
 * Alarm hanya berbunyi pada hari Senin - Jumat.
 */
export function isWorkday(d: Date = new Date()): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Menghitung tanggal hari kerja berikutnya (Senin s.d. Jumat)
 * pada jam & menit pembuka alarm (default: startHour & startMinute dari settings).
 * Jika hari ini Jumat, akan melompati Sabtu & Minggu dan mengembalikan hari Senin.
 */
export function getNextWorkdayDate(
  from: Date = new Date(),
  targetHour = 16,
  targetMinute = 0
): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  next.setHours(targetHour, targetMinute, 0, 0);

  // Jika jatuh pada hari Sabtu (6) atau Minggu (0), terus maju hingga mencapai hari Senin (1)
  while (!isWorkday(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
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
  const cleanSoundKey = sound.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const channelId = `${CHANNEL_ID_PREFIX}-${cleanSoundKey}`;

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

    // 2. Android Notification Channel khusus dengan level MAX dan custom sound
    if (Platform.OS === 'android') {
      const soundFile = sound === 'default' ? undefined : (getNotificationSoundIdentifier(sound) as string);
      await Notifications.setNotificationChannelAsync(channelId, {
        name: `Pengingat Absen Monev (${sound.toLowerCase().includes('danger') ? 'Danger Alarm' : sound === 'default' ? 'Default' : 'Kustom'})`,
        description: 'Notifikasi pengingat absen sore dan pengisian logbook Monev (Looping hingga absen)',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#DC2626',
        sound: soundFile,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
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

    // 3. Jadwalkan untuk hari kerja berikutnya (Senin jika hari ini Jumat)
    const settings = await getAlarmSettings();
    if (settings.isEnabled) {
      await scheduleNextWorkdayAlarmAsync(settings);
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

export const cancelAttendanceToday = resetAttendanceStatusToday;

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
 * Sinkronkan jadwal alarm:
 * - Jika akhir pekan (Sabtu / Minggu), tidak menjadwalkan alarm hari ini dan memastikan jadwal hari kerja berikutnya (Senin) siap.
 * - Jika hari kerja (Senin - Jumat) dan belum absen, jadwalkan nagging slots hari ini.
 * - Jika hari kerja dan sudah absen, jadwalkan hari kerja berikutnya.
 */
export async function syncScheduleForCurrentDayAsync(): Promise<void> {
  const settings = await getAlarmSettings();
  if (!settings.isEnabled) return;

  const now = new Date();

  // Jika hari ini akhir pekan (Sabtu / Minggu), batalkan alarm hari ini dan pastikan hari Senin sudah terjadwal
  if (!isWorkday(now)) {
    await cancelTodayAttendanceAlarmsAsync();
    await scheduleNextWorkdayAlarmAsync(settings);
    return;
  }

  const status = await getAttendanceStatusToday();
  if (status.isConfirmed) {
    // Hari ini sudah absen, pastikan jadwal hari kerja berikutnya siap
    await scheduleNextWorkdayAlarmAsync(settings);
  } else {
    // Belum absen, jadwalkan sisa alarm hari ini
    await scheduleAttendanceAlarmsAsync(settings);
  }
}

/**
 * Jadwalkan alarm untuk siklus hari ini (Nagging Mode 16:00 - 24:00 WIB)
 * HANYA aktif dan berbunyi pada hari kerja: Senin s.d. Jumat.
 * Sesuai PRD §2.A:
 * - Pemicu mulai 16:00 WIB
 * - Interval pengingat (16:00, 16:30, 17:00, dst. s.d. 24:00 WIB)
 * - Hanya slot yang belum lewat yang dijadwalkan
 */
export async function scheduleAttendanceAlarmsAsync(settings: AlarmSettings): Promise<number> {
  const channelId = await setupCategoriesAndChannelsAsync(settings.sound);
  await cancelTodayAttendanceAlarmsAsync();

  const now = new Date();

  // Pastikan alarm HANYA berbunyi pada hari kerja (Senin s.d. Jumat)
  if (!isWorkday(now)) {
    console.log('[Alarm] Hari ini adalah akhir pekan (Sabtu/Minggu). Alarm hanya berbunyi dari Senin sampai Jumat.');
    await scheduleNextWorkdayAlarmAsync(settings);
    return 0;
  }

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

    const soundIdentifier = getNotificationSoundIdentifier(settings.sound);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Waktunya Absen Sore & Isi Logbook!',
          body: `Pengingat Absen Monev (${timeLabel} WIB). Alarm berdering looping! Tekan " Sudah Absen" untuk mematikan alarm.`,
          sound: soundIdentifier,
          categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
          priority: Notifications.AndroidNotificationPriority.MAX,
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

  // Juga jadwalkan pembuka untuk hari kerja berikutnya pukul 16:00 (misal: Senin jika hari ini Jumat)
  await scheduleNextWorkdayAlarmAsync(settings);

  console.log(`[Alarm] Berhasil menjadwalkan ${scheduledCount} notifikasi nagging untuk hari ini (${todayKey}).`);
  return scheduledCount;
}

/**
 * Jadwalkan alarm pembuka untuk hari kerja berikutnya (Senin - Jumat) pukul startHour:startMinute
 */
export async function scheduleNextWorkdayAlarmAsync(settings: AlarmSettings): Promise<void> {
  const nextWorkday = getNextWorkdayDate(new Date(), settings.startHour, settings.startMinute);
  const nextWorkdayKey = getLocalDateString(nextWorkday);
  const channelId = `${CHANNEL_ID_PREFIX}-${settings.sound.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    // Batalkan trigger pada hari kerja berikutnya yang lama agar tidak ganda
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of all) {
      const data = item.content.data;
      if (data?.tag === 'monev_attendance_alarm' && data?.date === nextWorkdayKey) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }

    const timeLabel = `${String(settings.startHour).padStart(2, '0')}:${String(settings.startMinute).padStart(2, '0')}`;
    const soundIdentifier = getNotificationSoundIdentifier(settings.sound);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Waktunya Absen Sore & Isi Logbook!',
        body: `Pengingat Absen Monev (${timeLabel} WIB). Jangan lupa absen sore dan isi logbook harian Anda! Tekan " Sudah Absen" untuk mematikan alarm.`,
        sound: soundIdentifier,
        categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: {
          tag: 'monev_attendance_alarm',
          date: nextWorkdayKey,
          slot: timeLabel,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextWorkday,
        channelId,
      },
    });
    console.log(`[Alarm] Alarm hari kerja berikutnya berhasil dijadwalkan untuk: ${nextWorkdayKey} ${timeLabel} WIB.`);
  } catch (err) {
    console.warn('[Alarm] Gagal menjadwalkan alarm hari kerja berikutnya:', err);
  }
}

// Alias untuk kompatibilitas ke belakang
export const scheduleNextDayAlarmAsync = scheduleNextWorkdayAlarmAsync;

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
  const soundIdentifier = getNotificationSoundIdentifier(settings.sound);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 [UJI COBA] Danger Alarm Absen Monev!',
      body: 'Ini adalah uji coba Alarm Absen Monev dengan Danger Alarm. Tekan tombol " Sudah Absen" di bawah untuk mematikan alarm!',
      sound: soundIdentifier,
      categoryIdentifier: CATEGORY_ATTENDANCE_ALARM,
      priority: Notifications.AndroidNotificationPriority.MAX,
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
