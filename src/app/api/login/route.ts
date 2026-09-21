import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const requestedRole = body.role === "TEACHER" ? "TEACHER" : "STUDENT";

    if (!email || !password) {
      return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user ? await compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches || user.role !== requestedRole) {
      return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ message: "Layanan login sedang bermasalah. Coba lagi." }, { status: 500 });
  }
}