import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    let config = await prisma.loginConfig.findFirst();
    
    if (!config) {
      config = await prisma.loginConfig.create({
        data: {
          logoUrl: "",
          titulo: "Sistema de Chamados",
          descricao: "Acesso interno",
          corPrimaria: "#6366f1",
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configurações de login:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { logoUrl, titulo, descricao, corPrimaria } = body;

    if (logoUrl && logoUrl.length > 800 * 1024) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo 800KB." },
        { status: 400 }
      );
    }

    let config = await prisma.loginConfig.findFirst();

    if (!config) {
      config = await prisma.loginConfig.create({
        data: {
          logoUrl: logoUrl || "",
          titulo: titulo || "Sistema de Chamados",
          descricao: descricao || "Acesso interno",
          corPrimaria: corPrimaria || "#6366f1",
        },
      });
    } else {
      config = await prisma.loginConfig.update({
        where: { id: config.id },
        data: {
          logoUrl: logoUrl !== undefined ? logoUrl : config.logoUrl,
          titulo: titulo !== undefined ? titulo : config.titulo,
          descricao: descricao !== undefined ? descricao : config.descricao,
          corPrimaria: corPrimaria !== undefined ? corPrimaria : config.corPrimaria,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao atualizar configurações de login:", error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Dados inválidos. Imagem pode estar muito grande." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
