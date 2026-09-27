/**
 * Google Apps Script untuk Monev App (Laporan Magang Kemnaker)
 * 
 * LANGKAH PENYETELAN (SETUP):
 * 1. Buka Google Spreadsheet kamu di browser.
 * 2. Klik menu Extensi -> Apps Script.
 * 3. Hapus kode bawaan dan tempel (paste) seluruh kode di bawah ini.
 * 4. Klik "Deploy" (Terapkan) -> "Deployment baru" (New deployment).
 * 5. Pilih jenis: "Web app" (Aplikasi Web).
 * 6. Setel:
 *    - Execute as (Jalankan sebagai): "Me" (Saya / email Anda)
 *    - Who has access (Siapa yang memiliki akses): "Anyone" (Siapa saja)
 * 7. Klik "Deploy", lalu salin (copy) Web App URL yang dihasilkan (contoh: https://script.google.com/macros/s/.../exec).
 * 8. Tempelkan URL tersebut di menu Pengaturan aplikasi Monev App kamu.
 */

function doPost(e) {
  try {
    // 1. Ambil spreadsheet aktif
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 2. Buat header baris pertama jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Tanggal",
        "Catatan Mentah",
        "Uraian Aktivitas",
        "Pembelajaran",
        "Kendala",
        "ID Laporan"
      ]);
      // Format header menjadi bold
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#F3F4F1");
    }

    // 3. Parse JSON data dari payload
    var data = JSON.parse(e.postData.contents);

    // 4. Tambahkan baris baru ke spreadsheet
    sheet.appendRow([
      new Date(),
      data.date || "",
      data.rawInput || "",
      data.activity || "",
      data.learning || "",
      data.obstacle || "",
      data.id || ""
    ]);

    // 5. Kembalikan respons JSON sukses
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Laporan berhasil disimpan ke Google Sheets!"
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Handle error jika ada kegagalan
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      message: "MonevApp Google Apps Script Webhook is active!"
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
