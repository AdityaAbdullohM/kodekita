import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ pathId: string }> }) {
  try {
    const { pathId } = await context.params;
    const form = await request.formData();
    const teacherId = String(form.get("teacherId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const fileEntry = form.get("file");
    const file = fileEntry && typeof fileEntry !== "string" ? fileEntry : null;
    const questionPrompt = String(form.get("questionPrompt") ?? "").trim();
    const questionOptions = String(form.get("questionOptions") ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const answer = String(form.get("answer") ?? "").trim();
    const missingFields = [
      !teacherId && "teacherId",
      !title && "judul materi",
      !description && "ringkasan",
      !file && "file materi",
      !questionPrompt && "pertanyaan pemahaman",
      questionOptions.length < 2 && "minimal dua pilihan jawaban",
      !answer && "jawaban benar",
    ].filter(Boolean);
    if (missingFields.length > 0) {
      return NextResponse.json({ message: `Field belum lengkap: ${missingFields.join(", ")}.` }, { status: 400 });
    }
    if (!file) return NextResponse.json({ message: "File materi wajib diisi." }, { status: 400 });
    const learningPath = await prisma.learningPath.findFirst({ where: { id: pathId, teacherId }, select: { id: true } });
    if (!learningPath) return NextResponse.json({ message: "Jalur belajar tidak ditemukan." }, { status: 404 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ message: "Ukuran file maksimal 10 MB." }, { status: 400 });
    const extension = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "");
    const storedName = `${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()));
    const material = await prisma.material.create({
      data: {
        pathId,
        title,
        description,
        fileName: file.name,
        fileUrl: `/uploads/${storedName}`,
        questions: { create: { prompt: questionPrompt, options: questionOptions, answer } },
      },
      include: { questions: true },
    });
    return NextResponse.json({ material }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Materi gagal disimpan." }, { status: 500 });
  }
}
