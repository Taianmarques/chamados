-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "ticketExterno" TEXT NOT NULL DEFAULT '',
    "ovNumero" TEXT NOT NULL DEFAULT '',
    "osNumero" TEXT NOT NULL DEFAULT '',
    "clienteId" TEXT NOT NULL,
    "localizacaoId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "agenteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvidoAt" DATETIME,
    "fechadoAt" DATETIME,
    CONSTRAINT "Ticket_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_localizacaoId_fkey" FOREIGN KEY ("localizacaoId") REFERENCES "Localizacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("agenteId", "clienteId", "createdAt", "descricao", "fechadoAt", "id", "localizacaoId", "numero", "osNumero", "ovNumero", "prioridade", "resolvidoAt", "solicitanteId", "status", "updatedAt") SELECT "agenteId", "clienteId", "createdAt", "descricao", "fechadoAt", "id", "localizacaoId", "numero", "osNumero", "ovNumero", "prioridade", "resolvidoAt", "solicitanteId", "status", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
