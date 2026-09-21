import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId");
  if (!teacherId) return NextResponse.json({ message: "Teacher ID wajib diisi." }, { status: 400 });
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
  if (!teacher || teacher.role !== "TEACHER") return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });
  const challenges = await prisma.challenge.findMany({ where: { teacherId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ challenges });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!teacherId || !title || !description) return NextResponse.json({ message: "Judul dan deskripsi wajib diisi." }, { status: 400 });
    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
    if (!teacher || teacher.role !== "TEACHER") return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });
    const mode = body.mode === "pemahaman" ? "pemahaman" : "coding";
    const questions = Array.isArray(body.questions) ? body.questions.slice(0, 10) : null;
    if (mode === "pemahaman" && (!questions || questions.length !== 10)) return NextResponse.json({ message: "Mode pemahaman wajib memiliki 10 soal." }, { status: 400 });
    const challenge = await prisma.challenge.create({ data: { teacherId, title, description, category: body.category || "JavaScript", level: body.level || "Pemula", xp: Number(body.xp) || 100, minutes: Number(body.minutes) || 30, mode, questions } });
    return NextResponse.json({ challenge }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Tantangan gagal dibuat." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    if (!teacherId || !challengeId) return NextResponse.json({ message: "Guru dan challenge wajib diisi." }, { status: 400 });

    const challenge = await prisma.challenge.findFirst({ where: { id: challengeId, teacherId }, select: { id: true, xp: true } });
    if (!challenge) return NextResponse.json({ message: "Challenge tidak ditemukan." }, { status: 404 });

    const resetCount = await prisma.$transaction(async (transaction) => {
      const completions = await transaction.challengeCompletion.findMany({ where: { challengeId }, select: { studentId: true } });
      await Promise.all(completions.map((completion) => transaction.user.update({ where: { id: completion.studentId }, data: { xp: { decrement: challenge.xp } } })));
      await transaction.challengeCompletion.deleteMany({ where: { challengeId } });
      return completions.length;
    });

    return NextResponse.json({ message: "Progress challenge berhasil direset.", resetCount });
  } catch {
    return NextResponse.json({ message: "Challenge gagal direset." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const mode = body.mode === "pemahaman" ? "pemahaman" : "coding";
    const questions = Array.isArray(body.questions) ? body.questions.slice(0, 10) : null;
    if (!teacherId || !challengeId || !body.title || !body.description) return NextResponse.json({ message: "Data challenge belum lengkap." }, { status: 400 });
    if (mode === "pemahaman" && (!questions || questions.length !== 10)) return NextResponse.json({ message: "Mode pemahaman wajib memiliki 10 soal." }, { status: 400 });
    const challenge = await prisma.challenge.updateMany({ where: { id: challengeId, teacherId }, data: { title: String(body.title).trim(), description: String(body.description).trim(), category: body.category || "JavaScript", level: body.level || "Pemula", xp: Number(body.xp) || 100, minutes: Number(body.minutes) || 30, mode, questions } });
    if (!challenge.count) return NextResponse.json({ message: "Challenge tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ message: "Challenge berhasil diperbarui." });
  } catch {
    return NextResponse.json({ message: "Challenge gagal diperbarui." }, { status: 500 });
  }
}