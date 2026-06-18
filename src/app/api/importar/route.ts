import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { PIPELINE_COLUMNS } from "@/store/board";
import { cidadeParaUf, modalidadeParaStatus, parseValor, linhasParaObjetos } from "@/lib/import-tickets";

// Gera planilha template para download
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    include: { localizacoes: true },
    orderBy: { nome: "asc" },
  });

  const wb = XLSX.utils.book_new();

  // Aba 1: Template de importação
  const headers = [
    "Nº Ticket", "OV", "OS", "Cliente", "UF", "Localização",
    "Descrição", "Contato na Empresa", "Prioridade", "Etapa", "Valor (R$)",
  ];

  const exemplo = [
    "225258", "3495", "6960", "SMARTFIT", "CE", "PITAGUARY",
    "Ar condicionado com defeito", "João da Silva", "ALTA", "Chamado Refrigeração/Exaustão", "4800",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exemplo]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  XLSX.utils.book_append_sheet(wb, ws, "Importação");

  // Aba 2: Clientes e Localizações disponíveis
  const refHeaders = ["Cliente", "UF", "Localização"];
  const refData: string[][] = [];
  for (const c of clientes) {
    for (const l of c.localizacoes) {
      refData.push([c.nome, l.uf, l.nome]);
    }
  }
  const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refData]);
  wsRef["!cols"] = [{ wch: 20 }, { wch: 8 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsRef, "Referência - Clientes");

  // Aba 3: Etapas disponíveis
  const etapasHeaders = ["ID da Etapa", "Nome da Etapa"];
  const etapasData = PIPELINE_COLUMNS.map((c) => [c.id, c.label]);
  const wsEtapas = XLSX.utils.aoa_to_sheet([etapasHeaders, ...etapasData]);
  wsEtapas["!cols"] = [{ wch: 30 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsEtapas, "Referência - Etapas");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_importacao_chamados.xlsx"',
    },
  });
}

// Importa planilha
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (!["ADMIN", "SUPERVISOR"].includes(user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Sessão desatualizada. Faça logout." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  const clienteIdPadrao = (formData.get("clienteIdPadrao") as string | null) || "";

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
  const { linhaCabecalho, registros: rows } = linhasParaObjetos(matriz);

  if (rows.length === 0) return NextResponse.json({ error: "Planilha vazia" }, { status: 400 });

  // Carrega clientes e localizações para matching (mutável durante o import)
  const clientesDB = await prisma.cliente.findMany({ include: { localizacoes: true } });
  const clienteMap = new Map(clientesDB.map((c) => [c.nome.toUpperCase().trim(), c]));
  const clientePadrao = clienteIdPadrao ? clientesDB.find((c) => c.id === clienteIdPadrao) ?? null : null;
  const locMap = new Map(
    clientesDB.flatMap((c) =>
      c.localizacoes.map((l) => [`${c.nome.toUpperCase()}|${l.uf.toUpperCase()}|${l.nome.toUpperCase()}`, l])
    )
  );

  // Cores padrão para novos clientes
  const CORES = ["#6366f1","#f59e0b","#3b82f6","#ef4444","#10b981","#8b5cf6","#06b6d4","#ec4899"];
  let corIdx = clientesDB.length % CORES.length;

  async function obterOuCriarCliente(nome: string) {
    const key = nome.toUpperCase().trim();
    if (clienteMap.has(key)) return clienteMap.get(key)!;
    const novo = await prisma.cliente.create({
      data: { nome: key, cor: CORES[corIdx++ % CORES.length] },
      include: { localizacoes: true },
    });
    clienteMap.set(key, novo);
    return novo;
  }

  async function obterOuCriarLocalizacao(clienteId: string, nomeCliente: string, nomeLocal: string, uf: string) {
    const key = `${nomeCliente.toUpperCase()}|${uf.toUpperCase()}|${nomeLocal.toUpperCase()}`;
    if (locMap.has(key)) return locMap.get(key)!;
    const nova = await prisma.localizacao.create({
      data: { nome: nomeLocal.toUpperCase().trim(), uf: uf.toUpperCase().trim(), clienteId },
    });
    locMap.set(key, nova);
    return nova;
  }

  // Etapas lookup por label e por ID
  const statusLabelMap = new Map(
    PIPELINE_COLUMNS.map((c) => [c.label.toLowerCase().trim(), c.id])
  );
  const statusIdSet = new Set<string>(PIPELINE_COLUMNS.map((c) => c.id));

  const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

  // Normaliza header
  function col(row: Record<string, string>, ...keys: string[]): string {
    const rowLower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
    for (const k of keys) {
      const v = rowLower[k.toLowerCase().trim()];
      if (v !== undefined && v !== "") return String(v).trim();
    }
    return "";
  }

  const ultimo = await prisma.ticket.findFirst({ orderBy: { numero: "desc" } });
  let proximoNumero = (ultimo?.numero ?? 0) + 1;

  // Tickets já importados anteriormente, para evitar duplicar ao reimportar a mesma planilha
  const ticketsExistentes = await prisma.ticket.findMany({ where: { ticketExterno: { not: "" } } });
  const ticketExternoMap = new Map(ticketsExistentes.map((t) => [`${t.clienteId}|${t.ticketExterno}`, t]));

  const importados: number[] = [];
  const atualizados: number[] = [];
  const erros: { linha: number; motivo: string; dados: string }[] = [];
  const clientesCriados = new Set<string>();
  const localizacoesCriadas = new Set<string>();

  const clientesAntes = new Set(clientesDB.map((c) => c.id));
  const locsAntes = new Set(clientesDB.flatMap((c) => c.localizacoes.map((l) => l.id)));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const linha = linhaCabecalho + 2 + i; // +1 (0-index → 1-index) +1 (linha de dados é a seguinte ao cabeçalho)

    const nomeCliente = col(row, "cliente", "client");
    const ufRaw = col(row, "uf", "estado", "state", "local", "cidade", "city");
    const nomeLocal = col(row, "localização", "localizacao", "unidade", "location", "loja");

    if (!nomeCliente && !clientePadrao) { erros.push({ linha, motivo: "Coluna 'Cliente' vazia e nenhum cliente padrão selecionado", dados: JSON.stringify(row) }); continue; }
    if (!nomeLocal) { erros.push({ linha, motivo: "Coluna 'Localização'/'Unidade' vazia", dados: JSON.stringify(row) }); continue; }

    const uf = /^[A-Za-z]{2}$/.test(ufRaw) ? ufRaw.toUpperCase() : cidadeParaUf(ufRaw);
    if (!uf) { erros.push({ linha, motivo: `Não foi possível identificar a UF para "${ufRaw}"`, dados: JSON.stringify(row) }); continue; }

    const cliente = nomeCliente ? await obterOuCriarCliente(nomeCliente) : clientePadrao!;
    if (!clientesAntes.has(cliente.id)) clientesCriados.add(cliente.nome);
    const localizacao = await obterOuCriarLocalizacao(cliente.id, cliente.nome, nomeLocal, uf);
    if (!locsAntes.has(localizacao.id)) localizacoesCriadas.add(`${localizacao.nome}/${localizacao.uf}`);

    const descricao = col(row,
      "descrição", "descricao", "description", "obs", "observação", "observacao",
      "detalhe", "detalhes", "problema", "motivo", "descrição do serviço", "descricao do serviço",
    );

    // Status: etapa explícita > modalidade de serviço > padrão
    const etapaRaw = col(row, "etapa", "status", "stage");
    const modalidadeRaw = col(row, "modalidade de serviço", "modalidade de servico", "modalidade");
    let status: string | null = null;
    if (etapaRaw) {
      if (statusIdSet.has(etapaRaw.toUpperCase())) status = etapaRaw.toUpperCase();
      else status = statusLabelMap.get(etapaRaw.toLowerCase()) ?? null;
    }
    if (!status) status = modalidadeParaStatus(modalidadeRaw, descricao);
    if (!status) status = "CHAMADO_REFRIG";

    // Prioridade
    const prioRaw = col(row, "prioridade", "priority");
    const prioridade = PRIORIDADES.includes(prioRaw.toUpperCase()) ? prioRaw.toUpperCase() : "MEDIA";

    // Valor
    const valorRaw = col(row, "valor (r$)", "valor", "value", "r$");
    const valorServico = parseValor(valorRaw);

    const ticketExterno = col(row,
      "nº ticket", "n° ticket", "num ticket", "numero ticket", "ticket", "chamado",
      "número do ticket", "nro ticket", "nro. ticket", "ticket externo", "nº chamado",
    );
    const ovNumero = col(row,
      "ov", "op", "nº ov", "n° ov", "num ov", "numero ov", "número ov", "nro ov",
      "ordem de venda", "ordem venda", "n ov", "ov nº", "ov numero",
    );
    const osNumero = col(row,
      "os", "nº os", "n° os", "num os", "numero os", "número os", "nro os",
      "ordem de serviço", "ordem de servico", "ordem serviço", "ordem servico",
      "n os", "os nº", "os numero",
    );
    const contatoNome = col(row,
      "contato na empresa", "contato", "solicitante", "contact",
      "nome contato", "nome do contato", "responsavel cliente", "responsável cliente",
    );

    const dados = {
      ticketExterno, ovNumero, osNumero, descricao, contatoNome,
      prioridade: prioridade as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA",
      status, valorServico,
      clienteId: cliente.id,
      localizacaoId: localizacao.id,
    };

    const chaveExistente = ticketExterno ? `${cliente.id}|${ticketExterno}` : "";
    const existente = chaveExistente ? ticketExternoMap.get(chaveExistente) : undefined;

    try {
      if (existente) {
        await prisma.ticket.update({ where: { id: existente.id }, data: dados });
        atualizados.push(linha);
      } else {
        const numero = proximoNumero++;
        const novo = await prisma.ticket.create({ data: { ...dados, numero, solicitanteId: dbUser.id } });
        if (chaveExistente) ticketExternoMap.set(chaveExistente, novo);
        importados.push(linha);
      }
    } catch (e) {
      erros.push({ linha, motivo: `Erro ao salvar: ${(e as Error).message}`, dados: JSON.stringify(row) });
    }
  }

  return NextResponse.json({
    total: rows.length,
    importados: importados.length,
    atualizados: atualizados.length,
    erros,
    clientesCriados: [...clientesCriados],
    localizacoesCriadas: [...localizacoesCriadas],
  });
}
