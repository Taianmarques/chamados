import { PrismaClient, Prioridade, Role } from "../src/generated/prisma/client";
import { PIPELINE_COLUMNS } from "../src/store/board";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbUrl = `file:${path.resolve(__dirname, "../dev.db")}`;
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });

async function main() {
  // Clientes
  const smartfit = await prisma.cliente.upsert({
    where: { nome: "SMARTFIT" },
    update: {},
    create: { nome: "SMARTFIT", cor: "#f59e0b" },
  });

  const cea = await prisma.cliente.upsert({
    where: { nome: "C&A" },
    update: {},
    create: { nome: "C&A", cor: "#3b82f6" },
  });

  const renner = await prisma.cliente.upsert({
    where: { nome: "RENNER" },
    update: {},
    create: { nome: "RENNER", cor: "#ef4444" },
  });

  // Localizações SmartFit
  const sfPitaguary = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "PITAGUARY", uf: "CE", clienteId: smartfit.id } },
    update: {},
    create: { nome: "PITAGUARY", uf: "CE", clienteId: smartfit.id },
  });
  const sfFortaleza = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "FORTALEZA MEIRELES", uf: "CE", clienteId: smartfit.id } },
    update: {},
    create: { nome: "FORTALEZA MEIRELES", uf: "CE", clienteId: smartfit.id },
  });
  const sfSaoPaulo = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "PAULISTA", uf: "SP", clienteId: smartfit.id } },
    update: {},
    create: { nome: "PAULISTA", uf: "SP", clienteId: smartfit.id },
  });
  const sfRecife = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "BOA VIAGEM", uf: "PE", clienteId: smartfit.id } },
    update: {},
    create: { nome: "BOA VIAGEM", uf: "PE", clienteId: smartfit.id },
  });

  // Localizações C&A
  const ceaManaus = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "MANAUS SHOPPING", uf: "AM", clienteId: cea.id } },
    update: {},
    create: { nome: "MANAUS SHOPPING", uf: "AM", clienteId: cea.id },
  });
  const ceaSalvador = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "SHOPPING IGUATEMI", uf: "BA", clienteId: cea.id } },
    update: {},
    create: { nome: "SHOPPING IGUATEMI", uf: "BA", clienteId: cea.id },
  });

  // Localizações Renner
  const rennerCuritiba = await prisma.localizacao.upsert({
    where: { nome_uf_clienteId: { nome: "MUELLER", uf: "PR", clienteId: renner.id } },
    update: {},
    create: { nome: "MUELLER", uf: "PR", clienteId: renner.id },
  });

  // Usuários
  const senhas = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("super123", 10),
    bcrypt.hash("agente123", 10),
    bcrypt.hash("user123", 10),
    bcrypt.hash("user123", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: { name: "Admin Sistema", email: "admin@empresa.com", password: senhas[0], role: Role.ADMIN },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@empresa.com" },
    update: {},
    create: { name: "Carlos Supervisor", email: "supervisor@empresa.com", password: senhas[1], role: Role.SUPERVISOR },
  });

  const agente = await prisma.user.upsert({
    where: { email: "agente@empresa.com" },
    update: {},
    create: { name: "Ana Agente", email: "agente@empresa.com", password: senhas[2], role: Role.AGENTE },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "joao@empresa.com" },
    update: {},
    create: { name: "João Silva", email: "joao@empresa.com", password: senhas[3], role: Role.SOLICITANTE },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "maria@empresa.com" },
    update: {},
    create: { name: "Maria Santos", email: "maria@empresa.com", password: senhas[4], role: Role.SOLICITANTE },
  });

  // Tickets — espalhados pelas 25 etapas
  type TicketData = {
    prioridade: Prioridade; status: string;
    clienteId: string; localizacaoId: string;
    solicitanteId: string; agenteId: string | null;
    ticketExterno: string; ovNumero: string; osNumero: string;
    valorServico: number; descricao: string;
  };

  const st = (i: number) => PIPELINE_COLUMNS[i % PIPELINE_COLUMNS.length].id;

  const ticketsData: TicketData[] = [
    { clienteId: smartfit.id, localizacaoId: sfPitaguary.id, ticketExterno: "225258", ovNumero: "3495", osNumero: "6960", valorServico: 4800, prioridade: Prioridade.ALTA, status: st(0), solicitanteId: user1.id, agenteId: agente.id, descricao: "Ar-condicionado sem resfriar na área de musculação." },
    { clienteId: smartfit.id, localizacaoId: sfFortaleza.id, ticketExterno: "225301", ovNumero: "3501", osNumero: "6971", valorServico: 1200, prioridade: Prioridade.MEDIA, status: st(1), solicitanteId: user2.id, agenteId: null, descricao: "Sensor da porta de entrada com defeito." },
    { clienteId: cea.id, localizacaoId: ceaManaus.id, ticketExterno: "118842", ovNumero: "3488", osNumero: "6948", valorServico: 9500, prioridade: Prioridade.CRITICA, status: st(4), solicitanteId: user1.id, agenteId: agente.id, descricao: "Sistema de alarme disparando às 03h. Terceira ocorrência." },
    { clienteId: smartfit.id, localizacaoId: sfSaoPaulo.id, ticketExterno: "225412", ovNumero: "3512", osNumero: "6985", valorServico: 3200, prioridade: Prioridade.MEDIA, status: st(8), solicitanteId: user2.id, agenteId: admin.id, descricao: "Aguardando peça para conserto das esteiras." },
    { clienteId: cea.id, localizacaoId: ceaSalvador.id, ticketExterno: "118776", ovNumero: "3476", osNumero: "6933", valorServico: 7600, prioridade: Prioridade.ALTA, status: st(12), solicitanteId: user1.id, agenteId: null, descricao: "Vazamento no teto próximo ao provador feminino." },
    { clienteId: renner.id, localizacaoId: rennerCuritiba.id, ticketExterno: "334560", ovNumero: "3460", osNumero: "6918", valorServico: 650, prioridade: Prioridade.BAIXA, status: st(17), solicitanteId: user1.id, agenteId: agente.id, descricao: "Troca de lâmpadas no corredor de acesso." },
    { clienteId: smartfit.id, localizacaoId: sfRecife.id, ticketExterno: "225520", ovNumero: "3520", osNumero: "6997", valorServico: 5400, prioridade: Prioridade.ALTA, status: st(22), solicitanteId: user2.id, agenteId: agente.id, descricao: "Câmeras offline após queda de energia." },
    { clienteId: cea.id, localizacaoId: ceaManaus.id, ticketExterno: "118930", ovNumero: "3530", osNumero: "7008", valorServico: 2800, prioridade: Prioridade.MEDIA, status: st(24), solicitanteId: user2.id, agenteId: null, descricao: "PDV 3 com falha na leitora de cartão." },
  ];

  let numero = 1;
  for (const t of ticketsData) {
    await prisma.ticket.create({
      data: { ...t, numero: numero++ },
    });
  }

  console.log("✅ Seed concluído!");
  console.log("\nUsuários criados:");
  console.log("  admin@empresa.com / admin123 (Admin)");
  console.log("  supervisor@empresa.com / super123 (Supervisor)");
  console.log("  agente@empresa.com / agente123 (Agente)");
  console.log("  joao@empresa.com / user123 (Solicitante)");
  console.log("  maria@empresa.com / user123 (Solicitante)");
  console.log("\nClientes: SMARTFIT, C&A, RENNER");
  console.log("UFs cobertas: CE, SP, PE, AM, BA, PR");
}

main().catch(console.error).finally(() => prisma.$disconnect());
