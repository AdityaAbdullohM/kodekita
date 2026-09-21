# KODEKITA

> Ruang belajar coding untuk siswa yang ingin bergerak dari rasa ingin tahu menjadi karya web.

KODEKITA adalah platform belajar coding dengan jalur belajar terstruktur, materi dari guru, quick check, challenge coding, XP, streak, pencapaian, dan leaderboard.

## Fitur Utama

| Area | Fitur |
| --- | --- |
| Autentikasi | Login, registrasi, pilihan role siswa atau guru, dan pemulihan sesi. |
| Dashboard siswa | Modul aktif, progres, XP, streak, quick check, insight, dan leaderboard. |
| Jalur belajar | Guru membuat jalur dan materi; siswa membaca materi dan menjawab pertanyaan. |
| Challenge coding | Editor HTML, CSS, JavaScript, live preview, catatan, dan contoh solusi. |
| Mode pemahaman | Materi dengan soal pilihan ganda dan snippet kode. |
| Workspace guru | Kelola jalur, materi, challenge, pencapaian, dan monitoring siswa. |
| Responsive UI | Dashboard, form, modal, leaderboard, landing page, dan editor mendukung mobile. |

## Alur Pengguna

```mermaid
flowchart LR
    A[Landing page] --> B{Pilih role}
    B -->|Siswa| C[Dashboard siswa]
    B -->|Guru| D[Workspace guru]
    D --> E[Buat materi dan challenge]
    E --> C
    C --> F[Belajar dan mengerjakan challenge]
    F --> G[XP, streak, lencana]
    G --> H[Leaderboard]
```

<details>
<summary><strong>Alur siswa</strong></summary>

1. Daftar atau masuk sebagai siswa.
2. Pilih jalur belajar dan buka materi.
3. Jawab quick check atau kuis pemahaman.
4. Kerjakan challenge coding dan lihat hasilnya di live preview.
5. Kumpulkan XP, jaga streak, dan buka lencana.
</details>

<details>
<summary><strong>Alur guru</strong></summary>

1. Daftar atau masuk sebagai guru.
2. Buat jalur belajar dengan kategori dan level.
3. Upload materi beserta pertanyaan pemahaman.
4. Terbitkan challenge coding atau materi pemahaman.
5. Pantau aktivitas siswa dan buat pencapaian kelas.
</details>

## Tech Stack

- Next.js 16 App Router
- React 19 dan TypeScript
- CSS custom responsive
- Prisma 6 dan PostgreSQL
- Lucide React dan Framer Motion
- SweetAlert2
- Manrope dan DM Mono

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 20.9 atau lebih baru
- npm
- PostgreSQL

### Instalasi

```bash
git clone https://github.com/AdityaAbdullohM/kodekita.git
cd kodekita
npm install
```

Buat file `.env` di root project:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kodekita"
```

> Gunakan connection string PostgreSQL sesuai konfigurasi lokal Anda.

Jalankan migrasi dan server:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Perintah yang Tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server development. |
| `npm run lint` | Memeriksa masalah linting. |
| `npm run build` | Membuat production build. |
| `npm run start` | Menjalankan production server. |

## Environment Variable

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Connection string database PostgreSQL untuk Prisma. |

File `.env` tidak boleh di-commit ke repository.

## Struktur Proyek

```text
src/
  app/
    api/                  Route API autentikasi, learning, challenge, dan guru
    globals.css           Design system dan responsive styling
    layout.tsx            Root layout aplikasi
    page.tsx              Landing, autentikasi, dashboard, dan view utama
  lib/
    prisma.ts             Prisma client singleton
prisma/
  schema.prisma           Model database dan relasi
  migrations/             Riwayat perubahan schema
public/
  uploads/                File materi yang dibuka siswa
```

## API Utama

| Endpoint | Method | Kegunaan |
| --- | --- | --- |
| `/api/login` | `POST` | Login siswa atau guru. |
| `/api/register` | `POST` | Registrasi akun baru. |
| `/api/learning/dashboard` | `GET` | Mengambil dashboard dan progres siswa. |
| `/api/learning/paths` | `GET` | Mengambil jalur dan materi siswa. |
| `/api/learning/progress` | `POST` | Menyimpan progres, materi terbaca, dan jawaban. |
| `/api/challenges` | `GET`, `POST` | Mengambil challenge dan menyimpan penyelesaian. |
| `/api/teacher/dashboard` | `GET` | Mengambil ringkasan workspace guru. |
| `/api/teacher/paths` | `GET`, `POST` | Mengelola jalur belajar. |
| `/api/teacher/paths/[pathId]/materials` | `POST` | Mengunggah materi dan pertanyaan. |
| `/api/teacher/challenges` | `GET`, `POST`, `PATCH`, `DELETE` | Mengelola challenge guru. |
| `/api/teacher/achievements` | `GET`, `POST` | Mengelola pencapaian kelas. |
| `/api/teacher/leaderboard` | `GET` | Melihat leaderboard untuk monitoring. |

## Deployment

KODEKITA dapat dideploy ke platform yang mendukung Next.js dan PostgreSQL, seperti Vercel.

1. Import repository GitHub ke platform deployment.
2. Tambahkan `DATABASE_URL` pada environment production.
3. Jalankan `npx prisma migrate deploy` pada tahap deployment.
4. Pastikan penyimpanan file upload menggunakan storage persisten jika platform bersifat ephemeral.

## Catatan Pengembangan

- Perubahan schema database harus dibuat melalui migrasi Prisma.
- Jangan commit credential atau file `.env`.
- Setelah mengubah API, cek tampilan untuk role siswa dan guru.
- Uji halaman utama pada desktop dan mobile.

## Lisensi

Project ini dikembangkan sebagai aplikasi pembelajaran KODEKITA.
