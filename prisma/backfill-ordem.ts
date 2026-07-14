import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl = `file:${path.resolve(__dirname, "../dev.db")}`;
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });

// Preenche o campo `ordem` (posição manual dentro da coluna) para tickets
// que ainda não têm valor definido, preservando a ordem visual atual
// (prioridade desc, criação desc). Roda uma única vez após o `prisma db push`
// que adicionou o campo. Não sobrescreve tickets já reordenados manualmente,
// a menos que --force seja passado.
async function main() {
  const force = process.argv.includes("--force");

  const jaReordenado = await prisma.ticket.findFirst({ where: { ordem: { not: 0 } } });
  if (jaReordenado && !force) {
    console.log("Já existem tickets com `ordem` definida (reordenados manualmente). Nada foi alterado.");
    console.log("Rode com --force se quiser sobrescrever mesmo assim.");
    return;
  }

  const tickets = await prisma.ticket.findMany({
    orderBy: [{ status: "asc" }, { prioridade: "desc" }, { createdAt: "desc" }],
    select: { id: true, status: true },
  });

  const contadores: Record<string, number> = {};
  for (const t of tickets) {
    const i = contadores[t.status] ?? 0;
    contadores[t.status] = i + 10;
    await prisma.ticket.update({ where: { id: t.id }, data: { ordem: i } });
  }

  console.log(`Ordem preenchida para ${tickets.length} tickets em ${Object.keys(contadores).length} colunas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
