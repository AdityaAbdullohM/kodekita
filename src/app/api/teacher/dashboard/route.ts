import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const teacherId = new URL(request.url).searchParams.get("teacherId");
    if (!teacherId) return NextResponse.json({ message: "Teacher ID wajib diisi." }, { status: 400 });

    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
    if (!teacher || teacher.role !== "TEACHER") return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });

    const [pathsCount, challengesCount, studentCount, materialCount, submissionCount, paths, challenges] = await Promise.all([
      prisma.learningPath.count({ where: { teacherId } }),
      prisma.challenge.count({ where: { teacherId } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.material.count({ where: { path: { teacherId } } }),
      prisma.questionAnswer.count({ where: { question: { material: { path: { teacherId } } } } }),
      prisma.learningPath.findMany({ where: { teacherId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, description: true, category: true, level: true, _count: { select: { materials: true } } } }),
      prisma.challenge.findMany({ where: { teacherId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, category: true, level: true, xp: true, minutes: true } }),
    ]);

    return NextResponse.json({
      stats: { pathsCount, challengesCount, studentCount, materialCount, submissionCount },
      paths: paths.map((path) => ({ ...path, materialCount: path._count.materials })),
      challenges,
    });
  } catch {
    return NextResponse.json({ message: "Data dashboard guru belum dapat dimuat." }, { status: 500 });
  }
}