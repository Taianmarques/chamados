/*
  Warnings:

  - You are about to drop the `Categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `categoriaId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `clienteId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `localizacaoId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Categoria_nome_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Categoria";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Localizacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    CONSTRAINT "Localizacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
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
INSERT INTO "new_Ticket" ("agenteId", "createdAt", "descricao", "fechadoAt", "id", "numero", "prioridade", "resolvidoAt", "solicitanteId", "status", "updatedAt") SELECT "agenteId", "createdAt", "descricao", "fechadoAt", "id", "numero", "prioridade", "resolvidoAt", "solicitanteId", "status", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nome_key" ON "Cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Localizacao_nome_uf_clienteId_key" ON "Localizacao"("nome", "uf", "clienteId");
