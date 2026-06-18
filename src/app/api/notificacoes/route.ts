import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string };

  const [naoLidas, recentes] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, lida: false } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { ticket: { select: { id: true, numero: true } } },
    }),
  ]);

  return NextResponse.json({ naoLidas, notificacoes: recentes }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  // Marca todas as notificações do usuário como lidas
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string };
  await prisma.notification.updateMany({ where: { userId: user.id, lida: false }, data: { lida: true } });

  return NextResponse.json({ ok: true });
}
