import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const teacherId = new URL(request.url).searchParams.get("teacherId");
    if (!teacherId) return NextResponse.json({ message: "Teacher ID wajib diisi." }, { status: 400 });

    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
    if (!teacher || teacher.role !== "TEACHER") return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });

    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: [{ xp: "desc" }, { name: "asc" }], select: { id: true, name: true, xp: true } });
    return NextResponse.json({ leaderboard: students.map((student, index) => ({ ...student, rank: index + 1, isCurrent: false })) });
  } catch {
    return NextResponse.json({ message: "Leaderboard belum dapat dimuat." }, { status: 500 });
  }
}