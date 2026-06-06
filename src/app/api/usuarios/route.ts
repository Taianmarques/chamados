import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["ADMIN", "SUPERVISOR"].includes(user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 10);

  const novoUsuario = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hash,
      role: body.role ?? "SOLICITANTE",
    },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(novoUsuario, { status: 201 });
}
