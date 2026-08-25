# 🚀 Panduan & Dokumentasi - Personal Job Application Tracker

Selamat datang di repositori **Personal Job Application Tracker**. Aplikasi ini dilengkapi dengan manajemen siklus lamaran pekerjaan, penjadwalan interview, sinkronisasi cloud **Supabase**, dan **Integrasi Notifikasi WhatsApp Otomatis**.

---

## 📚 Dokumen Panduan:
- 📱 **[Panduan Integrasi Notifikasi WhatsApp (README_WHATSAPP.md)](./README_WHATSAPP.md)** - Konfigurasi kirim pesan WhatsApp otomatis, gateway Fonnte, Webhook, dan pemicu interview.
- 🗄️ **[Panduan Database Cloud Supabase (Lihat di bawah)](#-panduan-integrasi-supabase)** - Langkah setup PostgreSQL & File Storage di Supabase (Schema v2.1).

---

## 📱 Ringkasan Cepat Integrasi WhatsApp

Aplikasi mendukung pengiriman pesan langsung ke WhatsApp untuk:
1. **Reminder Jadwal Interview** (H-1 & H-2 jam sebelum wawancara beserta link Google Meet/Zoom).
2. **Alert Batas Deadline Lowongan**.
3. **Pemberitahuan Perubahan Status Lamaran**.
4. **Follow-up Recruiter**.

### Cara Mengaktifkan WhatsApp:
1. Buka tab **Settings** (⚙️) di navigasi atas.
2. Pilih sub-tab **Notifications & WhatsApp**.
3. Masukkan nomor WhatsApp Anda (contoh: `081234567890` atau `+6281234567890`).
4. Pilih metode pengiriman:
   - **Direct (wa.me)**: Instan & 100% gratis tanpa setup tambahan.
   - **Fonnte Gateway**: Otomatis di latar belakang via API token `fonnte.com`.
   - **Custom Webhook**: Untuk bot WhatsApp pribadi (Node.js / Baileys).
5. Klik **🧪 Test Notifikasi WhatsApp** untuk mencoba pengiriman.
6. Baca dokumentasi selengkapnya di **[README_WHATSAPP.md](./README_WHATSAPP.md)**.

---

## 🗄️ Panduan Integrasi Supabase (Schema v2.1)

Panduan ini menjamin integrasi database **Supabase** berhasil 100% tanpa error tipe data atau permissions.

---

## 📋 Daftar Isi
1. [Prasyarat](#1-prasyarat)
2. [Langkah 1: Membuat Project di Supabase](#langkah-1-membuat-project-di-supabase)
3. [Langkah 2: Menjalankan Database Schema v2.1 (SQL)](#langkah-2-menjalankan-database-schema-v21-sql)
4. [Langkah 3: Konfigurasi Storage Bucket (CV & Dokumen)](#langkah-3-konfigurasi-storage-bucket-cv--dokumen)
5. [Langkah 4: Mendapatkan URL & Anon Key Supabase](#langkah-4-mendapatkan-url--anon-key-supabase)
6. [Langkah 5: Menghubungkan ke Aplikasi (2 Pilihan Cara)](#langkah-5-menghubungkan-ke-aplikasi-2-pilihan-cara)
   - [Opsi A: Melalui Menu Pengaturan di UI (Instan)](#opsi-a-melalui-menu-pengaturan-di-ui-instan)
   - [Opsi B: Melalui Environment Variables (`.env`)](#opsi-b-melalui-environment-variables-env)
7. [Langkah 6: Verifikasi Koneksi & Sinkronisasi Data](#langkah-6-verifikasi-koneksi--sinkronisasi-data)
8. [Struktur Relasi Tabel Supabase](#-struktur-relasi-tabel-supabase)
9. [Panduan Mengatasi Masalah (Troubleshooting)](#-panduan-mengatasi-masalah-troubleshooting)

---

## 1. Prasyarat
- Akun [Supabase](https://supabase.com) (Gratis).
- Browser untuk mengakses dashboard Supabase.

---

## Langkah 1: Membuat Project di Supabase
1. Masuk ke [Supabase Dashboard](https://app.supabase.com/).
2. Klik tombol **New Project**.
3. Isi data project:
   - **Name**: `job-application-tracker` (atau nama pilihan Anda).
   - **Database Password**: Masukkan password yang kuat (simpan di catatan aman).
   - **Region**: Pilih region terdekat (misal: *Singapore* untuk latensi terbaik).
   - **Pricing Plan**: Free Tier.
4. Klik **Create new project** dan tunggu 1-2 menit hingga status database siap (*Active*).

---

## Langkah 2: Menjalankan Database Schema v2.1 (SQL)

> 💡 **Penting:** Script schema SQL terbaru sudah dioptimasi menggunakan tipe primary key `TEXT` fleksibel sehingga mendukung kedua format ID (baik UUID standar maupun string client seperti `app-001` atau `app-lxxx`), serta menggunakan klausa idempotent (`DROP POLICY IF EXISTS`) sehingga aman dijalankan berulang kali.

File schema lengkap berada di: **`supabase_schema.sql`** pada root project (atau dapat disalin langsung dari tab **Settings > Supabase Cloud** di aplikasi).

### Cara Menjalankan Query:
1. Buka dashboard project Supabase Anda.
2. Di sidebar kiri, klik menu **SQL Editor** (ikon `>_`).
3. Klik tombol **New query**.
4. Buka file `supabase_schema.sql` (atau klik tombol **Salin Seluruh SQL Schema** di tab Settings aplikasi), lalu tempelkan (*paste*) ke dalam SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter` / `Cmd + Enter`).
6. Pastikan muncul notifikasi sukses: `Success. No rows returned`.

> **Tabel yang otomatis dibuat:**
> - `applications` (Data lamaran pekerjaan, status, gaji, kontak rekruter)
> - `application_events` (Milestone & timeline riwayat per lamaran)
> - `interviews` (Jadwal interview, tipe, interviewer, meeting link, Q&A)
> - `documents` (Metadata dokumen: CV, Cover Letter, Portofolio)
> - `notifications` (Pemberitahuan in-app & reminder)
> - `user_settings` (Konfigurasi tema, preferensi reminder & WhatsApp)
> - Storage bucket: `application-documents` beserta policy keamanannya.

---

## Langkah 3: Konfigurasi Storage Bucket (CV & Dokumen)
Schema di `supabase_schema.sql` sudah otomatis mendaftarkan bucket `application-documents` dengan akses publik. Untuk memastikannya:
1. Di sidebar kiri dashboard Supabase, klik **Storage**.
2. Pastikan Anda melihat bucket bernama **`application-documents`** dengan badge **Public**.
3. Jika belum muncul, klik **New bucket**:
   - Bucket name: `application-documents`
   - Centang opsi: **Public bucket**
   - File size limit: `50MB` (opsional)
   - Klik **Save**.

---

## Langkah 4: Mendapatkan URL & Anon Key Supabase
1. Di dashboard Supabase, klik ikon **Settings** (⚙️) di sidebar kiri bagian bawah.
2. Pilih menu **API** (di bawah kategori *Project Settings*).
3. Salin 2 nilai penting berikut:
   - **Project URL**: contoh `https://abcdefghijklmnop.supabase.co`
   - **Project API keys** -> **`anon` `public`**: contoh `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Langkah 5: Menghubungkan ke Aplikasi (2 Pilihan Cara)

### Opsi A: Melalui Menu Pengaturan di UI (Instan & Direkomendasikan)
1. Buka aplikasi Job Application Tracker di browser.
2. Klik tab **Settings** (⚙️) pada navigasi atas.
3. Pilih sub-tab **Supabase Cloud**.
4. Masukkan:
   - **Supabase Project URL**: Tempelkan URL dari Langkah 4.
   - **Supabase Anon Public API Key**: Tempelkan Anon Key dari Langkah 4.
5. Klik tombol **Test Connection** untuk memverifikasi kesehatan koneksi & tabel.
6. Klik **Simpan & Hubungkan**.
7. Status badge akan langsung berubah menjadi hijau: **Connected (Cloud Active)**!

### Opsi B: Melalui Environment Variables (`.env`)
Jika Anda ingin menyetel default secara global:
1. Buat file `.env` di root folder proyek (salin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan masukkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
   ```
3. Restart development server (`npm run dev`).

---

## Langkah 6: Verifikasi Koneksi & Sinkronisasi Data

1. **Uji Koneksi:** Di tab **Settings > Supabase Cloud**, klik **Test Connection**. Jika sukses, akan muncul pesan hijau:
   > *"Koneksi ke Supabase berhasil dan seluruh tabel siap digunakan!"*
2. **Sinkronisasi Data Lokal ke Cloud:**
   - Klik tombol **Upload Data Lokal ke Cloud**.
   - Sistem akan mengunggah seluruh lamaran, interview, dokumen, dan timeline lokal yang ada ke tabel database Supabase Anda.
3. **Tarik Data dari Cloud (Jika login di perangkat baru):**
   - Klik tombol **Tarik Data dari Cloud (Pull)** untuk mengunduh seluruh data dari Supabase ke browser saat ini.

---

## 📊 Struktur Relasi Tabel Supabase

```
+-------------------------------------------------------------+
|                        applications                         |
+-------------------------------------------------------------+
| id (TEXT, PK) - Mendukung UUID & String 'app-xxx'           |
| company (TEXT), position (TEXT), location (TEXT)            |
| status ('Wishlist'..'Applied'..'Interview'..'Accepted'..)   |
| work_type, employment_type, salary, deadline, job_url, etc. |
+------------------------------+------------------------------+
                               | 1:N (ON DELETE CASCADE)
       +-----------------------+-----------------------+
       |                                               |
+------v----------------------+             +----------v------------------+
|      application_events     |             |         interviews          |
+-----------------------------+             +-----------------------------+
| id (TEXT, PK)               |             | id (TEXT, PK)               |
| application_id (TEXT, FK)   |             | application_id (TEXT, FK)   |
| title (TEXT), description   |             | type, scheduled_at, result  |
| event_date (TIMESTAMPTZ)    |             | meeting_url, questions      |
+-----------------------------+             +-----------------------------+
       |
+------v----------------------+             +-----------------------------+
|          documents          |             |        user_settings        |
+-----------------------------+             +-----------------------------+
| id (TEXT, PK)               |             | id ('default_user', PK)     |
| application_id (TEXT, FK)   |             | theme, reminders, currency  |
| name, type, file_url, size  |             | whatsapp_notification_types |
+-----------------------------+             +-----------------------------+
```

---

## 🛠️ Panduan Mengatasi Masalah (Troubleshooting)

| Gejala / Pesan Error | Penyebab | Solusi |
| :--- | :--- | :--- |
| **`relation "applications" does not exist` (42P01)** | Tabel belum dibuat di Supabase. | Salin seluruh isi file `supabase_schema.sql` dan jalankan di **SQL Editor** Supabase. |
| **`invalid input syntax for type uuid: "app-001"` (22P02)** | Kolom ID menggunakan tipe UUID kaku, bukan TEXT. | Jalankan script `supabase_schema.sql` terbaru (v2.1) yang sudah menggunakan tipe `TEXT PRIMARY KEY` fleksibel. |
| **`new row violates row-level security policy` (42501)** | RLS aktif namun belum mengizinkan role `anon`. | Jalankan bagian Section 5 di `supabase_schema.sql` untuk mengaktifkan policy akses anon dan authenticated. |
| **`policy "..." already exists` (42710)** | Policy sudah ada dari eksekusi sebelumnya. | `supabase_schema.sql` v2.1 sudah menyertakan `DROP POLICY IF EXISTS` sebelum setiap `CREATE POLICY`. Jalankan script terbaru. |
| **Upload Dokumen / CV gagal disimpan ke Storage** | Storage bucket belum dibuat atau belum Public. | Pastikan bucket `application-documents` dibuat dengan toggle **Public bucket** aktif di menu Storage Supabase. |
| **Status tetap 'Offline' di aplikasi** | URL atau Anon Key belum dimasukkan / salah format. | Pastikan URL dimulai dengan `https://` (tanpa garis miring `/` di akhir) dan simpan kredensial di tab **Settings > Supabase Cloud**. |

---

Selamat menggunakan **Personal Job Application Tracker** dengan sinkronisasi cloud Supabase!
