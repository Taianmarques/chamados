import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const TICKET_INCLUDE = {
  cliente: true,
  localizacao: true,
  solicitante: { select: { id: true, name: true } },
  agente: { select: { id: true, name: true } },
  comentarios: {
    include: { autor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });

  if (!ticket) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "FATURADO_AGUARD") data.resolvidoAt = new Date();
  }
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.prioridade !== undefined) data.prioridade = body.prioridade;
  if (body.agenteId !== undefined) data.agenteId = body.agenteId || null;
  if (body.ticketExterno !== undefined) data.ticketExterno = body.ticketExterno;
  if (body.ovNumero !== undefined) data.ovNumero = body.ovNumero;
  if (body.osNumero !== undefined) data.osNumero = body.osNumero;
  if (body.valorServico !== undefined) data.valorServico = Number(body.valorServico);
  if (body.contatoNome !== undefined) data.contatoNome = body.contatoNome;

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      ...TICKET_INCLUDE,
      comentarios: false,
      _count: { select: { comentarios: true } },
    },
  });

  return NextResponse.json(ticket);
}
