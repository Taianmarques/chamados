import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const user = session.user as { id: string };

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "uploads");
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(uploadDir, filename), buffer);

  const anexo = await prisma.attachment.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      ticketId: id,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(anexo, { status: 201 });
}
