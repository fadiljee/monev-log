# 📝 MonevApp — AI Daily Report Generator

> **Asisten Laporan Harian Magang Kemnaker Berbasis AI & Google Sheets Sync**

MonevApp adalah aplikasi React Native (Expo) yang dirancang khusus untuk membantu peserta magang menyusun laporan harian untuk portal Monev Kemnaker secara serba cepat, rapi, dan terstruktur tanpa hambatan visual atau kognitif.

---

## 🌟 Fitur Utama

- ⚡ **Penyusunan Laporan AI Otomatis**: Mengubah poin-poin catatan mentah menjadi 3 bagian wajib laporan magang (*Uraian Aktivitas*, *Pembelajaran*, dan *Kendala*) dalam hitungan detik menggunakan Google Gemini AI.
- 📋 **Salin Satu Ketukan (One-Tap Copy)**: Fitur salin per bagian atau seluruh laporan dalam satu tombol untuk kemudahan *paste* langsung ke portal Monev Kemnaker.
- 💾 **Penyimpanan Lokal (Offline-First)**: Seluruh riwayat laporan tersimpan rapi di perangkat lokal menggunakan `@react-native-async-storage/async-storage`.
- 📊 **Cadangan Otomatis ke Google Sheets**: Integrasi langsung dengan Google Spreadsheet pribadi melalui Webhook Google Apps Script.
- 🎨 **Desain Logbook Kertas & Tinta**: UI minimalist berkonsep buku catatan kerja dengan warna flat solid (*zero gradient*), tipografi teknis, dan kontras tinggi.

---

## 🛠️ Teknologi & Dependensi

- **Framework**: [Expo](https://expo.dev) (SDK 57) / [React Native](https://reactnative.dev) (v0.86) / [React](https://react.dev) (v19)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org)
- **AI Engine**: [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini API dengan mekanisme *fallback model*)
- **Navigasi**: [`@react-navigation/bottom-tabs`](https://reactnavigation.org)
- **Penyimpanan**: [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/)
- **Ikon & Desain**: [`lucide-react-native`](https://lucide.dev), `react-native-svg`, `react-native-safe-area-context`

---

## 📁 Struktur Proyek

```text
monevApp/
├── App.tsx                     # Entrypoint & konfigurasi Bottom Tab Navigation
├── app.json                    # Konfigurasi Expo project
├── package.json                # Dependensi & script proyek
├── tsconfig.json               # Konfigurasi TypeScript
├── google-apps-script/
│   └── Code.gs                 # Script Web App Webhook untuk integrasi Google Sheets
├── PRD/
│   └── design.md               # Spesifikasi desain visual & filosofi UI/UX
└── src/
    ├── screens/
    │   ├── HomeScreen.tsx      # Layar input catatan mentah & hasil laporan AI
    │   ├── HistoryScreen.tsx   # Layar riwayat laporan tersimpan & aksi salin/hapus
    │   └── SettingsScreen.tsx  # Layar penyetelan URL Webhook Google Sheets
    ├── services/
    │   ├── ai.ts               # Servis pemanggilan Google Gemini API
    │   ├── sheets.ts           # Servis pengiriman backup data ke Google Sheets
    │   └── storage.ts          # Servis CRUD penyimpanan lokal AsyncStorage
    ├── theme/
    │   ├── colors.ts           # Token warna sistem (Paper, Ink, Action, Stamp, Rule)
    │   └── typography.ts       # Sistem tipografi & skala font
    └── types/
        └── index.ts            # Tipe data & interface TypeScript (Report, AiResponse)
```

---

## 🚀 Panduan Memulai

### Prasyarat

Pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi LTS direkomendasikan)
- Package manager `npm` atau `yarn`
- Aplikasi **Expo Go** pada ponsel fisik (Android/iOS) atau emulator/simulator.

### Instalasi Dependencies

1. Clone repositori ini dan masuk ke direktori proyek:
   ```bash
   cd monevApp
   ```

2. Instal seluruh paket dependensi:
   ```bash
   npm install
   ```

### Menjalankan Aplikasi

Jalankan server pengembang Expo:

```bash
# Memulai server Expo
npm start

# Atau jalankan langsung untuk platform tertentu
npm run android   # Android emulator / device
npm run ios       # iOS simulator / device
npm run web       # Web browser
```

Scan QR Code yang muncul di terminal menggunakan aplikasi **Expo Go** di Android atau kamera iOS.

---

## 📊 Penyetelan Integrasi Google Sheets

Aplikasi ini mendukung penyimpanan otomatis laporan ke Google Spreadsheet pribadi.

1. Buka [Google Sheets](https://sheets.google.com) dan buat Spreadsheet baru.
2. Klik menu **Ekstensi** -> **Apps Script**.
3. Salin seluruh isi dari file [google-apps-script/Code.gs](file:///home/fadil/fadil/monevApp/google-apps-script/Code.gs) dan tempel ke editor Apps Script.
4. Klik **Deploy** (Terapkan) -> **Deployment baru** (New deployment).
5. Pilih tipe: **Web app** (Aplikasi Web).
6. Atur konfigurasi berikut:
   - **Execute as** (*Jalankan sebagai*): `Me` (*Saya*)
   - **Who has access** (*Siapa yang memiliki akses*): `Anyone` (*Siapa saja*)
7. Klik **Deploy**, beri izin akses yang diminta, lalu salin **Web App URL** yang dihasilkan.
8. Buka tab **Pengaturan** di dalam aplikasi MonevApp dan tempelkan URL Web App tersebut.

---

## 📄 Lisensi & Kredit

Dikembangkan untuk memberikan pengalaman pembuatan laporan harian magang Kemnaker yang cepat, efisien, dan andal.

