import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  const uf = searchParams.get("uf");

  const where: Record<string, unknown> = {};
  if (clienteId) where.clienteId = clienteId;
  if (uf) where.uf = uf;

  const localizacoes = await prisma.localizacao.findMany({
    where,
    orderBy: [{ uf: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(localizacoes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const localizacao = await prisma.localizacao.create({
    data: {
      nome: body.nome.toUpperCase(),
      uf: body.uf.toUpperCase(),
      clienteId: body.clienteId,
    },
  });

  return NextResponse.json(localizacao, { status: 201 });
}
