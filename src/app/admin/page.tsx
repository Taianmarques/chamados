import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { role: string; name: string };
  if (user.role !== "ADMIN") redirect("/board");

  const usuarios = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, ativo: true, createdAt: true,
      clienteId: true, cliente: { select: { id: true, nome: true } },
      localizacaoId: true, localizacao: { select: { id: true, nome: true, uf: true } },
    },
    orderBy: { name: "asc" },
  });

  const clientes = await prisma.cliente.findMany({
    include: { localizacoes: { orderBy: [{ uf: "asc" }, { nome: "asc" }] } },
    orderBy: { nome: "asc" },
  });

  return (
    <AdminClient
      usuarios={JSON.parse(JSON.stringify(usuarios))}
      clientes={JSON.parse(JSON.stringify(clientes))}
      userName={user.name}
      userRole={user.role}
    />
  );
}
