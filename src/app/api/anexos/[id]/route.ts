import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile, unlink } from "fs/promises";
import { join } from "path";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const anexo = await prisma.attachment.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const filePath = join(process.cwd(), "uploads", anexo.filename);
  const buffer = await readFile(filePath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo não encontrado no disco" }, { status: 404 });

  const inline = anexo.mimeType.startsWith("image/") || anexo.mimeType.startsWith("video/");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": anexo.mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(anexo.originalName)}"`,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { role: string };
  if (!["ADMIN", "AGENTE", "SUPERVISOR"].includes(user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const anexo = await prisma.attachment.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await unlink(join(process.cwd(), "uploads", anexo.filename)).catch(() => null);
  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
