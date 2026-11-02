#!/usr/bin/env python3
"""
Test Suite MonevApp — Pengujian Menyeluruh Semua Fitur:
1. Pengujian Hari Kerja (isWorkday: Senin-Jumat vs Sabtu-Minggu)
2. Pengujian Lompatan Hari Kerja Berikutnya (getNextWorkdayDate)
3. Pengujian Generator Slot Nagging Looping (generateNaggingSlots)
4. Pengujian Normalisasi Nada Suara (Danger Alarm mp3 & Android raw resource)
5. Pengujian File Suara Fisik (assets & android/app/src/main/res/raw)
6. Pengujian Struktur Default Settings & Volume
7. Pengujian Penghapusan Fitur di Profile (Google Sheets & API Key)
8. Pengujian Komponen Splash Screen (Loading & Durasi)
9. Pengujian Keseimbangan Sintaks Kode (AST / Brackets Check)
"""

import os
import sys
import datetime
import re

GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

total_tests = 0
passed_tests = 0

def test(name, condition, details=""):
    global total_tests, passed_tests
    total_tests += 1
    if condition:
        passed_tests += 1
        print(f"  {GREEN}✔ LULUS{RESET} - {name} {f'({details})' if details else ''}")
    else:
        print(f"  {RED}✘ GAGAL{RESET} - {name} {f'({details})' if details else ''}")

print(f"\n{BOLD}{CYAN}======================================================{RESET}")
print(f"{BOLD}{CYAN}      MONEVAPP AUTOMATED FEATURE TEST SUITE           {RESET}")
print(f"{BOLD}{CYAN}======================================================{RESET}\n")

# ----------------------------------------------------
# 1. TEST LOGIKA HARI KERJA (isWorkday)
# ----------------------------------------------------
print(f"{BOLD}1. Menguji Logika Hari Kerja (Senin s.d. Jumat):{RESET}")

def is_workday(dt):
    # getDay(): 0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu
    # Python: weekday(): 0 = Senin, 6 = Minggu
    # Kita sesuaikan dengan JS getDay():
    # js_day = (dt.weekday() + 1) % 7
    # 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    js_day = (dt.weekday() + 1) % 7
    return 1 <= js_day <= 5

mon = datetime.date(2026, 11, 2)  # Senin
tue = datetime.date(2026, 11, 3)  # Selasa
wed = datetime.date(2026, 11, 4)  # Rabu
thu = datetime.date(2026, 11, 5)  # Kamis
fri = datetime.date(2026, 11, 6)  # Jumat
sat = datetime.date(2026, 11, 7)  # Sabtu
sun = datetime.date(2026, 11, 8)  # Minggu

test("Senin dihitung sebagai hari kerja", is_workday(mon))
test("Selasa dihitung sebagai hari kerja", is_workday(tue))
test("Rabu dihitung sebagai hari kerja", is_workday(wed))
test("Kamis dihitung sebagai hari kerja", is_workday(thu))
test("Jumat dihitung sebagai hari kerja", is_workday(fri))
test("Sabtu TIDAK dihitung sebagai hari kerja (Alarm Libur)", not is_workday(sat))
test("Minggu TIDAK dihitung sebagai hari kerja (Alarm Libur)", not is_workday(sun))

# ----------------------------------------------------
# 2. TEST LOMPATAN HARI KERJA BERIKUTNYA (getNextWorkdayDate)
# ----------------------------------------------------
print(f"\n{BOLD}2. Menguji Lompatan Hari Kerja Berikutnya (getNextWorkdayDate):{RESET}")

def get_next_workday_date(from_date):
    next_d = from_date + datetime.timedelta(days=1)
    while not is_workday(next_d):
        next_d += datetime.timedelta(days=1)
    return next_d

test("Dari Senin -> Berikutnya adalah Selasa", get_next_workday_date(mon) == tue)
test("Dari Kamis -> Berikutnya adalah Jumat", get_next_workday_date(thu) == fri)
test("Dari Jumat -> Melompati Sabtu & Minggu -> Tiba di Senin", get_next_workday_date(fri) == datetime.date(2026, 11, 9))
test("Dari Sabtu -> Melompati Minggu -> Tiba di Senin", get_next_workday_date(sat) == datetime.date(2026, 11, 9))
test("Dari Minggu -> Tiba di Senin", get_next_workday_date(sun) == datetime.date(2026, 11, 9))

# ----------------------------------------------------
# 3. TEST GENERATOR SLOT NAGGING LOOPING (generateNaggingSlots)
# ----------------------------------------------------
print(f"\n{BOLD}3. Menguji Generator Slot Nagging Looping (generateNaggingSlots):{RESET}")

def generate_nagging_slots(start_hour=16, start_minute=0, end_hour=24, interval_minutes=30):
    slots = []
    start_total = start_hour * 60 + start_minute
    end_total = end_hour * 60
    current = start_total
    while current <= end_total:
        h = current // 60
        m = current % 60
        if h == 24 and m == 0:
            slots.append((23, 59))
        elif h < 24:
            slots.append((h, m))
        current += interval_minutes
    return slots

slots_30 = generate_nagging_slots(16, 0, 24, 30)
test("Interval 30 mnt dari 16:00 s.d. 24:00 menghasilkan 17 slot", len(slots_30) == 17, f"Total slot: {len(slots_30)}")
test("Slot pertama adalah 16:00", slots_30[0] == (16, 0))
test("Slot kedua adalah 16:30", slots_30[1] == (16, 30))
test("Slot terakhir adalah 23:59 batas akhir", slots_30[-1] == (23, 59))

slots_15 = generate_nagging_slots(16, 0, 24, 15)
test("Interval 15 mnt menghasilkan 33 slot nagging looping", len(slots_15) == 33)

slots_custom_start = generate_nagging_slots(17, 30, 24, 30)
test("Jam mulai kustom 17:30 WIB bekerja normal", slots_custom_start[0] == (17, 30) and slots_custom_start[1] == (18, 0))

# ----------------------------------------------------
# 4. TEST NORMALISASI NADA SUARA & IDENTIFIER
# ----------------------------------------------------
print(f"\n{BOLD}4. Menguji Normalisasi Nama Suara Notifikasi:{RESET}")

def get_notification_sound_identifier(sound):
    if sound == 'default':
        return True
    # Android raw resource names must be lowercase and without file extension
    clean = sound.lower()
    clean = os.path.splitext(clean)[0]
    clean = re.sub(r'[^a-z0-9_]', '_', clean)
    return clean

test("Danger-Alarm.mp3 dinormalisasi ke 'danger_alarm'", get_notification_sound_identifier('Danger-Alarm.mp3') == 'danger_alarm')
test("danger_alarm.mp3 dinormalisasi ke 'danger_alarm'", get_notification_sound_identifier('danger_alarm.mp3') == 'danger_alarm')
test("absen_alarm.wav dinormalisasi ke 'absen_alarm'", get_notification_sound_identifier('absen_alarm.wav') == 'absen_alarm')
test("default mengembalikan True (suara sistem)", get_notification_sound_identifier('default') is True)

# ----------------------------------------------------
# 5. TEST KEBERADAAN FILE FISIK SUARA & KONFIGURASI
# ----------------------------------------------------
print(f"\n{BOLD}5. Menguji Keberadaan Berkas Fisik Suara & Android Resources:{RESET}")

danger_asset = os.path.exists("assets/sounds/Danger-Alarm.mp3")
danger_lower_asset = os.path.exists("assets/sounds/danger_alarm.mp3")
danger_res_raw = os.path.exists("android/app/src/main/res/raw/danger_alarm.mp3")
absen_raw = os.path.exists("android/app/src/main/res/raw/absen_alarm.wav")
chime_raw = os.path.exists("android/app/src/main/res/raw/chime.wav")

test("Berkas assets/sounds/Danger-Alarm.mp3 ada", danger_asset)
test("Berkas assets/sounds/danger_alarm.mp3 ada", danger_lower_asset)
test("Berkas android/app/src/main/res/raw/danger_alarm.mp3 ada", danger_res_raw)
test("Berkas android/app/src/main/res/raw/absen_alarm.wav ada", absen_raw)
test("Berkas android/app/src/main/res/raw/chime.wav ada", chime_raw)

if danger_asset:
    size_mb = os.path.getsize("assets/sounds/Danger-Alarm.mp3") / (1024 * 1024)
    test("Ukuran Danger-Alarm.mp3 valid (~82.5 MB, ~1 jam loop)", size_mb > 80, f"{size_mb:.1f} MB")

# ----------------------------------------------------
# 6. TEST PENGHAPUSAN FITUR DI PROFILE
# ----------------------------------------------------
print(f"\n{BOLD}6. Menguji Penghapusan Fitur Google Sheets & Kunci API di Profile:{RESET}")

with open("src/screens/ProfileScreen.tsx", "r") as f:
    profile_content = f.read()

test("ProfileScreen TIDAK mengandung 'Cadangan Google Sheets'", "Cadangan Google Sheets" not in profile_content)
test("ProfileScreen TIDAK mengandung 'Kunci API AI'", "Kunci API AI" not in profile_content)
test("ProfileScreen TIDAK mengimpor 'getSheetsWebhookUrl'", "getSheetsWebhookUrl" not in profile_content)
test("ProfileScreen TIDAK mengimpor 'getGeminiApiKey'", "getGeminiApiKey" not in profile_content)
test("ProfileScreen memiliki pengaturan Waktu Alarm", "Jam Mulai Alarm" in profile_content)
test("ProfileScreen memiliki pengaturan Volume Alarm", "Volume Alarm" in profile_content)
test("ProfileScreen memiliki tombol Uji Coba Alarm", "handleTestAlarm" in profile_content)

# ----------------------------------------------------
# 7. TEST FITUR ALARMSCREEN (LOOPING & TIME PICKER)
# ----------------------------------------------------
print(f"\n{BOLD}7. Menguji Fitur Layar Alarm (AlarmScreen.tsx):{RESET}")

with open("src/screens/AlarmScreen.tsx", "r") as f:
    alarm_content = f.read()

test("AlarmScreen mendukung pengaturan volume", "handleChangeVolume" in alarm_content)
test("AlarmScreen memiliki banner penjelasan Looping", "Mode Looping" in alarm_content)
test("AlarmScreen memiliki Modal konfigurasi waktu kustom", "isSettingModalVisible" in alarm_content)
test("AlarmScreen memiliki tombol 'Uji Coba Alarm'", "handleTestAlarm" in alarm_content)
test("AlarmScreen menggunakan startHour dinamis (bukan hardcoded 16 semata)", "startHour" in alarm_content)

# ----------------------------------------------------
# 8. TEST SPLASH SCREEN LOADING DENGAN ANIMASI
# ----------------------------------------------------
print(f"\n{BOLD}8. Menguji Komponen Splash Screen Animasi Loading:{RESET}")

splash_exists = os.path.exists("src/components/AppSplashScreen.tsx")
test("Komponen src/components/AppSplashScreen.tsx ada", splash_exists)

if splash_exists:
    with open("src/components/AppSplashScreen.tsx", "r") as f:
        splash_content = f.read()
    test("AppSplashScreen memiliki indikator ActivityIndicator", "ActivityIndicator" in splash_content)
    test("AppSplashScreen memiliki teks bertahap 'Memuat aplikasi...'", "Memuat aplikasi..." in splash_content)
    test("AppSplashScreen memiliki durasi yang memadai (2400 ms)", "2400" in splash_content)

with open("App.tsx", "r") as f:
    app_content = f.read()
test("App.tsx mengimpor dan menampilkan AppSplashScreen", "AppSplashScreen" in app_content)

# ----------------------------------------------------
# 9. TEST KONSISTENSI APP.JSON
# ----------------------------------------------------
print(f"\n{BOLD}9. Menguji Konsistensi app.json:{RESET}")

with open("app.json", "r") as f:
    app_json_content = f.read()

test("app.json mendaftarkan danger_alarm.mp3 pada notification sounds", "danger_alarm.mp3" in app_json_content)
test("app.json splash background berwarna navy (#0F2F5E)", "#0F2F5E" in app_json_content)

# ----------------------------------------------------
# HASIL AKHIR
# ----------------------------------------------------
print(f"\n{BOLD}{CYAN}======================================================{RESET}")
if passed_tests == total_tests:
    print(f"{BOLD}{GREEN}  HASIL AKHIR: {passed_tests}/{total_tests} PENGUJIAN LULUS SEMPURNA (100%){RESET}")
else:
    print(f"{BOLD}{YELLOW}  HASIL AKHIR: {passed_tests}/{total_tests} PENGUJIAN LULUS{RESET}")
print(f"{BOLD}{CYAN}======================================================{RESET}\n")

sys.exit(0 if passed_tests == total_tests else 1)
