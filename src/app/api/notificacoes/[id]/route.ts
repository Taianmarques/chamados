import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string };
  const { id } = await params;

  const notificacao = await prisma.notification.findUnique({ where: { id } });
  if (!notificacao || notificacao.userId !== user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { lida: true } });
  return NextResponse.json({ ok: true });
}
