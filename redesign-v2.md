# MonevApp — Redesign v2 Specification: PRD & Design System

> **Dokumen Gabungan: Product Requirements Document (PRD) & Design Specification v2**  
> **Tema Desain:** "Sistem Dinas Digital" (Identitas Kemnaker: Biru Institusional `#14407F` & Kuning Emas `#F2A900`)  
> **Platform:** Mobile App (React Native / Expo SDK 57 — iOS & Android)  
> **Status:** Definitive Reference Document (Menggabungkan `PRD/uiux.md`, `PRD/design.md`, `PRD/prd_fitur_alarm_absen.md`, dan `PRD/refactor.md`)

---

## DAFTAR ISI

1. [Ringkasan Eksekutif & Identitas Produk](#1-ringkasan-eksekutif--identitas-produk)
2. [Spesifikasi Kebutuhan Produk (PRD)](#2-spesifikasi-kebutuhan-produk-prd)
   - [2.1 Alur Utama & Pengalaman Pengguna (Core User Flow)](#21-alur-utama--pengalaman-pengguna-core-user-flow)
   - [2.2 Fitur 1: Smart Hybrid Fallback Engine](#22-fitur-1-smart-hybrid-fallback-engine)
   - [2.3 Fitur 2: Format Laporan & Verifikasi Syarat Minimum Karakter](#23-fitur-2-format-laporan--verifikasi-syarat-minimum-karakter)
   - [2.4 Fitur 3: Smart Attendance Alarm (Pengingat Absen Latar Belakang)](#24-fitur-3-smart-attendance-alarm-pengingat-absen-latar-belakang)
   - [2.5 Fitur 4: Pintasan Portal Monev Kemnaker](#25-fitur-4-pintasan-portal-monev-kemnaker)
   - [2.6 Fitur 5: Checklist Harian Magang](#26-fitur-5-checklist-harian-magang)
   - [2.7 Fitur 6: Offline-First Storage & Google Sheets Backup](#27-fitur-6-offline-first-storage--google-sheets-backup)
3. [Arsitektur Teknis & Model Data](#3-arsitektur-teknis--model-data)
   - [3.1 Model Data TypeScript](#31-model-data-typescript)
   - [3.2 Struktur Proyek Terkini](#32-struktur-proyek-terkini)
4. [Sistem Desain Visual (Design Spec v2)](#4-sistem-desain-visual-design-spec-v2)
   - [4.1 Filosofi Visual & Hal yang Dilarang Keras](#41-filosofi-visual--hal-yang-dilarang-keras)
   - [4.2 Sistem Warna & Token (Light & Dark Mode)](#42-sistem-warna--token-light--dark-mode)
   - [4.3 Sistem Tipografi](#43-sistem-tipografi)
   - [4.4 Grid, Spacing, Radius & Elevasi](#44-grid-spacing-radius--elevasi)
   - [4.5 Ikonografi](#45-ikonografi)
   - [4.6 Spesifikasi Komponen UI Kunci](#46-spesifikasi-komponen-ui-kunci)
   - [4.7 Motion & Transisi Mikro](#47-motion--transisi-mikro)
5. [Arsitektur Layar & Wireframe UI](#5-arsitektur-layar--wireframe-ui)
   - [5.1 Layar Hari Ini (State Kosong / Input)](#51-layar-hari-ini-state-kosong--input)
   - [5.2 Layar Memproses (State Loading Flat)](#52-layar-memproses-state-loading-flat)
   - [5.3 Layar Hasil Laporan](#53-layar-hasil-laporan)
   - [5.4 Layar Riwayat & Detail](#54-layar-riwayat--detail)
   - [5.5 Layar Pengaturan](#55-layar-pengaturan)
6. [Panduan Microcopy, Pesan Error & Kasus Khusus (Edge Cases)](#6-panduan-microcopy-pesan-error--kasus-khusus-edge-cases)
7. [Standar Aksesibilitas (WCAG Compliance)](#7-standar-aksesibilitas-wcag-compliance)
8. [Kriteria Keberhasilan (Acceptance Criteria) & Verifikasi](#8-kriteria-keberhasilan-acceptance-criteria--verifikasi)

---

## 1. Ringkasan Eksekutif & Identitas Produk

### 1.1 Latar Belakang Masalah
Peserta program Magang Kementerian Ketenagakerjaan RI (Kemnaker) yang menggunakan platform **MagangHub / SIAPkerja** diwajibkan menyusun laporan aktivitas harian (logbook) yang mencakup 3 aspek wajib:
1. **Uraian Aktivitas** (kegiatan teknis/non-teknis harian)
2. **Pembelajaran** (insight, keterampilan, atau pengetahuan baru)
3. **Kendala** (hambatan yang dihadapi dan solusinya)

Setiap bagian wajib memenuhi ambang batas minimum karakter (standar 100 karakter). Selain itu, peserta wajib melakukan presensi harian sore sebelum batas waktu pukul **23:59 WIB**.

Di lapangan, peserta sering menghadapi kendala:
- Kelelahan mental setelah jam kerja sehingga kesulitan merangkai kalimat formal dan komprehensif.
- Kuota / rate limit API AI (HTTP 429) pada asisten online umum.
- Lupa melakukan presensi kepulangan magang.
- Gesekan kognitif (*friction*) karena harus berpindah aplikasi, membuka browser, mengetik tautan, login, lalu menyalin-tempel per bagian satu per satu.

### 1.2 Nilai Utama & Solusi MonevApp
**MonevApp** hadir sebagai asisten cerdas terpadu berbasis *mobile* dengan misi:
- Mengubah catatan mentah informal menjadi laporan magang baku dan formal dalam hitungan detik.
- Menyediakan mesin **Smart Hybrid Fallback** (Gemini AI $\to$ OpenRouter AI $\to$ Generator Template Lokal) agar pembuatan laporan **100% bebas hambatan (zero friction)** meski internet padam atau API terkena *rate limit*.
- Menyediakan pengingat absen pintar (*Smart Attendance Alarm*) dengan notifikasi latar belakang dan tombol cepat *"Sudah Absen"* tanpa perlu membuka aplikasi.
- Membuka portal resmi Monev Kemnaker langsung dari aplikasi dalam **satu ketukan**.
- Menjamin waktu dari buka aplikasi hingga laporan tertempel di portal **kurang dari 30 detik**.

---

## 2. Spesifikasi Kebutuhan Produk (PRD)

### 2.1 Alur Utama & Pengalaman Pengguna (Core User Flow)

```text
┌────────────────────────┐
│  Ketik Catatan Mentah  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Eksekusi Pemrosesan   │───────► [ AI Gemini / OpenRouter ]
│ (Smart Hybrid Fallback)│              │ (Jika Error 429 / Offline)
└───────────┬────────────┘              ▼
            │               [ Smart Local Generator (<100ms) ]
            ▼
┌────────────────────────┐
│  Tinjau Hasil Laporan  │
│  - Uraian Aktivitas    │  ◄── Verifikasi Karakter (≥ 100 char)
│  - Pembelajaran        │
│  - Kendala             │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   Salin Satu Ketukan   │  (Salin Per Bagian / Salin Semua)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Tombol "Buka Monev"   │───────► [ Browser Perangkat: Portal Monev ]
└────────────────────────┘              │ (Login SIAPkerja, Tempel & Absen)
                                        ▼
                            [ Kembali: Tandai Checklist Selesai ]
```

---

### 2.2 Fitur 1: Smart Hybrid Fallback Engine

Sistem mengimplementasikan strategi *fail-safe multi-tier* untuk menjamin pengguna **selalu menerima hasil laporan tanpa pernah melihat layar error**:

1. **Tier 1 — Google Gemini API (Primer):**
   - Mengambil model Gemini aktif secara dinamis (`v1beta/models`), memprioritaskan varian *flash* (misal: `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`).
   - Dilengkapi sistem cache daftar model selama 24 jam di `AsyncStorage`.
   - Menggunakan konfigurasi `responseMimeType: "application/json"`, temperatur $0.7$, dan *system prompt* bahasa Indonesia formal institusional.
   - Mekanisme *retry* internal hingga 2 kali dengan jeda eksponensial saat menerima kode status HTTP 429.

2. **Tier 2 — OpenRouter API (Cadangan Cloud):**
   - Jika seluruh kandidat model Gemini gagal atau kuota habis, sistem otomatis mencoba model gratis OpenRouter (misal: `meta-llama/llama-3.3-70b-instruct:free`, `google/gemma-3-27b-it:free`).

3. **Tier 3 — Smart Local Template Generator (Penyelamat Terakhir):**
   - Jika kedua API cloud gagal, terjadi gangguan jaringan, atau mode pesawat aktif, sistem **secara instan (<100 ms)** mengeksekusi modul `localTemplate.ts`.
   - Memilih variasi template kontekstual dari `src/data/reportTemplates.json` berdasarkan kata kunci aktivitas pengguna (desain, coding, meeting, dokumentasi, riset, dll.).
   - Hasil laporan tetap kaya, baku, dan memenuhi standar struktur 3 bagian Kemnaker.
   - Tampil *Toast* halus tanpa nada panik: *"Memakai mode offline. Laporan dibuat dari template lokal."*

---

### 2.3 Fitur 2: Format Laporan & Verifikasi Syarat Minimum Karakter

Sesuai ketentuan Kemnaker, laporan harus terdiri dari 3 seksi:
1. **Uraian Aktivitas (U):** Menjelaskan tindakan nyata, tools yang digunakan, dan output yang dihasilkan.
2. **Pembelajaran (P):** Menjelaskan wawasan baru (hard skills/soft skills) yang diperoleh selama aktivitas.
3. **Kendala (K):** Menjelaskan kendala teknis atau koordinasi. Jika pengguna tidak menyebutkan kendala pada input, sistem otomatis mengisi dengan teks baku:  
   `"Tidak terdapat kendala berarti selama pelaksanaan kegiatan, seluruh proses berjalan lancar dan sesuai target."`

#### Penghitung Syarat Minimum Karakter (`MIN_SECTION_CHARS = 100`)
- Setiap seksi memiliki indikator jumlah karakter dengan font monospaced.
- Jika karakter $\ge 100$: Chip berlatar `success-tint`, teks/ikon `success` (*"132 karakter, syarat terpenuhi"* dengan ikon centang).
- Jika karakter $< 100$: Chip berlatar `warn-tint`, teks/ikon `warn` (*"84 karakter, kurang 16"* dengan ikon alert).
- Fitur ini memberikan jaminan psikologis bagi peserta magang sebelum menempelkan laporan ke formulir resmi portal.

---

### 2.4 Fitur 3: Smart Attendance Alarm (Pengingat Absen Latar Belakang)

Pengingat agresif namun terukur untuk memastikan peserta magang tidak kehilangan hak kehadiran kerja:

1. **Jadwal & Nagging Mode:**
   - Mulai aktif pukul **16:00 WIB** (jam pulang kerja standar).
   - Berulang setiap interval yang ditentukan (default: **30 menit**) hingga pukul **24:00 WIB** selama pengguna belum melakukan konfirmasi kehadiran.
   - Reset otomatis setiap pergantian tanggal (00:00).

2. **Eksekusi Latar Belakang (Background Task):**
   - Menggunakan `expo-notifications` dan `expo-task-manager` (`BACKGROUND_ATTENDANCE_TASK`).
   - Beroperasi penuh bahkan saat aplikasi di-*kill* atau *swiped away*.
   - Tidak menggunakan *background fetch loop* yang memboroskan baterai; murni mengandalkan penjadwalan *local notification triggers*.

3. **Tombol Cepat "Sudah Absen" (Zero-Friction UX):**
   - Notifikasi menyertakan *action button*: ` Sudah Absen`.
   - Konfigurasi `opensAppToForeground: false` memungkinkan eksekusi langsung di latar belakang: membatalkan seluruh sisa antrean alarm hari itu dan menyimpan status kehadiran hari ini ke `AsyncStorage`.

4. **Kustomisasi Nada Dering:**
   - Opsi suara yang dibundel:
     - `absen_alarm.wav`: Nada dering kustom Monev (4 nada tegas).
     - `chime.wav`: Melodic chime santai.
     - `default`: Nada sistem standar.
   - Pada Android, sistem otomatis membuat *Notification Channel* dengan level `IMPORTANCE_HIGH` agar suara dapat berbunyi nyaring dan konsisten.

---

### 2.5 Fitur 4: Pintasan Portal Monev Kemnaker

Menghubungkan aplikasi langsung ke portal resmi tanpa perlu mencari *bookmark* browser:

1. **Alamat Portal:**
   - **Default:** `https://monev.maganghub.kemnaker.go.id` (didefinisikan di `src/config/links.ts`).
   - Dapat diubah mandiri oleh pengguna melalui menu Pengaturan. Validasi wajib berawalan `https://`.
   - Tombol *“Kembalikan ke Default”* tersedia untuk mereset URL.

2. **Titik Akses di Antarmuka:**
   - **Header Semua Layar:** Tombol ikon `external-link` + teks `"Monev"` di pojok kanan atas (tap target 44px).
   - **Layar Hari Ini:** Komponen `MonevLinkBar` dengan aksen border `gold` dan latar `gold-tint` di atas tombol utama.
   - **Layar Hasil:** Tombol primer layar dialihkan menjadi **"Buka Monev"** (dengan ikon eksternal), mendorong alur natural: *Generate $\to$ Salin $\to$ Buka Monev $\to$ Tempel*.
   - **Layar Riwayat (Detail):** Tombol aksi sekunder *"Buka Monev"*.
   - **Pengaturan:** Baris manajemen portal dan uji coba pembukaan tautan.

3. **Perilaku & Fallback:**
   - Membuka browser bawaan sistem (`Linking.openURL`), bukan *WebView* internal, agar sesi login SIAPkerja, password manager, dan autofill perangkat dapat dimanfaatkan langsung.
   - Jika browser gagal dibuka, alamat otomatis disalin ke *clipboard* dan aplikasi menampilkan toast error:  
     *"Tidak bisa membuka browser. Tautan sudah disalin, tempel di browser."*
   - Aplikasi tidak pernah meminta, menyimpan, atau mengirim kata sandi SIAPkerja pengguna.

---

### 2.6 Fitur 5: Checklist Harian Magang

Komponen pemantau status harian di layar beranda:
- Dua baris pemantau: **Absen Sore** dan **Laporan Harian**.
- Dilengkapi penanda tenggat waktu mono: `"Batas 23.59 WIB"`.
- Menandai item Absen selesai secara otomatis membatalkan alarm pengingat hari itu.
- Menandai item Laporan selesai saat pengguna kembali dari tombol "Buka Monev" atau ditekan manual.
- Menyertakan disclaimer: *"Penanda ini hanya di aplikasi, bukan status resmi portal."*

---

### 2.7 Fitur 6: Offline-First Storage & Google Sheets Backup

1. **Penyimpanan Lokal:**
   - Seluruh riwayat laporan disimpan di `@react-native-async-storage/async-storage` di bawah kunci `@monev_reports`.
   - Akses instan tanpa jeda koneksi data.

2. **Pencadangan Asinkron ke Google Sheets:**
   - Terhubung melalui Webhook Google Apps Script (`Code.gs`) yang di-deploy sebagai Web App.
   - Setiap kali laporan selesai dibuat, sistem mengirim payload JSON secara asinkron (*background sync*).
   - Jika cadangan gagal (misal tidak ada sinyal internet), data lokal tetap aman dan status ditandai dengan chip peringatan *"Gagal disimpan"* disertai tombol *"Coba lagi"*.

---

## 3. Arsitektur Teknis & Model Data

### 3.1 Model Data TypeScript

```typescript
// src/types/index.ts

export interface Report {
  id: string;               // UUID / timestamp unik
  date: string;             // Format YYYY-MM-DD
  rawInput: string;         // Catatan asli dari pengguna
  activity: string;         // Uraian Aktivitas (U)
  learning: string;         // Pembelajaran (P)
  obstacle: string;         // Kendala (K)
  createdAt: string;        // ISO 8601 Timestamp
}

export interface AiResponse {
  activity: string;
  learning: string;
  obstacle: string;
}

export type AlarmSoundOption = 'absen_alarm.wav' | 'chime.wav' | 'default';

export interface AlarmSoundItem {
  id: AlarmSoundOption;
  label: string;
  description: string;
}

export interface AlarmSettings {
  isEnabled: boolean;       // Status alarm aktif/nonaktif
  startHour: number;        // Default: 16 (16:00 WIB)
  startMinute: number;      // Default: 0
  endHour: number;          // Default: 24 (24:00 WIB)
  intervalMinutes: number;  // Default: 30 menit
  sound: AlarmSoundOption;  // Berkas audio terpilih
}

export interface AttendanceStatus {
  date: string;             // YYYY-MM-DD
  isConfirmed: boolean;     // Status sudah absen
  confirmedAt?: string;     // Waktu konfirmasi ISO 8601
  source?: 'notification_action' | 'manual_button' | 'logbook_submit';
}
```

---

### 3.2 Struktur Proyek Terkini

```text
monevApp/
├── App.tsx                     # Entrypoint, Bottom Tab Navigation & Notification Listener
├── app.json                    # Konfigurasi Expo SDK 57
├── package.json                # Dependensi proyek
├── tsconfig.json               # Konfigurasi TypeScript
├── redesign-v2.md              # [DOKUMEN INI] Master PRD & Design System
├── PRD/
│   ├── design.md               # Arsip referensi visual v2
│   ├── uiux.md                 # Arsip PRD v1
│   ├── prd_fitur_alarm_absen.md# Arsip PRD alarm
│   └── refactor.md             # Arsip PRD refactor
├── assets/
│   ├── sounds/
│   │   ├── absen_alarm.wav     # Audio kustom 4-nada tegas
│   │   └── chime.wav           # Audio kustom lembut
│   ├── icon.png
│   ├── splash-icon.png
│   └── logo.jpg
├── google-apps-script/
│   └── Code.gs                 # Webhook Apps Script untuk Google Sheets Sync
└── src/
    ├── screens/
    │   ├── HomeScreen.tsx      # Layar Beranda: Checklist, Input Catatan & Hasil Laporan
    │   ├── HistoryScreen.tsx   # Layar Riwayat: Kartu logbook tersimpan & detail salin
    │   └── SettingsScreen.tsx  # Layar Pengaturan: Alarm, Webhook Sheets, URL Monev, Tema
    ├── components/
    │   ├── MonevHeaderButton.tsx # Tombol eksternal Monev di header
    │   └── MonevLinkBar.tsx      # Bar tautan berbingkai emas ke portal Monev
    ├── config/
    │   └── links.ts            # Manajemen URL Monev & helper Linking
    ├── data/
    │   └── reportTemplates.json # Bank template Smart Local Fallback
    ├── services/
    │   ├── ai.ts               # Google Gemini & OpenRouter API client
    │   ├── alarm.ts            # Alarm scheduling & background task management
    │   ├── localTemplate.ts    # Mesin peracik template lokal
    │   ├── sheets.ts           # Pengirim payload cadangan ke Google Sheets
    │   └── storage.ts          # Abstraksi CRUD AsyncStorage
    ├── theme/
    │   ├── colors.ts           # Token warna sistem (Kemnaker Light & Dark)
    │   └── typography.ts       # Definisi skala font IBM Plex
    └── types/
        └── index.ts            # Interface & Types TypeScript
```

---

## 4. Sistem Desain Visual (Design Spec v2)

### 4.1 Filosofi Visual & Hal yang Dilarang Keras

Tema desain resmi MonevApp v2 adalah **"Sistem Dinas Digital"**. Tujuannya adalah menciptakan kesinambungan visual antara aplikasi mobile MonevApp dan portal resmi Kemnaker/MagangHub sehingga pengguna merasa berada di dalam ekosistem dinas yang terpercaya, lugas, dan fungsional.

#### Aturan Keras (Strict Rules):
1. **Zero Gradient:** Tidak ada gradient di mana pun (header, tombol, kartu, chip, ikon, splash screen, background, atau shimmer bar). Semua warna berwujud **flat solid**.
2. **Tanpa Warna Bawaan Framework:** Dilarang menggunakan warna *Tailwind Slate/Blue/Emerald*, iOS System Blue (`#007AFF`), atau Material Purple (`#6200EE`). Seluruh komponen **wajib** mengambil nilai dari token `src/theme/colors.ts`.
3. **Tanpa Opacity Berlapis:** Hindari penggunaan `rgba` bertumpuk untuk membuat nuansa sekunder. Gunakan token `tint` solid yang sudah didefinisikan secara matematis.
4. **Satu Aksi Primer per Layar:** Dalam satu tampilan viewport, hanya boleh ada **satu tombol primer** dengan bobot visual tertinggi.
5. **Status Terbaca Sekilas:** Status tidak boleh hanya dinyatakan oleh warna. Wajib kombinasi: **Warna Solid + Ikon + Teks Keterangan**.
6. **Bebas Elemen Dekoratif Non-Fungsional:** Setiap garis batas (*rule*) dan kotak harus merepresentasikan hierarki konten nyata.
7. **Tanpa Emoji Fungsional:** Dilarang memakai emoji (🟡, ✅, ⚠️, ❌) sebagai ikon toast, tombol, atau indikator status. Gunakan ikon vektor **Lucide** dengan garis tegas (*stroke 1.75*).

---

### 4.2 Sistem Warna & Token (Light & Dark Mode)

#### 4.2.1 Token Mode Terang (Default)

| Nama Token | Kode Hex | Peran & Penggunaan UI |
|---|---|---|
| `paper` | `#F3F5F9` | Latar belakang dasar layar (putih kebiruan dingin, sejuk di mata). |
| `paperRaised` | `#FFFFFF` | Permukaan kartu, form input, dan kontainer hasil di atas `paper`. |
| `ink` | `#0F1B2D` | Teks judul utama, isi paragraf primer (biru-hitam dinas). |
| `inkSoft` | `#4A5A70` | Teks sekunder, label pembantu, placeholder, teks tanggal. |
| `rule` | `#D3DAE6` | Garis pembatas tipis 1px (pengganti drop-shadow dekoratif). |
| `action` | `#14407F` | **Biru Kemnaker.** Header utama, tombol primer, tab aktif, ikon fokus. |
| `actionPress` | `#0D2F5F` | State tertekan untuk elemen `action`. |
| `actionTint` | `#E2EAF6` | Latar solid untuk item terpilih atau informasi netral. |
| `gold` | `#F2A900` | **Kuning Emas Kemnaker.** Garis identitas header (3px), border bar Monev. |
| `goldTint` | `#FCF0CC` | Latar solid permukaan bar tautan Portal Monev. |
| `success` | `#1E7A4C` | Status berhasil (tersalin, tersimpan, karakter $\ge 100$). |
| `successTint` | `#E1F1E8` | Latar solid chip status berhasil. |
| `warn` | `#9A5B00` | Status menunggu, offline mode, karakter $< 100$. |
| `warnTint` | `#F6E9D2` | Latar solid chip status peringatan. |
| `error` | `#B3261E` | Status gagal jaringan, error sistem, batas karakter minus. |
| `errorTint` | `#F7E1DF` | Latar solid chip status gagal. |
| `onAction` | `#FFFFFF` | Teks dan ikon di atas permukaan warna `action`. |
| `focusRing` | `#14407F` | Outline fokus aksesibilitas. |

#### 4.2.2 Token Mode Gelap (Dark Mode)

Mode gelap dirancang bukan sebagai pembalik warna murni (*color inversion*), melainkan dengan palet biru-malam dinas yang mempertahankan kontras tinggi:

| Nama Token | Kode Hex | Peran & Penggunaan UI |
|---|---|---|
| `paper` | `#0C1522` | Latar belakang layar gelap. |
| `paperRaised` | `#142033` | Permukaan kartu dan form input gelap. |
| `ink` | `#E8EDF5` | Teks utama putih terang beraksen sejuk. |
| `inkSoft` | `#9AA9BD` | Teks sekunder dan placeholder. |
| `rule` | `#243449` | Garis pembatas gelap. |
| `action` | `#7FAEF0` | Biru terang kontras tinggi untuk tombol dan tab aktif. |
| `actionPress` | `#5E93DE` | State tertekan elemen `action` mode gelap. |
| `actionTint` | `#1B2D47` | Latar elemen terpilih mode gelap. |
| `gold` | `#F5B82E` | Kuning emas terang mode gelap. |
| `goldTint` | `#3A3016` | Latar bar Monev mode gelap. |
| `success` | `#5CC48A` | Hijau status berhasil mode gelap. |
| `successTint` | `#163326` | Latar chip sukses mode gelap. |
| `warn` | `#E0A040` | Kuning-oranye peringatan mode gelap. |
| `warnTint` | `#3A2C14` | Latar chip peringatan mode gelap. |
| `error` | `#F08A80` | Merah status gagal mode gelap. |
| `errorTint` | `#3C1B18` | Latar chip error mode gelap. |
| `onAction` | `#0C1522` | Teks di atas tombol `action` mode gelap memakai warna gelap. |
| `focusRing` | `#7FAEF0` | Outline fokus mode gelap. |

#### 4.2.3 Verifikasi Rasio Kontras WCAG

Semua kombinasi warna memenuhi standar minimum **WCAG AA** ($4.5:1$ untuk teks normal, $3:1$ untuk teks besar), dan teks inti memenuhi **WCAG AAA**:
- `ink` di atas `paper`: $\approx 16:1$ (**Lulus AAA**)
- `onAction` (putih) di atas `action`: $\approx 9.9:1$ (**Lulus AAA**)
- `ink` di atas `gold`: $\approx 8.7:1$ (**Lulus AAA**)
- `inkSoft` di atas `paper`: $\approx 6.5:1$ (**Lulus AA**)
- Teks di atas permukaan `gold` **wajib** memakai `ink` (dilarang menggunakan warna putih karena kontras tidak memadai).

---

### 4.3 Sistem Tipografi

Menggunakan satu keluarga huruf resmi untuk mempertahankan kesan formal dokumen dinas:
- **Font Utama (UI & Paragraf):** `IBM Plex Sans` (atau sistem *sans-serif* fallback: Roboto di Android, SF Pro di iOS).
- **Font Data & Metrik:** `IBM Plex Mono` (atau sistem *monospace* fallback) untuk tanggal, jam batas waktu, hitungan karakter, dan URL.

| Tingkatan (Level) | Ukuran / Line Height | Bobot (Weight) | Contoh Penggunaan |
|---|---|---|---|
| **Display** | 26px / 32px | 600 (SemiBold) | Judul utama layar ("Hari Ini", "Riwayat") |
| **Title** | 19px / 25px | 600 (SemiBold) | Judul seksi laporan ("Uraian Aktivitas") |
| **Body** | 16px / 24px | 400 (Regular) | Isi teks laporan, form input utama |
| **Body Small** | 14px / 20px | 400 (Regular) | Deskripsi pembantu, disclaimer |
| **Meta (Mono)** | 12.5px / 18px | 500 (Medium) | Jam batas (23:59 WIB), hitungan karakter (132 char) |
| **Label** | 13px / 18px | 600 (SemiBold) | Label tombol aksi, tab navigasi |

*Label tombol ditulis dengan Sentence case ("Salin semua", "Buat laporan"). Huruf kapital penuh (ALL CAPS) hanya digunakan untuk singkatan resmi (WIB, JSON, URL, UI/UX).*

---

### 4.4 Grid, Spacing, Radius & Elevasi

- **Sistem Grid & Spacing:** Berbasis kelipatan **4px** $\to$ `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`.
- **Margin Layar:** Konsisten **20px** kiri dan kanan pada seluruh tampilan.
- **Border Radius:**
  - Elemen sentuh/interaktif (tombol, input form, bar Monev): **8px**.
  - Permukaan kontainer statis (kartu hasil, panel checklist): **4px**.
  - Chip status: Pill bulat (*radius: 9999px*).
- **Elevasi & Bayangan:**
  - Tanpa drop-shadow dekoratif pada kartu. Pemisah antar-kontainer menggunakan garis `rule` 1px atau perbedaan bidang `paper` vs `paperRaised`.
  - Bayangan tipis halus (`elevation: 2`, `shadowColor: '#0F1B2D'`, `shadowOpacity: 0.08`, `shadowRadius: 4`) hanya diizinkan untuk *Toast notification* dan *bottom sheet*.
- **Zona Sentuh Minimum:** Setiap area interaktif memiliki target sentuh minimal **$44 \times 44\text{ px}$**.

---

### 4.5 Ikonografi

- Menggunakan pustaka resmi: `lucide-react-native`.
- Ketebalan garis standar: `strokeWidth={1.75}` dengan sudut tegas.
- Pewarnaan ikon:
  - Default non-aktif: `inkSoft`.
  - State aktif / brand: `action`.
  - State di atas tombol primer: `onAction`.
  - State di atas bar portal Monev: `ink`.
- Ikon utama yang digunakan: `Calendar`, `Clock`, `Settings`, `ExternalLink`, `Copy`, `Check`, `AlertTriangle`, `WifiOff`, `CheckCircle2`, `Trash2`, `Volume2`.

---

### 4.6 Spesifikasi Komponen UI Kunci

#### 1. Header Aplikasi & Bar Identitas Kemnaker
- Bar atas setinggi 56px dengan warna latar solid `action` (`#14407F`).
- Di sisi kiri: Judul aplikasi `"MonevApp"` atau judul layar bersangkutan.
- Di sisi kanan: Tombol pintasan `MonevHeaderButton` (ikon `ExternalLink` putih + teks `"Monev"`).
- Di tepi paling bawah header: **Garis kuning emas solid (`gold`) setinggi 3px** sebagai aksen identitas dinas Kemnaker.

#### 2. Tombol (Button System)
- **Primary Button:** Latar `action`, teks `onAction`, radius 8px, tinggi 48px. Efek ditekan berubah ke `actionPress` dan skala $98\%$.
- **Secondary Button:** Latar transparan, border 1px `rule`, teks `ink`.
- **Ghost Action:** Latar transparan, teks `action`, bobot semi-bold (misal tombol salin individual).
- **Danger Ghost:** Latar transparan, teks `error` (tombol "Coba lagi" atau "Hapus").

#### 3. Form Input Catatan Mentah
- Textarea multi-baris pada permukaan `paperRaised`.
- Border 1px `rule`, beralih ke 2px `focusRing` saat aktif mengetik.
- Di sudut kanan-bawah: Penghitung karakter mono (`0 / 500`).

#### 4. Kontainer Hasil Laporan (U / P / K)
- Struktur 3 panel bertingkat yang dipisahkan oleh garis batas `rule` 1px.
- Setiap seksi memiliki badge huruf solid di sebelah kiri (`action` solid dengan teks putih tebal: **U**, **P**, **K**).
- Bar "Salin Semua" berada di posisi atas kontainer hasil.
- Setiap entri memiliki tombol aksi cepat "Salin" individual. Saat ditekan, tombol bertransformasi menjadi label *"Tersalin"* dengan ikon centang selama 1.5 detik disertai getaran haptic ringan.

#### 5. Bar Portal Monev (`MonevLinkBar`)
- Kontainer setinggi minimal 56px dengan latar `goldTint` dan border 1px `gold`.
- Menampilkan teks judul `"Portal Monev"` (`ink` 16px font-semibold), URL mono (`inkSoft` 12.5px), dan ikon `ExternalLink`.
- Menjadi tombol pintasan tercepat untuk bertolak ke portal presensi.

#### 6. Bar Progres Flat (Flat Loading Indicator)
- Menggantikan *spinner* bulat atau *skeleton shimmer* gradasi.
- Baris linear setinggi 4px warna `action` di atas latar rel `actionTint`.
- Label progres dinamis di bawahnya: *"Menyusun laporan formal..."* $\to$ *"Memverifikasi struktur..."*.

---

### 4.7 Motion & Transisi Mikro

Aplikasi menganut prinsip *purposeful minimal motion*:
1. **Orkestrasi Kemunculan Laporan:** Ketika laporan selesai dibuat, ketiga seksi (U $\to$ P $\to$ K) muncul secara berjenjang (*staggered*) dengan jeda 80ms, pergerakan lembut fade-in 150ms dan skala dari $97\%$ ke $100\%$.
2. **Umpan Balik Salin:** Perubahan warna teks dan ikon salin instan dengan animasi transisi 100ms tanpa pop-up yang menutupi layar.
3. **Prefers-Reduced-Motion:** Jika fitur aksesibilitas pengurangan gerak aktif di sistem operasi pengguna, seluruh animasi skala dinonaktifkan dan digantikan dengan *instant cross-fade*.

---

## 5. Arsitektur Layar & Wireframe UI

### 5.1 Layar Hari Ini (State Kosong / Input)

```text
┌────────────────────────────────────────────────────────┐
│  MonevApp                                    Monev ↗   │  <- Header solid action (#14407F)
├════════════════════════════════════════════════════════┤  <- Garis aksen gold (3px)
│                                                        │
│  Selasa, 14 Oktober 2026                 (Paper #F3F5F9)
│                                                        │
│  Checklist Hari Ini                    Batas 23.59 WIB │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [ ] Absen Sore               (otomatis stop jam) │  │
│  │ [ ] Laporan Harian (Monev)                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Catatan Kegiatan Harian                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Tuliskan poin aktivitas magang hari ini...       │  │
│  │ - Mengerjakan API backend login                  │  │
│  │ - Diskusi teknis dengan mentor                   │  │
│  │                                                  │  │
│  │                                        128 / 500 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ↗ Portal Monev                                   │  │  <- MonevLinkBar (goldTint)
│  │   monev.maganghub.kemnaker.go.id                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                Buat Laporan                      │  │  <- Tombol Primer (action)
│  └──────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│   [📅 Hari Ini]         [🕒 Riwayat]      [⚙️ Pengaturan]│  <- Bottom Tab Bar
└────────────────────────────────────────────────────────┘
```

---

### 5.2 Layar Memproses (State Loading Flat)

```text
│  Catatan Kegiatan Harian                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ - Mengerjakan API backend login...                │  │  <- Input read-only saat memproses
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [====================              ]                  │  <- Flat Progress Bar (4px action)
│  Menyusun laporan dengan AI...                         │  <- Label status monospaced
│                                                        │
```

---

### 5.3 Layar Hasil Laporan

```text
┌────────────────────────────────────────────────────────┐
│  Hasil Laporan                               Monev ↗   │
├════════════════════════════════════════════════════════┤
│                                                        │
│  [ Tersimpan Lokal ]   [ Sheets: Tersinkron ]          │  <- Status Chips
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📋 Salin Semua Bagian                            │  │  <- Sticky Copy Bar
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌───┬──────────────────────────────────────────────┐  │
│  │ U │ Uraian Aktivitas                     [Salin] │  │
│  │   │ Melakukan pengembangan integrasi API autentik│  │
│  │   │ asi pada modul login peserta magang...       │  │
│  │   │                                              │  │
│  │   │ [✓ 142 karakter, syarat terpenuhi]           │  │  <- Status karakter (success)
│  ├───┼──────────────────────────────────────────────┤  │
│  │ P │ Pembelajaran                         [Salin] │  │
│  │   │ Memahami implementasi OAuth2 token dan alur  │  │
│  │   │ refresh token secara aman di sisi klien...   │  │
│  │   │                                              │  │
│  │   │ [✓ 118 karakter, syarat terpenuhi]           │  │  <- Status karakter (success)
│  ├───┼──────────────────────────────────────────────┤  │
│  │ K │ Kendala                              [Salin] │  │
│  │   │ Terjadi ketidaksesuaian skema response dari  │  │
│  │   │ endpoint staging yang langsung diatasi...    │  │
│  │   │                                              │  │
│  │   │ [✓ 104 karakter, syarat terpenuhi]           │  │  <- Status karakter (success)
│  └───┴──────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ↗ Buka Portal Monev & Tempel                     │  │  <- Tombol Primer (action)
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Buat Laporan Baru                                │  │  <- Tombol Sekunder
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

### 5.4 Layar Riwayat & Detail

- **Tampilan Daftar:**
  - Diurutkan dari tanggal terbaru ke terlama.
  - Setiap kartu menampilkan tanggal dalam format mono (`14 Okt 2026`), ringkasan satu baris dari Uraian Aktivitas, dan chip status backup Sheets.
  - Tombol hapus dengan konfirmasi peringatan agar tidak terhapus tidak sengaja.
- **Tampilan Detail:**
  - Menampilkan seksi U, P, dan K secara lengkap.
  - Menyediakan tombol "Salin Semua" dan "Buka Monev" persis seperti di Layar Hasil.

---

### 5.5 Layar Pengaturan

1. **Seksi Portal Monev Kemnaker:**
   - Menampilkan alamat aktif saat ini (`https://monev.maganghub.kemnaker.go.id`).
   - Tombol *"Uji Buka Portal"* dan *"Ubah Alamat Portal"*.
   - Tombol *"Kembalikan Alamat Default"*.
2. **Seksi Alarm Pengingat Absen:**
   - Toggle switch aktif/nonaktif (berwarna `action` saat menyala).
   - Pengaturan jam mulai (default: 16:00 WIB) dan interval (default: 30 menit).
   - Pemilih nada dering (*Absen Alert Kustom*, *Melodic Chime*, *Nada Dering Sistem*) lengkap dengan tombol preview pemutaran audio.
3. **Seksi Cadangan Google Sheets:**
   - Input URL Webhook Google Apps Script.
   - Status koneksi terhubung / belum terhubung.
   - Tombol pengujian koneksi (*Test Ping Webhook*).
4. **Seksi API Key AI (Opsional):**
   - Masukan manual untuk Gemini API Key atau OpenRouter API Key jika pengguna ingin menggunakan kuota token pribadi.
5. **Seksi Tampilan & Info Aplikasi:**
   - Pengaturan tema: *Ikuti Sistem*, *Mode Terang*, *Mode Gelap*.
   - Versi aplikasi, lisensi, dan ucapan terima kasih.

---

## 6. Panduan Microcopy, Pesan Error & Kasus Khusus (Edge Cases)

Prinsip bahasa MonevApp: **Lugas, percaya diri, tanpa basa-basi meminta maaf, dan selalu menunjukkan solusi langkah berikutnya.**

| Skenario Kasus | Pesan UI / Penanganan | Tindakan Solutif Sistem |
|---|---|---|
| **Catatan mentah kosong** | Tombol *"Buat Laporan"* dinonaktifkan. Hint: *"Ketik minimal beberapa poin kegiatan hari ini."* | Mencegah panggilan API sia-sia. |
| **AI Rate Limit (HTTP 429)** | Toast: *"Memakai mode offline. Laporan dibuat dari template lokal."* | Sistem langsung beralih ke generator lokal tanpa jeda. |
| **Internet mati total** | Toast: *"Mode offline aktif. Laporan tersimpan di memori perangkat."* | Eksekusi template lokal, simpan ke `AsyncStorage`. |
| **Karakter per seksi < 100** | Indikator `warn`: *"Kurang 16 karakter. Tambahkan detail sebelum disalin."* | Menjaga kepatuhan peserta terhadap standar laporan portal. |
| **Gagal membuka browser** | Toast `error`: *"Tidak bisa membuka browser. Alamat sudah disalin ke clipboard."* | Salin string URL ke clipboard pengguna otomatis. |
| **URL Monev non-https** | Error input: *"Alamat wajib menggunakan protokol aman (https://)."* | Form menolak penyimpanan URL tidak valid. |
| **Alarm berbunyi di lockscreen** | Tombol: ` Sudah Absen` | Pembatalan seluruh alarm hari itu lewat `BackgroundTaskManager`. |
| **Riwayat kosong** | Layar kosong: *"Belum ada laporan tersimpan. Catatan yang kamu susun akan dicatat di sini."* | Tampilkan ilustrasi garis dan tombol *"Mulai Sekarang"*. |

---

## 7. Standar Aksesibilitas (WCAG Compliance)

1. **Rasio Kontras Tinggi (WCAG AA & AAA):**
   - Seluruh teks paragraf dan tombol primer diuji memiliki rasio kontras di atas **$4.5:1$** (AA) dan **$7:1$** (AAA).
2. **Kesesuaian Pembaca Layar (Screen Readers):**
   - Seluruh elemen sentuh menyertakan `accessible={true}`, `accessibilityRole`, dan `accessibilityLabel` yang jelas.
   - Komponen eksternal dilengkapi label: `accessibilityRole="link"` dan `accessibilityHint="Membuka situs portal Monev di browser bawaan"`.
3. **Ukuran Target Sentuh (Touch Target Area):**
   - Tidak ada tombol, ikon, atau toggle yang memiliki dimensi interaksi di bawah **$44 \times 44\text{ px}$**.
4. **Dukungan Skala Huruf (Dynamic Type Scaling):**
   - Tata letak antarmuka mendukung pembesaran teks sistem hingga **$130\%$** tanpa menyebabkan teks terpotong (*clipped text*) atau tumpang tindih (*text overflow*).
5. **Umpan Balik Berganda:**
   - Setiap konfirmasi aksi penting (seperti menyalin teks atau menyimpan alarm) selalu mengombinasikan **perubahan label visual**, **ikon representatif**, dan **getaran haptic**.

---

## 8. Kriteria Keberhasilan (Acceptance Criteria) & Verifikasi

### 8.1 Fungsionalitas & Keandalan
- [x] **Smart Hybrid Fallback:** Aplikasi 100% tidak pernah mengalami *crash* atau menampilkan dialog error saat AI gagal / terkena limit kuota.
- [x] **Kecepatan Respons:**
  - Pemrosesan template lokal selesai dalam waktu $< 100\text{ ms}$.
  - Pemrosesan AI cloud selesai dalam waktu $< 3\text{ detik}$ (pada kondisi jaringan stabil).
- [x] **Pintasan Monev:**
  - Tombol pintasan membuka alamat portal resmi di browser eksternal dalam waktu $< 1\text{ detik}$.
  - Pengguna dapat mengubah alamat portal dan mereset ke default tanpa masalah.
- [x] **Pengingat Absen Latar Belakang:**
  - Notifikasi pertama terpicu tepat pukul 16:00 WIB.
  - Tombol *"Sudah Absen"* pada notifikasi berfungsi mematikan sisa alarm harian tanpa membuka antarmuka aplikasi.
- [x] **Efisiensi Kerja Peserta:** Alur dari mengetik poin mentah hingga menempelkan laporan di portal dapat dituntaskan dalam waktu **kurang dari 30 detik**.

### 8.2 Desain Visual & Integritas Kode
- [x] **Zero Gradient Compliance:** Tidak ada elemen dengan gradient atau efek shimmer bergradasi di seluruh kode tampilan.
- [x] **Token Compliance:** Tidak ada kode hex warna acak (*hardcoded hex*) di dalam file layar komponen; seluruh warna merujuk ke objek `colors` dari `src/theme/colors.ts`.
- [x] **Konsistensi Platform:** Tampilan dan performa bekerja mulus di kedua sistem operasi utama (Android 12+ dan iOS 16+).

---
*Dokumen ini merupakan panduan tunggal resmi pengembangan dan audit desain MonevApp v2.*
