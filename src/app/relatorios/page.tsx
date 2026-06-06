import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RelatoriosClient from "./RelatoriosClient";

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { role: string; name: string };
  if (!["ADMIN", "SUPERVISOR"].includes(user.role)) redirect("/board");

  const tickets = await prisma.ticket.findMany({
    include: {
      cliente: true,
      localizacao: true,
      solicitante: { select: { name: true } },
      agente: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <RelatoriosClient
      tickets={JSON.parse(JSON.stringify(tickets))}
      userName={user.name}
      userRole={user.role}
    />
  );
}
