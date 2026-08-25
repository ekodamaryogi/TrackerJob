# 📱 Panduan Integrasi Notifikasi WhatsApp - Personal Job Application Tracker

Dokumen ini berisi panduan lengkap untuk mengaktifkan dan menggunakan fitur **Integrasi Notifikasi WhatsApp** pada aplikasi **Personal Job Application Tracker**.

Dengan fitur ini, Anda tidak akan pernah ketinggalan jadwal interview penting, batas akhir lamaran (*deadline*), atau status lamaran kerja Anda. Notifikasi dapat dikirimkan langsung ke nomor WhatsApp pribadi Anda.

---

## 📋 Daftar Isi
1. [Fitur & Keunggulan](#1-fitur--keunggulan)
2. [Pilihan Metode Integrasi WhatsApp](#2-pilihan-metode-integrasi-whatsapp)
   - [Metode 1: Direct Click-to-Chat (wa.me) - Gratis & Instan](#metode-1-direct-click-to-chat-wame---gratis--instan)
   - [Metode 2: Fonnte API Gateway (Otomatis Background)](#metode-2-fonnte-api-gateway-otomatis-background)
   - [Metode 3: Wablas API Gateway](#metode-3-wablas-api-gateway)
   - [Metode 4: Custom Webhook / WhatsApp Bot Pribadi](#metode-4-custom-webhook--whatsapp-bot-pribadi)
3. [Langkah-Langkah Konfigurasi di Aplikasi](#3-langkah-langkah-konfigurasi-di-aplikasi)
4. [Spesifikasi Payload JSON Webhook & Contoh Server](#4-spesifikasi-payload-json-webhook--contoh-server)
5. [Daftar Pemicu (Event Triggers) & Format Pesan](#5-daftar-pemicu-event-triggers--format-pesan)
6. [Cara Melakukan Pengujian (Test Kirim WA)](#6-cara-melakukan-pengujian-test-kirim-wa)
7. [Troubleshooting & Solusi](#7-troubleshooting--solusi)

---

## 1. Fitur & Keunggulan

- 🕒 **Pengingat Jadwal Interview**: Otomatis mengirimkan pengingat H-1 atau H-2 jam sebelum interview teknis/HR dengan detail pewawancara dan link Google Meet/Zoom.
- ⏳ **Peringatan Deadline Lamaran**: Mengingatkan batas akhir pengiriman CV sebelum lowongan ditutup (H-1 s/d H-3).
- 🔄 **Notifikasi Perubahan Status**: Memberi kabar saat lamaran Anda berpindah status (misal dari *Applied* ke *Interviewing* atau *Offered*).
- 📩 **Pengingat Follow-up Rekruter**: Pengingat berkala jika lamaran belum ada respon selama 7–14 hari.
- 🧪 **Preview & Manual Send**: Modal interaktif untuk melihat preview teks sebelum dikirim dan tombol salin cepat.
- 🌐 **Mendukung Multi-Provider**: Direct Link, Fonnte, Wablas, dan Custom Webhook.

---

## 2. Pilihan Metode Integrasi WhatsApp

Aplikasi menyediakan 4 mode pengiriman yang fleksibel:

| Metode | Biaya | Setup Backend | Rekomendasi Penggunaan |
| :--- | :--- | :--- | :--- |
| **Direct Click-to-Chat (`wa.me`)** | **100% Gratis** | Tidak Butuh | Penggunaan personal instan langsung dari browser |
| **Fonnte Gateway** | Gratis / Berbayar | Tidak Butuh (SaaS) | Pengiriman otomatis background tanpa perlu buka tab WA |
| **Wablas Gateway** | Berbayar | Tidak Butuh (SaaS) | Pengguna enterprise / akun Wablas yang sudah ada |
| **Custom Webhook** | Mandiri | Butuh (Node/Python) | Developer yang memiliki server Baileys / WPPConnect sendiri |

---

### Metode 1: Direct Click-to-Chat (wa.me) - Gratis & Instan
Metode bawaan (*default*) yang langsung berfungsi tanpa akun pihak ketiga:
1. Ketika notifikasi muncul atau tombol **Kirim via WhatsApp** diklik, sistem memformat pesan lengkap.
2. Aplikasi membuat URL resmi `https://wa.me/<nomor>?text=<pesan_terenkripsi>`.
3. WhatsApp Web atau WhatsApp Mobile akan terbuka dengan pesan siap kirim.
4. Anda cukup menekan tombol **Kirim** (Enter) di WhatsApp.

---

### Metode 2: Fonnte API Gateway (Otomatis Background)
Untuk pengiriman otomatis langsung ke nomor Anda tanpa membuka browser WhatsApp:
1. Buat akun di [fonnte.com](https://fonnte.com).
2. Buka menu **Device** di dashboard Fonnte, lalu scan QR Code dengan aplikasi WhatsApp Anda (*Linked Devices*).
3. Buka menu **Account** / **API Token**, salin API Token Anda (contoh: `aB1cD2eF3gH4iJ5kL6...`).
4. Di aplikasi **Job Application Tracker**:
   - Buka menu **Settings** -> **Notifications & WhatsApp**.
   - Pilih mode **Fonnte API Gateway**.
   - Masukkan token Anda di kolom **Fonnte API Token**.
   - Klik **Simpan Pengaturan WhatsApp**.
5. Pesan WhatsApp akan otomatis terkirim di latar belakang melalui endpoint resmi Fonnte (`https://api.fonnte.com/send`).

---

### Metode 3: Wablas API Gateway
1. Dapatkan API Key dan Domain Server dari dashboard [wablas.com](https://wablas.com).
2. Di aplikasi:
   - Pilih mode **Wablas API Gateway**.
   - Masukkan API Token & URL Wablas Anda (contoh: `https://jakarta.wablas.com/api/send-message`).
   - Simpan pengaturan.

---

### Metode 4: Custom Webhook / WhatsApp Bot Pribadi
Jika Anda menjalankan bot WhatsApp sendiri menggunakan Node.js (seperti library `@whiskeysockets/baileys` atau `wppconnect`), Anda dapat mengarahkan aplikasi ke webhook bot Anda:
1. Pilih mode **Custom Webhook**.
2. Masukkan **Webhook URL** (contoh: `https://bot.domainanda.com/webhook/job-tracker`).
3. (Opsional) Masukkan **Secret / API Key** untuk autentikasi Bearer Token.

---

## 3. Langkah-Langkah Konfigurasi di Aplikasi

1. **Buka Aplikasi**: Klik tab **Settings** (ikon ⚙️) di bilah navigasi atas.
2. **Pilih Sub-tab**: Klik **Notifications & WhatsApp**.
3. **Aktifkan WhatsApp**: Geser toggle **Integrasi Notifikasi WhatsApp** ke posisi aktif (hijau).
4. **Masukkan Nomor WhatsApp**:
   - Format didukung: `+6281234567890` atau `081234567890`.
   - *Catatan: Aplikasi otomatis menormalisasi nomor `08xx` menjadi kode negara `628xx`.*
5. **Pilih Metode Integrasi**: Pilih salah satu dari *Direct (wa.me)*, *Fonnte*, atau *Custom Webhook*.
6. **Centang Pemicu Notifikasi**:
   - [x] Jadwal Interview (H-1 & H-2 jam)
   - [x] Batas Deadline Lamaran
   - [x] Perubahan Status Lamaran
   - [x] Pengingat Follow-up Rekruter
   - [x] Lamaran Kadaluarsa (Expired)
7. **Simpan**: Klik tombol **Simpan Pengaturan WhatsApp**.

---

## 4. Spesifikasi Payload JSON Webhook & Contoh Server

Saat menggunakan metode **Custom Webhook**, aplikasi mengirimkan HTTP Request `POST` dengan Header:
```http
POST /webhook/whatsapp HTTP/1.1
Host: bot.domainanda.com
Content-Type: application/json
Authorization: Bearer <API_KEY_ANDA>
```

### Format Payload JSON:
```json
{
  "to": "6281234567890",
  "message": "📅 *REMINDER JADWAL INTERVIEW*\n\nHalo! Ada jadwal interview mendatang:\n\n🏢 *Perusahaan*: GoTo\n💼 *Posisi*: Senior Frontend Engineer\n🗓️ *Tanggal*: 26 Agustus 2026\n⏰ *Waktu*: 10:00 WIB\n👥 *Tipe*: Technical Interview\n🔗 *Meeting Link*: https://meet.google.com/abc-defg-hij\n\n_Pastikan perangkat dan koneksi internet siap 10 menit sebelum jadwal._",
  "template": "interview_reminder",
  "parameters": {
    "company": "GoTo",
    "position": "Senior Frontend Engineer",
    "date": "2026-08-26",
    "time": "10:00 WIB",
    "interview_type": "Technical Interview",
    "meeting_url": "https://meet.google.com/abc-defg-hij"
  }
}
```

### Contoh Server Webhook (Node.js & Express + Baileys):
```javascript
// server.js
const express = require('express');
const app = express();
app.use(express.json());

// Endpoint Webhook untuk Job Tracker
app.post('/webhook/whatsapp', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { to, message, template } = req.body;

  console.log(`[WhatsApp Webhook] Mengirim notifikasi '${template}' ke: ${to}`);

  try {
    // Kirim pesan menggunakan instance Baileys / WhatsApp Client Anda
    // await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message });

    return res.status(200).json({
      status: true,
      message: 'Pesan berhasil dikirim via WhatsApp bot',
    });
  } catch (error) {
    console.error('Gagal mengirim WhatsApp:', error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

app.listen(4000, () => console.log('WhatsApp Webhook Bot aktif di port 4000'));
```

---

## 5. Daftar Pemicu (Event Triggers) & Format Pesan

### A. Template Reminder Interview
```text
📅 *PENGINGAT JADWAL INTERVIEW*

Halo! Jangan lupa ada jadwal wawancara kerja yang akan datang:

🏢 *Perusahaan*: Tech Nusantara
💼 *Posisi*: Lead Software Architect
👥 *Tahap*: Technical Live Coding
🗓️ *Tanggal & Waktu*: 28 Agustus 2026 • 14:00 WIB
👤 *Interviewer*: Jane Doe (VP of Engineering)
🔗 *Link Meeting*: https://meet.google.com/xyz-abcd-efg

💡 *Tips*: Siapkan portfolio & ringkasan arsitektur proyek terbaik Anda.
_Terkirim otomatis dari Personal Job Application Tracker_
```

### B. Template Deadline Lamaran
```text
⏳ *PERINGATAN DEADLINE LAMARAN*

Perhatian! Batas waktu pendaftaran lowongan akan segera berakhir:

🏢 *Perusahaan*: Tokopedia
💼 *Posisi*: Senior Product Designer
📅 *Batas Deadline*: 30 Agustus 2026 (Sisa 2 Hari)
🔗 *Link Lowongan*: https://careers.tokopedia.com/job/123

_Segera lengkapi CV dan portofolio Anda sebelum ditutup!_
```

### C. Template Perubahan Status Lamaran
```text
🎉 *UPDATE STATUS LAMARAN PEKERJAAN*

Status lamaran Anda telah diperbarui:

🏢 *Perusahaan*: Traveloka
💼 *Posisi*: Data Scientist
📊 *Status Baru*: 🟢 **OFFERED (Menerima Penawaran)**

_Selamat atas pencapaian ini! Cek dokumen kontrak & penawaran di aplikasi._
```

---

## 6. Cara Melakukan Pengujian (Test Kirim WA)

1. Buka tab **Settings** -> **Notifications & WhatsApp**.
2. Masukkan nomor WhatsApp Anda (contoh: `081234567890`).
3. Klik tombol **🧪 Test Kirim WA** atau **Test Notifikasi WhatsApp**.
4. Sebuah pop-up dialog (*WhatsApp Send Modal*) akan muncul:
   - Anda dapat memilih jenis template (*Jadwal Interview*, *Deadline*, *Update Status*, atau *Pesan Custom*).
   - Anda dapat mengedit isi pesan sebelum dikirim.
   - Klik **Kirim via WhatsApp (wa.me)** atau **Kirim via Webhook API**.
5. Periksa pesan yang masuk di WhatsApp Anda!

---

## 7. Troubleshooting & Solusi

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| **WhatsApp Web tidak terbuka otomatis** | Pop-up diblokir oleh browser | Izinkan *pop-ups and redirects* untuk URL aplikasi ini di setelan browser Anda. |
| **Nomor tujuan salah format** | Tidak ada kode negara | Masukkan nomor dalam format internasional seperti `+62812...` atau `0812...`. Sistem akan otomatis mengonversi ke `62812...`. |
| **Fonnte API gagal terkirim (CORS)** | Panggilan langsung browser ke Fonnte | Browser membatasi CORS tertentu. Sistem otomatis beralih ke Direct `wa.me` sebagai fallback yang aman, atau gunakan proxy backend/webhook. |
| **Notifikasi tidak berbunyi** | Reminder threshold belum tercapai | Periksa setelan *Deadline Warning Threshold* (default 3 hari) dan *Interview Reminder* (default 24 jam) di tab Settings. |

---

*Dokumen ini dibuat otomatis untuk aplikasi Personal Job Application Tracker. Jika membutuhkan kustomisasi lebih lanjut, Anda dapat memodifikasi file `/src/lib/whatsapp.ts` dan `/src/components/whatsapp/WhatsAppSendModal.tsx`.*
