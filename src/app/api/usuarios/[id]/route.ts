import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const USUARIO_SELECT = {
  id: true, name: true, email: true, role: true, setor: true, ativo: true, createdAt: true,
  clienteId: true, cliente: { select: { id: true, nome: true } },
  localizacaoId: true, localizacao: { select: { id: true, nome: true, uf: true } },
};

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  if (body.ativo !== undefined) data.ativo = body.ativo;
  if (body.setor !== undefined) data.setor = body.setor || null;
  if (body.clienteId !== undefined) data.clienteId = body.clienteId || null;
  if (body.localizacaoId !== undefined) data.localizacaoId = body.localizacaoId || null;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  try {
    const atualizado = await prisma.user.update({ where: { id }, data, select: USUARIO_SELECT });
    return NextResponse.json(atualizado);
  } catch {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "Você não pode excluir o próprio usuário." }, { status: 400 });
  }

  const [ticketsAbertos, ticketsAtribuidos, comentarios, anexos] = await Promise.all([
    prisma.ticket.count({ where: { solicitanteId: id } }),
    prisma.ticket.count({ where: { agenteId: id } }),
    prisma.comment.count({ where: { autorId: id } }),
    prisma.attachment.count({ where: { uploadedById: id } }),
  ]);

  if (ticketsAbertos + ticketsAtribuidos + comentarios + anexos > 0) {
    return NextResponse.json(
      { error: "Este usuário tem chamados, comentários ou anexos vinculados e não pode ser excluído. Desative-o em vez de excluir." },
      { status: 409 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
}
