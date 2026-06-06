import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TicketDetalhes from "./TicketDetalhes";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      cliente: true,
      localizacao: true,
      solicitante: { select: { id: true, name: true } },
      agente: { select: { id: true, name: true } },
      comentarios: {
        include: { autor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      anexos: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  const agentes = await prisma.user.findMany({
    where: { role: { in: ["AGENTE", "ADMIN"] }, ativo: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const user = session.user as { id: string; role: string; name: string };

  return (
    <TicketDetalhes
      ticket={JSON.parse(JSON.stringify(ticket))}
      agentes={agentes}
      currentUser={user}
    />
  );
}
