import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const starterChallenges = [
  { title: "Landing page responsif", description: "Buat halaman profil sederhana yang tetap rapi di layar laptop dan ponsel menggunakan HTML dan CSS.", category: "CSS", level: "Pemula", xp: 120, minutes: 35 },
  { title: "Flexbox layout sprint", description: "Susun tiga kartu fitur dalam satu layout fleksibel dengan jarak, alignment, dan wrapping yang tepat.", category: "CSS", level: "Pemula", xp: 150, minutes: 30 },
  { title: "Interaksi tombol pertama", description: "Buat tombol yang dapat mengubah teks dan warna halaman saat diklik dengan JavaScript.", category: "JavaScript", level: "Pemula", xp: 180, minutes: 40 },
];

const starterUnderstandingQuestions = [
  { prompt: "Apa hasil dari kode berikut?", options: ["Judul besar tampil di halaman", "Gambar tampil di halaman", "Data masuk database", "Tombol menjadi aktif"], answer: "Judul besar tampil di halaman", code: "<h1>Belajar Web</h1>" },
  { prompt: "Apa fungsi kode CSS berikut?", options: ["Mengubah warna teks menjadi merah", "Mengubah teks menjadi judul HTML", "Menghapus elemen title", "Membuat background gambar"], answer: "Mengubah warna teks menjadi merah", code: ".title { color: red; }" },
  { prompt: "Apa hasil kode JavaScript berikut?", options: ["Variabel total bernilai 5", "Variabel total bernilai 23", "Halaman menjadi kosong", "Muncul gambar angka"], answer: "Variabel total bernilai 5", code: "const total = 2 + 3;" },
  { prompt: "Apa tujuan CSS berikut pada sebuah container?", options: ["Mengatur anak elemen dengan layout Flexbox", "Mengubah container menjadi database", "Menjalankan JavaScript", "Menghapus semua anak elemen"], answer: "Mengatur anak elemen dengan layout Flexbox", code: ".container { display: flex; }" },
  { prompt: "Apa arti responsive design?", options: ["Tampilan menyesuaikan ukuran layar", "Tampilan hanya untuk desktop", "Website tanpa warna", "Halaman tanpa gambar"], answer: "Tampilan menyesuaikan ukuran layar", code: "@media (max-width: 600px) { ... }" },
  { prompt: "Tag mana yang tepat untuk navigasi utama?", options: ["<nav>", "<image>", "<database>", "<style>"], answer: "<nav>", code: "<nav>Menu utama</nav>" },
  { prompt: "Apa kegunaan CSS Grid berikut?", options: ["Membuat dua kolom dengan lebar seimbang", "Membuat dua database", "Membuat dua fungsi JavaScript", "Menghapus dua kolom"], answer: "Membuat dua kolom dengan lebar seimbang", code: ".grid { grid-template-columns: 1fr 1fr; }" },
  { prompt: "Apa yang dilakukan kode berikut?", options: ["Menjalankan run saat button diklik", "Menghapus button saat halaman dibuka", "Mengubah button menjadi gambar", "Membuat database baru"], answer: "Menjalankan run saat button diklik", code: "button.addEventListener('click', run)" },
  { prompt: "Mengapa class CSS berguna?", options: ["Style dapat dipakai ulang pada beberapa elemen", "Class hanya untuk menyimpan password", "Class menjalankan server", "Class menghapus HTML"], answer: "Style dapat dipakai ulang pada beberapa elemen", code: ".card { padding: 16px; }" },
  { prompt: "Apa fungsi utama JavaScript pada website?", options: ["Menambahkan interaksi dinamis", "Mengganti HTML menjadi gambar", "Menghapus CSS", "Membuat kabel jaringan"], answer: "Menambahkan interaksi dinamis", code: "button.textContent = 'Selesai';" },
];

const starterUnderstandingMaterials = [
  { title: "HTML & Struktur", description: "Pahami struktur, tag, dan makna halaman web.", category: "HTML", level: "Pemula", xp: 100, minutes: 20 },
  { title: "CSS & Layout", description: "Kenali styling, responsive design, Flexbox, dan Grid.", category: "CSS", level: "Pemula", xp: 100, minutes: 20 },
  { title: "JavaScript & Interaksi", description: "Pelajari dasar interaksi dinamis pada website.", category: "JavaScript", level: "Menengah", xp: 120, minutes: 25 },
];

async function ensureStarterChallenges() {
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" }, select: { id: true } });
  if (!teacher) return;

  await Promise.all(starterChallenges.map(async (challenge) => {
    const existing = await prisma.challenge.findFirst({ where: { teacherId: teacher.id, title: challenge.title }, select: { id: true } });
    if (!existing) await prisma.challenge.create({ data: { teacherId: teacher.id, ...challenge } });
  }));
  await Promise.all(starterUnderstandingMaterials.map(async (challenge) => {
    const existing = await prisma.challenge.findFirst({ where: { teacherId: teacher.id, title: challenge.title }, select: { id: true } });
    if (!existing) await prisma.challenge.create({ data: { teacherId: teacher.id, ...challenge, mode: "pemahaman", questions: starterUnderstandingQuestions } });
  }));
}

export async function GET(request: Request) {
  try {
    const studentId = new URL(request.url).searchParams.get("studentId");
    await ensureStarterChallenges();
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        level: true,
        xp: true,
        minutes: true,
        mode: true,
        questions: true,
      },
    });
    const student = studentId ? await prisma.user.findUnique({
      where: { id: studentId },
      select: { xp: true, challengeCompletions: { select: { challengeId: true } } },
    }) : null;

    return NextResponse.json({
      challenges,
      totalXp: student?.xp ?? 0,
      completedChallengeIds: student?.challengeCompletions.map((completion) => completion.challengeId) ?? [],
    });
  } catch {
    return NextResponse.json({ message: "Tantangan belum dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    if (!studentId || !challengeId) return NextResponse.json({ message: "Siswa dan challenge wajib diisi." }, { status: 400 });

    const [student, challenge] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId }, select: { role: true } }),
      prisma.challenge.findUnique({ where: { id: challengeId }, select: { xp: true } }),
    ]);
    if (!student || student.role !== "STUDENT") return NextResponse.json({ message: "Akses siswa diperlukan." }, { status: 403 });
    if (!challenge) return NextResponse.json({ message: "Challenge tidak ditemukan." }, { status: 404 });

    const result = await prisma.$transaction(async (transaction) => {
      const completion = await transaction.challengeCompletion.createMany({
        data: { studentId, challengeId },
        skipDuplicates: true,
      });
      if (completion.count === 1) {
        await transaction.user.update({ where: { id: studentId }, data: { xp: { increment: challenge.xp } } });
      }
      const updatedStudent = await transaction.user.findUniqueOrThrow({ where: { id: studentId }, select: { xp: true } });
      return { awarded: completion.count === 1, totalXp: updatedStudent.xp };
    });

    return NextResponse.json({ message: result.awarded ? "Challenge selesai. XP berhasil ditambahkan." : "Challenge sudah pernah diselesaikan.", ...result });
  } catch {
    return NextResponse.json({ message: "XP gagal disimpan." }, { status: 500 });
  }
}
