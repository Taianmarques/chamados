import { create } from "zustand";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export const PIPELINE_COLUMNS = [
  // Chamados
  { id: "CHAMADO_REFRIG",        label: "Chamado Refrigeração/Exaustão",                        cor: "#3b82f6", grupo: "chamado" },
  { id: "CHAMADO_CIVIL",         label: "Chamado Civil/Elétrica/Marcenaria",                     cor: "#6366f1", grupo: "chamado" },
  { id: "CHAMADO_BEBEDOURO",     label: "Chamado Bebedouro",                                     cor: "#8b5cf6", grupo: "chamado" },
  { id: "CHAMADO_CAPEX",         label: "Chamado Capex",                                         cor: "#a855f7", grupo: "chamado" },
  // Orçamento
  { id: "SOLIC_ORCAMENTO",       label: "Solicitação de Orçamento - Orçamentista",               cor: "#f59e0b", grupo: "orcamento" },
  { id: "VALID_ORCAMENTO",       label: "Validação de Orçamento - Gestor",                       cor: "#f97316", grupo: "orcamento" },
  { id: "ORCAMENTOS_VALIDADOS",  label: "Orçamentos Validados - Gestor",                         cor: "#f97316", grupo: "orcamento" },
  { id: "ORC_ENVIADO_AGUARD",    label: "Orçamento Enviado Aguardando Aprovação - Orçamentista", cor: "#fb923c", grupo: "orcamento" },
  // Orçamento Aprovado
  { id: "ORC_APROV_REFRIG",      label: "Orçamento Aprovado Refrigeração/Exaustão",              cor: "#10b981", grupo: "orc_aprov" },
  { id: "ORC_APROV_CIVIL",       label: "Orçamento Aprovado Civil/Elétrica/Marcenaria",          cor: "#10b981", grupo: "orc_aprov" },
  { id: "ORC_APROV_BEBEDOURO",   label: "Orçamento Aprovado Bebedouro",                          cor: "#10b981", grupo: "orc_aprov" },
  { id: "ORC_APROV_CAPEX",       label: "Orçamento Aprovado Capex",                              cor: "#10b981", grupo: "orc_aprov" },
  // Compras
  { id: "SOLIC_COMPRAS",         label: "Solicitação de Compras - Suprimentos",                  cor: "#7c3aed", grupo: "compras" },
  { id: "COMPRAS_REFRIG",        label: "Compras Concluídas Refrigeração/Exaustão",              cor: "#6d28d9", grupo: "compras" },
  { id: "COMPRAS_CIVIL",         label: "Compras Concluídas Civil/Elétrica/Marcenaria",          cor: "#6d28d9", grupo: "compras" },
  { id: "COMPRAS_BEBEDOURO",     label: "Compras Concluídas Bebedouro",                          cor: "#6d28d9", grupo: "compras" },
  { id: "COMPRAS_CAPEX",         label: "Compras Concluídas Capex",                              cor: "#6d28d9", grupo: "compras" },
  // Corretiva
  { id: "CORRETIVA_REFRIG",      label: "Corretiva em Execução Refrigeração/Exaustão",           cor: "#ef4444", grupo: "corretiva" },
  { id: "CORRETIVA_CIVIL",       label: "Corretiva em Execução Civil/Elétrica/Marcenaria",       cor: "#ef4444", grupo: "corretiva" },
  { id: "CORRETIVA_BEBEDOURO",   label: "Corretiva em Execução Bebedouro",                       cor: "#ef4444", grupo: "corretiva" },
  { id: "CORRETIVA_CAPEX",       label: "Corretiva Capex em Execução",                           cor: "#ef4444", grupo: "corretiva" },
  { id: "CORRETIVA_SEM_APROV",   label: "Corretiva Realizadas sem aprovação",                    cor: "#dc2626", grupo: "corretiva" },
  { id: "EMERGENCIAL",           label: "Chamados Emergenciais Realizados",                      cor: "#b91c1c", grupo: "corretiva" },
  // Faturamento
  { id: "FATURAMENTO",           label: "Faturamento Financeiro/Adm",                            cor: "#059669", grupo: "faturamento" },
  { id: "FATURADO_AGUARD",       label: "Faturado Aguardando Pagamento Financeiro/Adm",          cor: "#047857", grupo: "faturamento" },
] as const;

export type TicketStatus = typeof PIPELINE_COLUMNS[number]["id"];

export const STATUS_LABELS = Object.fromEntries(PIPELINE_COLUMNS.map((c) => [c.id, c.label])) as Record<string, string>;

export const SETORES = [
  {
    id: "SUPERVISAO_REFRIG",
    label: "Supervisão de Refrigeração",
    cor: "#3b82f6",
    colunas: ["CHAMADO_REFRIG", "ORC_APROV_REFRIG", "COMPRAS_REFRIG", "CORRETIVA_REFRIG"],
  },
  {
    id: "SUPERVISAO_CIVIL",
    label: "Supervisão Civil/Elétrica/Marcenaria",
    cor: "#6366f1",
    colunas: ["CHAMADO_CIVIL", "ORC_APROV_CIVIL", "COMPRAS_CIVIL", "CORRETIVA_CIVIL"],
  },
  {
    id: "VALIDACAO",
    label: "Validação",
    cor: "#f97316",
    colunas: ["SOLIC_ORCAMENTO", "VALID_ORCAMENTO", "ORCAMENTOS_VALIDADOS", "ORC_ENVIADO_AGUARD"],
  },
  {
    id: "COMPRAS",
    label: "Compras",
    cor: "#7c3aed",
    colunas: ["SOLIC_COMPRAS", "COMPRAS_REFRIG", "COMPRAS_CIVIL", "COMPRAS_BEBEDOURO", "COMPRAS_CAPEX"],
  },
  {
    id: "ADMINISTRACAO",
    label: "Administração",
    cor: "#a855f7",
    colunas: [
      "CHAMADO_BEBEDOURO", "CHAMADO_CAPEX",
      "ORC_APROV_BEBEDOURO", "ORC_APROV_CAPEX",
      "COMPRAS_BEBEDOURO", "COMPRAS_CAPEX",
      "CORRETIVA_BEBEDOURO", "CORRETIVA_CAPEX",
      "CORRETIVA_SEM_APROV", "EMERGENCIAL",
    ],
  },
  {
    id: "FATURAMENTO",
    label: "Faturamento",
    cor: "#059669",
    colunas: ["FATURAMENTO", "FATURADO_AGUARD"],
  },
] as const;

export type SetorId = typeof SETORES[number]["id"];

export interface Ticket {
  id: string;
  numero: number;
  descricao: string;
  status: string;
  prioridade: Prioridade;
  ticketExterno: string;
  ovNumero: string;
  osNumero: string;
  valorServico: number;
  clienteId: string;
  cliente: { id: string; nome: string; cor: string };
  localizacaoId: string;
  localizacao: { id: string; nome: string; uf: string };
  solicitante: { id: string; name: string };
  agente: { id: string; name: string } | null;
  _count: { comentarios: number };
  createdAt: string;
  updatedAt: string;
  resolvidoAt: string | null;
}

export function tituloTicket(t: Pick<Ticket, "localizacao" | "cliente" | "numero" | "ticketExterno" | "ovNumero" | "osNumero">): string {
  const loc = `${t.localizacao.nome}/${t.localizacao.uf}`;
  const ticket = t.ticketExterno || t.numero;
  const ov = t.ovNumero ? ` / OV ${t.ovNumero}` : "";
  const os = t.osNumero ? ` / OS ${t.osNumero}` : "";
  return `${loc} - ${t.cliente.nome} ${ticket}${ov}${os}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface BoardStore {
  tickets: Ticket[];
  loading: boolean;
  filtroClienteId: string | null;
  filtroUf: string | null;
  filtroPrioridade: Prioridade | null;
  filtroSetor: SetorId | null;
  filtroPeriodo: "dia" | "semana" | "mes" | "ano" | null;
  busca: string;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (v: boolean) => void;
  updateTicket: (id: string, data: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
  setFiltroClienteId: (id: string | null) => void;
  setFiltroUf: (uf: string | null) => void;
  setFiltroPrioridade: (p: Prioridade | null) => void;
  setFiltroSetor: (s: SetorId | null) => void;
  setFiltroPeriodo: (p: "dia" | "semana" | "mes" | "ano" | null) => void;
  setBusca: (v: string) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  tickets: [],
  loading: false,
  filtroClienteId: null,
  filtroUf: null,
  filtroPrioridade: null,
  filtroSetor: null,
  filtroPeriodo: null,
  busca: "",
  setTickets: (tickets) => set({ tickets }),
  setLoading: (v) => set({ loading: v }),
  updateTicket: (id, data) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
  setFiltroClienteId: (id) => set({ filtroClienteId: id }),
  setFiltroUf: (uf) => set({ filtroUf: uf }),
  setFiltroPrioridade: (p) => set({ filtroPrioridade: p }),
  setFiltroSetor: (s) => set({ filtroSetor: s }),
  setFiltroPeriodo: (p) => set({ filtroPeriodo: p }),
  setBusca: (v) => set({ busca: v }),
}));
