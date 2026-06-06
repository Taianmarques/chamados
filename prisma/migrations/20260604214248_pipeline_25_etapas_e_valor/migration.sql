/*
  Warnings:

  - You are about to drop the column `fechadoAt` on the `Ticket` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'CHAMADO_REFRIG',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "ticketExterno" TEXT NOT NULL DEFAULT '',
    "ovNumero" TEXT NOT NULL DEFAULT '',
    "osNumero" TEXT NOT NULL DEFAULT '',
    "valorServico" REAL NOT NULL DEFAULT 0,
    "clienteId" TEXT NOT NULL,
    "localizacaoId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "agenteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvidoAt" DATETIME,
    CONSTRAINT "Ticket_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_localizacaoId_fkey" FOREIGN KEY ("localizacaoId") REFERENCES "Localizacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("agenteId", "clienteId", "createdAt", "descricao", "id", "localizacaoId", "numero", "osNumero", "ovNumero", "prioridade", "resolvidoAt", "solicitanteId", "status", "ticketExterno", "updatedAt") SELECT "agenteId", "clienteId", "createdAt", "descricao", "id", "localizacaoId", "numero", "osNumero", "ovNumero", "prioridade", "resolvidoAt", "solicitanteId", "status", "ticketExterno", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
