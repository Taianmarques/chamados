import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ImportarClient from "./ImportarClient";

export default async function ImportarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { role: string; name: string };
  if (!["ADMIN", "SUPERVISOR"].includes(user.role)) redirect("/board");

  const clientes = await prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } });

  return <ImportarClient userName={user.name} userRole={user.role} clientes={clientes} />;
}
