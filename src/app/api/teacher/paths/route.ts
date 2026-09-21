import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId");
  if (!teacherId) return NextResponse.json({ message: "Teacher ID wajib diisi." }, { status: 400 });
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
  if (!teacher || teacher.role !== "TEACHER") return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });
  const paths = await prisma.learningPath.findMany({ where: { teacherId }, orderBy: { createdAt: "desc" }, include: { materials: { include: { questions: true, _count: { select: { reads: true } } } } } });
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true, email: true } });
  const materialIds = paths.flatMap((path) => path.materials.map((material) => material.id));
  const [reads, answers] = await Promise.all([
    prisma.materialRead.findMany({ where: { materialId: { in: materialIds } }, select: { studentId: true, materialId: true } }),
    prisma.questionAnswer.findMany({ where: { question: { material: { path: { teacherId } } } }, select: { studentId: true, questionId: true, isCorrect: true } }),
  ]);
  const monitoring = students.map((student) => ({
    ...student,
    readCount: reads.filter((read) => read.studentId === student.id).length,
    answeredCount: answers.filter((answer) => answer.studentId === student.id).length,
    correctCount: answers.filter((answer) => answer.studentId === student.id && answer.isCorrect).length,
  }));
  return NextResponse.json({ paths, monitoring });
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
    const path = await prisma.learningPath.create({ data: { teacherId, title, description, category: body.category || "Frontend", level: body.level || "Pemula" } });
    return NextResponse.json({ path }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Jalur belajar gagal dibuat." }, { status: 500 });
  }
}