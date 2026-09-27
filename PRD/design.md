# Design Spec — AI Daily Report Generator

Dokumen ini mendefinisikan bahasa visual dan pola UI/UX untuk aplikasi. Tujuannya satu: peserta magang bisa mengetik catatan, dapat laporan matang, salin, selesai — dalam hitungan detik, tanpa gesekan visual atau kognitif tambahan.

> **Aturan keras:** tidak ada gradasi warna di manapun (tombol, latar, ikon, status). Semua warna adalah warna solid/flat. Ini bukan preferensi estetika saja — gradient pada UI produktivitas cenderung memperlambat pembacaan status dan terlihat generik.

---

## 1. Filosofi Desain

**Konteks nyata:** ini bukan aplikasi konsumen yang butuh "wow factor" di setiap layar. Ini alat kerja harian — dipakai sambil terburu-buru, sering dengan satu tangan, di sela jam magang. Pengguna membuka app, generate, salin, tutup. Desain yang bagus di sini berarti desain yang **cepat dihabiskan**, bukan yang dinikmati lama-lama.

Referensi rasa yang dipakai: **buku catatan kerja / logbook lapangan** — bukan dasbor SaaS korporat, bukan aplikasi konsumen playful. Sebuah logbook itu tegas, terstruktur dalam entri-entri, dan tiap entri punya "cap" begitu selesai dicatat. Metafora ini dipakai secara fungsional (lihat §3 dan §7), bukan sekadar tempelan visual.

Tiga prinsip yang mengikat semua keputusan di bawah:

1. **Satu aksi utama per layar.** Tidak ada layar dengan lebih dari satu tombol berbobot sama. Selalu jelas apa langkah berikutnya.
2. **Status harus terbaca dalam sepersekian detik**, bukan dengan membaca teks. Warna solid + bentuk, bukan animasi berkepanjangan atau shading berlapis.
3. **Diam itu pilihan sadar.** Tidak ada elemen dekoratif yang tidak membawa informasi. Kalau sebuah kotak/garis/warna ada di layar, ia menandakan sesuatu.

---

## 2. Yang Sengaja Dihindari

Supaya tidak jatuh ke tampilan "khas AI-generated", berikut daftar eksplisit yang **tidak** dipakai di seluruh aplikasi:

- ❌ Gradient dalam bentuk apa pun — termasuk gradient halus sebagai "wash" di belakang kartu.
- ❌ Latar krem hangat + aksen terracotta + serif display (kombinasi default generator AI).
- ❌ "SaaS card kit": semua konten dipotong jadi kartu rounded seragam dengan drop-shadow abu-abu lembut yang sama di mana-mana.
- ❌ Label eyebrow ALL-CAPS di atas judul, meta info yang disambung titik tengah (`A · B · C`), atau label bergaya `KATA — fragmen`.
- ❌ Ikon emoji sebagai pengganti ikon UI nyata.
- ❌ Micro-animation di setiap kartu/hover — animasi hanya pada satu momen yang benar-benar berarti (§8).
- ❌ Radius sudut yang sama rata di semua elemen tanpa alasan hierarki.

---

## 3. Sistem Warna

Palet dipilih dari dunia **tinta di atas kertas kerja** — bukan tema "app modern" generik. Semua warna solid, tanpa opacity berlapis untuk membentuk gradasi.

### Token Inti

| Token | Hex | Peran |
|---|---|---|
| `paper` | `#F3F4F1` | Latar utama — putih tulang sedikit dingin, bukan krem hangat |
| `paper-raised` | `#FFFFFF` | Permukaan kartu/input di atas `paper` |
| `ink` | `#152331` | Teks utama, hampir hitam dengan rona biru tua |
| `ink-soft` | `#5B6B78` | Teks sekunder, caption, placeholder |
| `rule` | `#D8DAD2` | Garis pembatas / hairline, pengganti drop-shadow |
| `action` | `#1F4D3D` | **Hijau tinta gelap** — warna aksi utama (tombol Generate, tautan aktif) |
| `action-press` | `#153A2E` | State ditekan untuk `action` |
| `stamp` | `#B5502E` | **Oranye-bata** — aksen tunggal untuk hal yang butuh perhatian sekilas (badge "Kendala", tombol retry) |
| `success` | `#2C6B4F` | Status berhasil (backup sukses) — hijau, beda saturasi dari `action` agar tak tertukar makna |
| `warn` | `#946B1D` | Status menunggu/perlu tindakan (backup tertunda) |
| `error` | `#9C3B32` | Status gagal (API error, backup gagal) |
| `focus-ring` | `#1F4D3D` | Outline fokus keyboard, sama dengan `action` |

### Mengapa hijau tinta, bukan biru korporat?

Biru adalah pilihan default untuk hampir semua app produktivitas — jadi ia tidak membawa identitas apa pun. Hijau tinta gelap (`#1F4D3D`) mengevokasi tinta pena kantor/stempel dinas yang sering dipakai untuk paraf dan validasi dokumen di lingkungan pemerintahan Indonesia — relevan dengan konteks produk (laporan resmi) tanpa menjadi literal/kartun.

### Mode Gelap

Bukan sekadar invert. Latar jadi "kertas di bawah lampu meja malam hari":

| Token | Hex |
|---|---|
| `paper` (dark) | `#14181A` |
| `paper-raised` (dark) | `#1B2124` |
| `ink` (dark) | `#EAE7DD` |
| `ink-soft` (dark) | `#9BA6A9` |
| `rule` (dark) | `#2B3235` |
| `action` (dark) | `#5FA687` |
| `stamp` (dark) | `#D98A5E` |

### Penggunaan warna status — aturan ketat

Warna status (`success` / `warn` / `error`) **hanya** dipakai pada: badge status backup, banner error, dan teks pesan terkait. Tidak dipakai untuk dekorasi, ikon navigasi, atau elemen non-status. Ini menjaga agar saat pengguna melihat warna merah/oranye di layar, itu **selalu** berarti "perlu perhatian" — bukan kadang dekorasi kadang status.

---

## 4. Tipografi

Dua peran, satu keluarga font teknis agar terasa "presisi dokumen":

| Peran | Font | Pemakaian |
|---|---|---|
| UI & body text | **IBM Plex Sans** | Judul layar, label, paragraf, tombol |
| Data & meta | **IBM Plex Mono** | Timestamp, status backup, nomor versi, hasil JSON debug |

Kedua font satu superfamily (Plex) tapi perannya jelas berbeda secara visual — bukan dua font acak yang "kelihatan beda-beda saja".

### Skala Tipe (mobile, base 16px = 1rem)

| Level | Ukuran | Weight | Contoh Pemakaian |
|---|---|---|---|
| Display | 26px / 1.2 | 600 | Judul layar ("Catatan Hari Ini") |
| Title | 19px / 1.3 | 600 | Judul kartu hasil |
| Body | 16px / 1.55 | 400 | Paragraf, isi laporan |
| Body Small | 14px / 1.5 | 400 | Caption, deskripsi field |
| Meta (mono) | 12.5px / 1.4 | 500 | Timestamp, kode status |
| Label | 13px / 1.3 | 600 | Label tombol, tab |

**Aturan:** label tombol dan tab pakai *sentence case* ("Salin uraian", bukan "SALIN URAIAN"). Huruf besar penuh dicadangkan hanya untuk singkatan sah seperti nama file atau kode status teknis.

---

## 5. Grid, Spacing & Bentuk

- **Satuan spacing:** kelipatan 4px — 4 / 8 / 12 / 16 / 24 / 32 / 48.
- **Margin layar:** 20px kiri-kanan konsisten di semua layar.
- **Lebar baca teks laporan:** dibatasi visual dengan padding dalam kartu, target ±60 karakter per baris pada layar standar agar nyaman dibaca ulang sebelum disalin.
- **Radius:**
  - Elemen interaktif yang disentuh (tombol, input, chip) → `8px`.
  - Permukaan statis (kartu hasil, panel info) → `4px`, cukup untuk melunakkan sudut tanpa terasa "app konsumen bulat-bulat".
  - Tidak ada elemen dengan radius penuh (pill) kecuali status chip kecil — supaya pill tetap punya makna sebagai "penanda status", bukan gaya default semua tombol.
- **Elevasi:** tidak pakai drop-shadow sebagai default. Pemisahan antar-blok memakai `rule` (garis 1px) atau perbedaan `paper` vs `paper-raised`. Shadow tipis (`0 1px 2px rgba(21,35,49,.08)`) hanya dipakai untuk elemen yang benar-benar melayang di atas konten lain (bottom sheet, toast).

---

## 6. Ikonografi

- Set ikon: garis (outline) 1.5px stroke, sudut agak tegas (bukan super-rounded) — selaras dengan nuansa "alat kerja", bukan "app ramah anak". Rekomendasi: [Lucide](https://lucide.dev) dengan stroke width 1.75.
- Tidak ada emoji di UI produksi (📋✅❌ dst). Status memakai ikon + warna + teks, tiga penanda sekaligus untuk aksesibilitas (lihat §11).
- Ikon berwarna `ink-soft` secara default, berubah ke `action` hanya saat aktif/dipilih.

---

## 7. Komponen Kunci

### 7.1 Tombol

| Varian | Latar | Teks | Pemakaian |
|---|---|---|---|
| Primary | `action` solid | Putih | Satu per layar — aksi utama ("Buat Laporan") |
| Secondary | Transparan, border 1px `rule` | `ink` | Aksi kedua ("Batal", "Edit") |
| Ghost | Transparan | `action` | Aksi ringan di dalam kartu ("Salin") |
| Danger-ghost | Transparan | `stamp` | "Coba lagi" saat gagal |

Tinggi tap target minimum **44px**. Tidak ada efek gradient/glow saat pressed — cukup ubah ke `action-press` dan turunkan skala 2% (98%) selama 100ms.

### 7.2 Input Catatan

Textarea multi-baris, border `rule` 1px, radius 8px, berubah ke border `action` 1.5px saat fokus (bukan glow/shadow berwarna). Penghitung karakter di kanan-bawah dengan font mono, warna `ink-soft`, berubah ke `stamp` hanya saat mendekati batas.

### 7.3 Kartu Hasil Laporan — komponen inti aplikasi

Alih-alih tiga kartu rounded identik dengan shadow (pola SaaS generik), tiga bagian laporan ditampilkan sebagai **entri berurut dengan tab huruf**, meniru pembagian kolom pada formulir logbook resmi — struktur ini valid karena tiga kategori (Uraian, Pembelajaran, Kendala) memang selalu tetap dan berurutan pada portal Monev:

\`\`\`
┌─┬──────────────────────────────────────────┐
│U│  Uraian Aktivitas                    ⧉   │
│ │  Melakukan onboarding tim baru dan   │
│ │  menyusun draf jadwal minggu depan.  │
├─┼──────────────────────────────────────────┤
│P│  Pembelajaran                        ⧉   │
│ │  Memahami alur review dokumen di     │
│ │  tim legal.                          │
├─┼──────────────────────────────────────────┤
│K│  Kendala                             ⧉   │
│ │  Tidak ada kendala berarti hari ini. │
└─┴──────────────────────────────────────────┘
\`\`\`

- Tab huruf (\`U\`/\`P\`/\`K\`) berlatar \`paper-raised\`, teks \`action\`, lebar tetap 28px — bertindak sebagai penanda kategori sekaligus elemen navigasi visual saat scroll cepat.
- Ikon salin (⧉) di pojok kanan tiap entri = \`Ghost button\`, memberi haptic ringan + label berubah sesaat jadi "Tersalin" (bukan toast terpisah — mengurangi noise).
- Antar-entri dipisah \`rule\`, bukan jarak kosong + shadow.
- Tombol **"Salin semua"** muncul sebagai bar sticky tipis di atas ketiga entri, bukan tombol besar terpisah — karena ini aksi paling sering dipakai berulang.

### 7.4 Status Chip (Backup)

Chip kecil (radius penuh — pengecualian yang disengaja, lihat §5), font mono 12.5px, ikon + teks:

- \`● Tersimpan\` — latar \`success\` 10% opacity, teks \`success\`, ikon centang.
- \`● Menyimpan…\` — latar \`warn\` 10% opacity, teks \`warn\`, ikon jam.
- \`● Gagal disimpan\` — latar \`error\` 10% opacity, teks \`error\`, ikon seru + tombol "Coba lagi" menyatu di sisi kanan chip.

### 7.5 Navigasi

Tab bar bawah, 3 item maksimum: **Hari Ini** · **Riwayat** · **Pengaturan**. Ikon + label selalu tampil (tidak disembunyikan demi "clean"), karena aplikasi dipakai cepat dan label mengurangi salah pencet.

---

## 8. Motion — satu momen, dipakai dengan sengaja

Sesuai prinsip di §1, animasi **tidak** ditaruh di setiap interaksi. Satu momen orkestrasi utama:

**"Stempel" saat laporan selesai dibuat.** Ketika hasil dari Gemini tiba, ketiga entri muncul berurutan (U → P → K) dengan jeda 80ms antar-entri, masing-masing masuk dengan scale dari 97% → 100% + fade 150ms — meniru sensasi cap yang menjejak kertas, bukan slide-fade generik. Ini satu-satunya animasi masuk yang dipakai; tidak diulang untuk elemen lain di halaman yang sama.

Interaksi lain (tombol ditekan, salin, ganti tab) memakai transisi state instan/≤100ms tanpa easing dramatis — karena ini adalah *tool*, kecepatan terasa lebih penting daripada kehalusan.

\`prefers-reduced-motion\`: animasi stempel diganti fade polos 100ms tanpa scale.

---

## 9. Arsitektur Layar

### 9.1 Hari Ini (Home) — status kosong

\`\`\`
 Hari Ini                              ⚙
 Senin, 27 September 2026

 ┌────────────────────────────────────┐
 │ Ketik catatan kegiatan hari ini...  │
 │                                      │
 │                                      │
 └────────────────────────────────────┘
                              0 / 500

        [  Buat Laporan  ]

 ──────────────────────────────────────
  Riwayat 6 hari terakhir tersimpan
  di Google Sheets kamu →
\`\`\`

### 9.2 Memproses

Tombol utama berubah jadi bar progres flat (bukan spinner bulat generik) dengan label yang bergerak: \`Menyusun laporan…\` → \`Menyimpan ke Sheets…\`. Tidak ada overlay gelap penuh layar — pengguna tetap lihat catatan yang barusan diketik.

### 9.3 Hasil

\`\`\`
 Hasil Laporan                    ● Tersimpan
 ──────────────────────────────────────
 [ Salin semua ]

 ┌─┬────────────────────────────────┐
 │U│ Uraian Aktivitas          ⧉    │
 ├─┼────────────────────────────────┤
 │P│ Pembelajaran              ⧉    │
 ├─┼────────────────────────────────┤
 │K│ Kendala                   ⧉    │
 └─┴────────────────────────────────┘

        [ Buat laporan baru ]
\`\`\`

### 9.4 Riwayat

Daftar per-tanggal, format mono untuk tanggal (\`27 Sep 2026\`), potongan pertama Uraian Aktivitas sebagai preview satu baris terpotong (\`…\`), status backup sebagai chip kecil di kanan. Tap → buka detail read-only dengan tombol salin yang sama seperti §9.3.

### 9.5 Pengaturan

Daftar sederhana: sambungan Google Sheets (status terhubung/putus), tautan buka spreadsheet, mode gelap (ikuti sistem / manual), tentang aplikasi.

---

## 10. Kondisi Kosong, Error & Microcopy

Suara aplikasi: langsung, bukan minta maaf berlebihan, selalu bilang apa yang terjadi dan apa langkah berikutnya.

| Kondisi | Judul | Isi |
|---|---|---|
| Catatan kosong | — | Tombol "Buat Laporan" nonaktif; hint di bawah field: "Ketik minimal beberapa kata dulu." |
| Gagal generate (timeout API) | Laporan belum bisa dibuat | "Koneksi ke Gemini gagal merespons. Catatanmu masih tersimpan — coba lagi." + tombol Coba Lagi |
| Berhasil generate, backup gagal | — | Chip "Gagal disimpan" + tombol "Coba simpan lagi" — laporan tetap tampil penuh, tidak diblokir |
| Riwayat kosong | Belum ada laporan | "Laporan yang kamu buat akan muncul di sini." |

---

## 11. Aksesibilitas

- Kontras teks memenuhi **WCAG AA** (4.5:1 untuk body, 3:1 untuk teks besar) — diverifikasi untuk pasangan \`ink\`/\`paper\` dan setiap token status di atas latar chip-nya.
- Status **tidak pernah** disampaikan lewat warna saja — selalu warna + ikon + teks (lihat §7.4).
- Semua target sentuh ≥ 44×44px, termasuk ikon salin di dalam entri hasil.
- Fokus keyboard/switch-control terlihat jelas dengan \`focus-ring\` 2px, tidak dihilangkan di elemen mana pun.
- Mendukung pembesaran teks sistem (Dynamic Type / font scale Android) hingga 130% tanpa memotong konten.

---

## 12. Ringkasan Do & Don't

| Do | Don't |
|---|---|
| Warna solid, makna status konsisten | Gradient, warna status yang dipakai dekoratif |
| Garis \`rule\` 1px untuk pemisah | Drop-shadow abu-abu default di semua kartu |
| Satu momen animasi berarti (stempel) | Animasi hover/entrance di tiap elemen |
| Label sentence case | ALL-CAPS eyebrow di atas judul |
| Ikon nyata (Lucide dsb.) | Emoji sebagai ikon fungsional |
| Radius bertingkat sesuai peran elemen | Radius seragam di semua elemen tanpa alasan |
