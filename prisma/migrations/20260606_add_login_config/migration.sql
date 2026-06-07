-- CreateTable
CREATE TABLE "LoginConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "titulo" TEXT NOT NULL DEFAULT 'Sistema de Chamados',
    "descricao" TEXT NOT NULL DEFAULT 'Acesso interno',
    "corPrimaria" TEXT NOT NULL DEFAULT '#6366f1',
    "updatedAt" DATETIME NOT NULL
);
