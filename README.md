# 🚀 Panduan Integrasi Supabase - Personal Job Application Tracker

Dokumen ini berisi panduan lengkap langkah demi langkah untuk mengintegrasikan database **Supabase** dengan aplikasi **Personal Job Application Tracker**.

---

## 📋 Daftar Isi
1. [Prasyarat](#1-prasyarat)
2. [Langkah 1: Membuat Project di Supabase](#langkah-1-membuat-project-di-supabase)
3. [Langkah 2: Menjalankan Database Schema (SQL)](#langkah-2-menjalankan-database-schema-sql)
4. [Langkah 3: Konfigurasi Storage Bucket (CV & Dokumen)](#langkah-3-konfigurasi-storage-bucket-cv--dokumen)
5. [Langkah 4: Mendapatkan URL & Anon Key Supabase](#langkah-4-mendapatkan-url--anon-key-supabase)
6. [Langkah 5: Menghubungkan ke Aplikasi (2 Pilihan Cara)](#langkah-5-menghubungkan-ke-aplikasi-2-pilihan-cara)
   - [Opsi A: Melalui Menu Pengaturan di UI (Instan & Tanpa Rebuild)](#opsi-a-melalui-menu-pengaturan-di-ui-instan)
   - [Opsi B: Melalui Environment Variables (`.env`)](#opsi-b-melalui-environment-variables-env)
7. [Langkah 6: Verifikasi & Uji Koneksi](#langkah-6-verifikasi--uji-koneksi)
8. [Struktur Relasi Tabel Supabase](#struktur-relasi-tabel-supabase)

---

## 1. Prasyarat
- Akun [Supabase](https://supabase.com) (Gratis).
- Browser untuk mengakses dashboard Supabase.

---

## Langkah 1: Membuat Project di Supabase
1. Masuk ke [Supabase Dashboard](https://app.supabase.com/).
2. Klik tombol **New Project**.
3. Isi informasi project:
   - **Name**: `job-application-tracker` (atau nama pilihan Anda).
   - **Database Password**: Masukkan password yang kuat (simpan di tempat aman).
   - **Region**: Pilih region terdekat (misal: *Singapore / Southeast Asia* untuk latensi terbaik di Indonesia).
   - **Pricing Plan**: Free Tier.
4. Klik **Create new project** dan tunggu 1-2 menit hingga status database siap (*Active*).

---

## Langkah 2: Menjalankan Database Schema (SQL)
File schema SQL lengkap sudah disiapkan di file: **`supabase_schema.sql`** pada root project.

1. Buka dashboard project Supabase Anda.
2. Di sidebar kiri, klik menu **SQL Editor** (ikon `>_`).
3. Klik tombol **New query**.
4. Buka file `supabase_schema.sql`, salin seluruh kodenya, dan tempelkan (*paste*) ke dalam SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter` / `Cmd + Enter`).
6. Pastikan muncul pesan sukses: `Success. No rows returned`.

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
Schema di `supabase_schema.sql` sudah otomatis mendaftarkan bucket `application-documents`. Untuk memastikan:
1. Di sidebar kiri Supabase, klik **Storage**.
2. Pastikan Anda melihat bucket bernama **`application-documents`** dengan label **Public**.
3. Jika belum muncul, klik **New bucket**:
   - Bucket name: `application-documents`
   - Centang opsi: **Public bucket**
   - Klik **Save**.

---

## Langkah 4: Mendapatkan URL & Anon Key Supabase
1. Di sidebar kiri Supabase, klik ikon **Settings** (⚙️) di bagian paling bawah.
2. Pilih sub-menu **API** (di bawah bagian *Project Settings*).
3. Salin 2 nilai berikut:
   - **Project URL**: contoh `https://xyzabcdefghijklmnop.supabase.co`
   - **Project API keys** -> **`anon` `public`**: contoh `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Langkah 5: Menghubungkan ke Aplikasi (2 Pilihan Cara)

### Opsi A: Melalui Menu Pengaturan di UI (Instan)
Cara ini paling cepat dan langsung berfungsi di browser tanpa perlu restart dev server:
1. Buka aplikasi Job Application Tracker di browser.
2. Klik menu **Settings** (ikon gerigi) pada navigasi bar / sidebar.
3. Gulir ke bagian **Supabase Cloud Sync**.
4. Masukkan:
   - **Supabase Project URL**: Tempelkan URL dari Langkah 4.
   - **Supabase Anon Key**: Tempelkan Anon Public Key dari Langkah 4.
5. Klik tombol **Test Connection** untuk memverifikasi.
6. Klik **Save Credentials**.
7. Sekarang status indikator akan berubah menjadi **Connected (Cloud Active)**!

### Opsi B: Melalui Environment Variables (`.env`)
Jika Anda ingin menyetel default secara global pada codebase:
1. Buat file `.env` di root folder proyek (salin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan masukkan kredensial Supabase:
   ```env
   VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
   ```
3. Restart development server jika sedang berjalan.

---

## Langkah 6: Verifikasi & Uji Koneksi
1. Buka menu **Settings** di aplikasi.
2. Klik tombol **Test Connection**.
3. Jika berhasil, sistem akan menampilkan notifikasi hijau:
   > *"Successfully connected to Supabase database!"*
4. Anda juga bisa mengklik **Sync / Upload Local Data to Cloud** untuk mengirim data lokal yang sudah ada langsung ke tabel Supabase.

---

## 📊 Struktur Relasi Tabel Supabase

```
+-------------------------------------------------------------+
|                        applications                         |
+-------------------------------------------------------------+
| id (UUID, PK)                                               |
| company (TEXT)                                              |
| position (TEXT)                                             |
| status ('Wishlist'..'Accepted'..'Rejected'..)               |
| work_type, employment_type, salary, deadline, etc.          |
+------------------------------+------------------------------+
                               | 1:N (ON DELETE CASCADE)
       +-----------------------+-----------------------+
       |                                               |
+------v----------------------+             +----------v------------------+
|      application_events     |             |         interviews          |
+-----------------------------+             +-----------------------------+
| id (UUID, PK)               |             | id (UUID, PK)               |
| application_id (UUID, FK)   |             | application_id (UUID, FK)   |
| title (TEXT)                |             | type, scheduled_at, result  |
| event_date (TIMESTAMPTZ)    |             | meeting_url, questions      |
+-----------------------------+             +-----------------------------+
       |
+------v----------------------+             +-----------------------------+
|          documents          |             |        user_settings        |
+-----------------------------+             +-----------------------------+
| id (UUID, PK)               |             | id ('default_user', PK)     |
| application_id (UUID, FK)   |             | theme, reminders, currency  |
| name, type, file_url, size  |             | whatsapp_notification_types |
+-----------------------------+             +-----------------------------+
```

---

## 🛠️ Tips Troubleshooting
- **Error: `relation "applications" does not exist`**: Pastikan seluruh query di `supabase_schema.sql` sudah dieksekusi di SQL Editor Supabase.
- **Error RLS (Row Level Security Policy)**: `supabase_schema.sql` sudah menyertakan policy RLS untuk mode `anon, authenticated`. Pastikan bagian Section 5 dieksekusi agar aplikasi memiliki izin Read & Write.
- **Upload CV/Dokumen gagal**: Pastikan Storage bucket `application-documents` berstatus **Public** dan policy storage di Section 6 sudah dijalankan.

Selamat mengintegrasikan! Jika ada bagian yang ingin disesuaikan, seluruh script SQL dapat diubah sesuai kebutuhan Anda.
