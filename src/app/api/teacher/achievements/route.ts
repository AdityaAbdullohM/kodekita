import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verifyTeacher(teacherId: string) {
  if (!teacherId) return false;
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
  return teacher?.role === "TEACHER";
}

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId") ?? "";
  if (!(await verifyTeacher(teacherId))) return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });

  const badges = await prisma.badge.findMany({
    orderBy: { code: "asc" },
    include: { userBadges: { orderBy: { unlockedAt: "desc" }, include: { student: { select: { id: true, name: true, email: true } } } } },
  });

  return NextResponse.json({ badges });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "Belajar";
    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "Award";
    const tone = typeof body.tone === "string" && body.tone.trim() ? body.tone.trim() : "purple";
    if (!(await verifyTeacher(teacherId))) return NextResponse.json({ message: "Akses guru diperlukan." }, { status: 403 });
    if (!title || !description) return NextResponse.json({ message: "Judul dan deskripsi wajib diisi." }, { status: 400 });

    const baseCode = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "achievement";
    const code = `${baseCode}-${Date.now()}`;
    const badge = await prisma.badge.create({ data: { code, title, description, category, icon, tone } });
    return NextResponse.json({ badge }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Pencapaian gagal dibuat." }, { status: 500 });
  }
}