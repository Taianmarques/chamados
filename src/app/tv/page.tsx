import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TvDashboard from "./TvDashboard";

export default async function TvPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tickets = await prisma.ticket.findMany({
    include: {
      cliente: true,
      localizacao: true,
      agente: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <TvDashboard tickets={JSON.parse(JSON.stringify(tickets))} />;
}
