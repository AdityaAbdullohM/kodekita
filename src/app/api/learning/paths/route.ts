import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ message: "Student ID wajib diisi." }, { status: 400 });
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true } });
  if (!student || student.role !== "STUDENT") return NextResponse.json({ message: "Akses siswa diperlukan." }, { status: 403 });
  const paths = await prisma.learningPath.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      materials: {
        orderBy: { createdAt: "asc" },
        include: { questions: { select: { id: true, prompt: true, options: true } }, reads: { where: { studentId }, select: { readAt: true } } },
      },
    },
  });
  const answers = await prisma.questionAnswer.findMany({ where: { studentId }, select: { questionId: true, answer: true, isCorrect: true } });
  return NextResponse.json({ paths, answers });
}
