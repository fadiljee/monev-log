export type GeneratedBy = 'gemini' | 'openrouter' | 'local';
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'unknown';

export interface Report {
  id: string;
  date: string;
  rawInput: string;
  activity: string;
  learning: string;
  obstacle: string;
  createdAt: string;
  generatedBy?: GeneratedBy;   // BARU: tier yang menghasilkan laporan
  syncStatus?: SyncStatus;     // BARU: status cadangan Google Sheets
}

export interface AiResponse {
  activity: string;
  learning: string;
  obstacle: string;
  generatedBy?: GeneratedBy;
}

export interface UserProfile {
  name?: string;
  email?: string;
  avatarUri?: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type AlarmSoundOption = 'absen_alarm.wav' | 'chime.wav' | 'default';

export interface AlarmSoundItem {
  id: AlarmSoundOption;
  label: string;
  description: string;
}

export interface AlarmSettings {
  isEnabled: boolean;
  startHour: number; // default: 16 (16:00 WIB)
  startMinute: number; // default: 0
  endHour: number; // default: 24 (24:00 WIB)
  intervalMinutes: number; // default: 30
  sound: AlarmSoundOption;
}

export interface AttendanceStatus {
  date: string; // YYYY-MM-DD
  isConfirmed: boolean;
  confirmedAt?: string;
  source?: 'notification_action' | 'manual_button' | 'logbook_submit';
}
