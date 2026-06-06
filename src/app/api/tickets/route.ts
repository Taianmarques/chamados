import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TICKET_INCLUDE = {
  cliente: true,
  localizacao: true,
  solicitante: { select: { id: true, name: true } },
  agente: { select: { id: true, name: true } },
  _count: { select: { comentarios: true } },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const prioridade = searchParams.get("prioridade");
  const clienteId = searchParams.get("clienteId");
  const uf = searchParams.get("uf");
  const periodo = searchParams.get("periodo");

  const user = session.user as { id: string; role: string };
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (clienteId) where.clienteId = clienteId;
  if (uf) where.localizacao = { uf };
  if (user.role === "SOLICITANTE") where.solicitanteId = user.id;

  if (periodo) {
    const agora = new Date();
    const inicio = new Date();
    if (periodo === "dia") {
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === "semana") {
      const diaSemana = agora.getDay();
      inicio.setDate(agora.getDate() - diaSemana);
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === "mes") {
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === "ano") {
      inicio.setMonth(0, 1);
      inicio.setHours(0, 0, 0, 0);
    }
    where.createdAt = { gte: inicio };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: TICKET_INCLUDE,
    orderBy: [{ prioridade: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string };

  // Verifica se o usuário ainda existe no banco (sessão pode ter ID antigo após re-seed)
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return NextResponse.json(
      { error: "Sessão desatualizada. Faça logout e entre novamente." },
      { status: 401 }
    );
  }

  const body = await req.json();

  if (!body.clienteId || !body.localizacaoId) {
    return NextResponse.json({ error: "Cliente e localização são obrigatórios." }, { status: 400 });
  }

  const ultimo = await prisma.ticket.findFirst({ orderBy: { numero: "desc" } });
  const numero = (ultimo?.numero ?? 0) + 1;

  const ticket = await prisma.ticket.create({
    data: {
      numero,
      descricao: body.descricao ?? "",
      prioridade: body.prioridade ?? "MEDIA",
      clienteId: body.clienteId,
      localizacaoId: body.localizacaoId,
      status: body.status ?? "CHAMADO_REFRIG",
      ticketExterno: body.ticketExterno ?? "",
      ovNumero: body.ovNumero ?? "",
      osNumero: body.osNumero ?? "",
      valorServico: typeof body.valorServico === "number" ? body.valorServico : 0,
      contatoNome: body.contatoNome ?? "",
      solicitanteId: user.id,
    },
    include: TICKET_INCLUDE,
  });

  return NextResponse.json(ticket, { status: 201 });
}
