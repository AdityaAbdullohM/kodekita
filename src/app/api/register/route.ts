import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "TEACHER" ? "TEACHER" : "STUDENT";

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Nama, email, dan kata sandi wajib diisi." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ message: "Format email belum valid." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Kata sandi minimal 8 karakter." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email tersebut sudah terdaftar." }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash, role } });

    return NextResponse.json({ message: "Akun berhasil dibuat." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Pendaftaran gagal. Coba lagi." }, { status: 500 });
  }
}