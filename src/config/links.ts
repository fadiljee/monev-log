import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Clipboard } from 'react-native';

// ── Konstanta Tautan Portal Monev — PRD §E.2 ──

/**
 * Alamat default portal Monev (MagangHub Kemnaker).
 * Pengguna dapat menggantinya di Pengaturan > Portal Monev > "Ubah alamat portal".
 * Nilai khusus pengguna tersimpan di AsyncStorage dengan kunci ini.
 */
export const DEFAULT_MONEV_URL = 'https://monev.maganghub.kemnaker.go.id';


const STORAGE_KEY = '@monev_custom_url';

/**
 * Ambil URL Monev — nilai khusus pengguna dari AsyncStorage, atau default.
 */
export async function getMonevUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().startsWith('https://')) return saved.trim();
  } catch {
    // AsyncStorage gagal → pakai default
  }
  return DEFAULT_MONEV_URL;
}

/**
 * Simpan URL Monev kustom.
 * Validasi: wajib berawalan `https://` — PRD §E.2.
 * Lempar Error jika tidak valid.
 */
export async function saveMonevUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) {
    throw new Error('Gunakan alamat yang diawali https://');
  }
  await AsyncStorage.setItem(STORAGE_KEY, trimmed);
}

/** Kembalikan URL ke default (hapus nilai kustom). */
export async function resetMonevUrl(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Buka portal Monev di browser bawaan perangkat.
 * Fallback: salin URL ke clipboard dan kembalikan pesan error untuk ditampilkan sebagai toast.
 *
 * @returns `null` jika berhasil, atau string pesan error jika gagal.
 * — PRD §E.4
 */
export async function openMonev(): Promise<string | null> {
  const url = await getMonevUrl();
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('URL tidak didukung');
    await Linking.openURL(url);
    return null;
  } catch {
    // Fallback: salin ke clipboard
    try {
      // @ts-ignore — React Native Clipboard fallback
      Clipboard.setString(url);
    } catch {
      // Abaikan jika clipboard juga gagal
    }
    return 'Tidak bisa membuka browser. Tautan sudah disalin, tempel di browser.';
  }
}
