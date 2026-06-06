import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    include: { localizacoes: { orderBy: [{ uf: "asc" }, { nome: "asc" }] } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const cliente = await prisma.cliente.create({
    data: { nome: body.nome.toUpperCase(), cor: body.cor ?? "#6366f1" },
  });

  return NextResponse.json(cliente, { status: 201 });
}
