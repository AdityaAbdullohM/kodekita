import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const materialId = typeof body.materialId === "string" ? body.materialId : "";
    if (!studentId || !materialId) return NextResponse.json({ message: "Materi dan siswa wajib diisi." }, { status: 400 });
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true, xp: true } });
    if (!student || student.role !== "STUDENT") return NextResponse.json({ message: "Akses siswa diperlukan." }, { status: 403 });
    let isCorrect: boolean | null = null;
    if (typeof body.questionId === "string" && typeof body.answer === "string") {
      const question = await prisma.question.findUnique({ where: { id: body.questionId }, select: { answer: true, xp: true, materialId: true } });
      if (!question) return NextResponse.json({ message: "Pertanyaan tidak ditemukan." }, { status: 404 });
      if (question.materialId !== materialId) return NextResponse.json({ message: "Pertanyaan tidak cocok dengan materi." }, { status: 400 });
      const answer = body.answer.trim();
      const today = getToday();
      const attempts = await prisma.quickCheckAttempt.findMany({ where: { studentId, questionId: body.questionId, attemptDate: today }, select: { isCorrect: true } });
      const attemptsUsed = attempts.length;
      if (attempts.some((attempt) => attempt.isCorrect) || attemptsUsed >= 2) {
        return NextResponse.json({ message: "Quick check hari ini sudah selesai.", isCorrect: null, locked: true, attemptsUsed, attemptsRemaining: 0 }, { status: 409 });
      }
      isCorrect = answer === question.answer;
      const result = await prisma.$transaction(async (transaction) => {
        await transaction.quickCheckAttempt.create({ data: { studentId, questionId: body.questionId, attemptDate: today, answer, isCorrect: isCorrect as boolean } });
        await transaction.questionAnswer.upsert({
          where: { studentId_questionId: { studentId, questionId: body.questionId } },
          update: { answer, isCorrect: isCorrect as boolean },
          create: { studentId, questionId: body.questionId, answer, isCorrect: isCorrect as boolean },
        });
        await transaction.materialRead.upsert({ where: { studentId_materialId: { studentId, materialId } }, update: {}, create: { studentId, materialId } });
        const updatedStudent = isCorrect
          ? await transaction.user.update({ where: { id: studentId }, data: { xp: { increment: question.xp } }, select: { xp: true } })
          : { xp: student.xp };
        return { totalXp: updatedStudent.xp };
      });
      return NextResponse.json({ message: isCorrect ? `Jawaban benar. Kamu mendapatkan ${question.xp} XP.` : "Jawaban belum tepat.", isCorrect, locked: isCorrect || attemptsUsed + 1 >= 2, attemptsUsed: attemptsUsed + 1, attemptsRemaining: isCorrect ? 0 : Math.max(0, 2 - attemptsUsed - 1), totalXp: result.totalXp });
    }
    await prisma.materialRead.upsert({ where: { studentId_materialId: { studentId, materialId } }, update: {}, create: { studentId, materialId } });
    return NextResponse.json({ message: "Progres tersimpan.", isCorrect });
  } catch {
    return NextResponse.json({ message: "Progres gagal disimpan." }, { status: 500 });
  }
}
