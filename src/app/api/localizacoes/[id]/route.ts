import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome.toUpperCase();
  if (body.uf !== undefined) data.uf = body.uf.toUpperCase();

  try {
    const localizacao = await prisma.localizacao.update({ where: { id }, data });
    return NextResponse.json(localizacao);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma localização com esse nome e UF para este cliente." }, { status: 409 });
    }
    return NextResponse.json({ error: "Localização não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;

  const [tickets, usuarios] = await Promise.all([
    prisma.ticket.count({ where: { localizacaoId: id } }),
    prisma.user.count({ where: { localizacaoId: id } }),
  ]);

  if (tickets + usuarios > 0) {
    return NextResponse.json(
      { error: "Esta localização tem chamados ou usuários vinculados e não pode ser excluída." },
      { status: 409 }
    );
  }

  try {
    await prisma.localizacao.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Localização não encontrada" }, { status: 404 });
  }
}
