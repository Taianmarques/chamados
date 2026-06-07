import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PortalClient from "./PortalClient";

export default async function PortalPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const sessionUser = session.user as { id: string; role: string; name: string };
  if (sessionUser.role !== "SOLICITANTE") redirect("/board");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      cliente: { include: { localizacoes: { orderBy: [{ uf: "asc" }, { nome: "asc" }] } } },
      localizacao: true,
    },
  });

  const tickets = await prisma.ticket.findMany({
    where: { solicitanteId: sessionUser.id },
    include: {
      localizacao: true,
      agente: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalClient
      userName={sessionUser.name}
      cliente={user?.cliente ?? null}
      localizacaoVinculada={user?.localizacao ?? null}
      tickets={JSON.parse(JSON.stringify(tickets))}
    />
  );
}
