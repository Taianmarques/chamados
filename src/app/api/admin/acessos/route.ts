import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const agora = new Date();
  const [ano, mesNum] = mes ? mes.split("-").map(Number) : [agora.getFullYear(), agora.getMonth() + 1];
  const inicio = new Date(ano, mesNum - 1, 1);
  const fim = new Date(ano, mesNum, 1);

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ativo: true },
    orderBy: { name: "asc" },
  });

  const acessos = await prisma.acessoLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: inicio, lt: fim } },
    _count: { userId: true },
  });
  const mapa = new Map(acessos.map((a) => [a.userId, a._count.userId]));

  const resultado = usuarios
    .map((u) => ({ ...u, acessos: mapa.get(u.id) ?? 0 }))
    .sort((a, b) => b.acessos - a.acessos);

  return NextResponse.json(resultado);
}
