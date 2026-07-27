import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const user = session.user as { id: string; role: string };

  // Nota interna só para agentes/admin/supervisor/gestor
  const interno =
    body.interno === true && ["AGENTE", "ADMIN", "SUPERVISOR", "GESTOR"].includes(user.role);
  const categoria = body.categoria === "PROPOSTA" ? "PROPOSTA" : "GERAL";

  const comentario = await prisma.comment.create({
    data: {
      texto: body.texto,
      interno,
      categoria,
      ticketId: id,
      autorId: user.id,
    },
    include: {
      autor: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(comentario, { status: 201 });
}
