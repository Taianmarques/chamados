import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: string; name: string };
  if (!["ADMIN", "SUPERVISOR", "AGENTE"].includes(user.role)) redirect("/board");

  const tickets = await prisma.ticket.findMany({
    include: {
      cliente: { select: { id: true, nome: true, cor: true } },
      localizacao: { select: { id: true, nome: true, uf: true } },
      agente: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardClient
      tickets={JSON.parse(JSON.stringify(tickets))}
      userName={user.name}
      userRole={user.role}
    />
  );
}
