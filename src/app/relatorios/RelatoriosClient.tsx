"use client";

import Navbar from "@/components/layout/Navbar";
import { tituloTicket, formatBRL, STATUS_LABELS } from "@/store/board";

type Ticket = {
  id: string; numero: number; status: string; prioridade: string;
  ticketExterno: string; ovNumero: string; osNumero: string; valorServico: number;
  cliente: { id: string; nome: string; cor: string };
  localizacao: { id: string; nome: string; uf: string };
  solicitante: { name: string };
  agente: { name: string } | null;
  createdAt: string; resolvidoAt: string | null;
};

interface Props { tickets: Ticket[]; userName: string; userRole: string; }

const STATUS_COLORS: Record<string, string> = {};
const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: "bg-gray-100 text-gray-600", MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700", CRITICA: "bg-red-100 text-red-700",
};
const PRIORIDADE_LABELS: Record<string, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };

function mediaTempoResolucao(tickets: Ticket[]) {
  const resolvidos = tickets.filter((t) => t.resolvidoAt);
  if (!resolvidos.length) return null;
  const mediaMs = resolvidos.reduce((s, t) =>
    s + (new Date(t.resolvidoAt!).getTime() - new Date(t.createdAt).getTime()), 0
  ) / resolvidos.length;
  const dias = Math.floor(mediaMs / 86400000);
  const horas = Math.floor((mediaMs % 86400000) / 3600000);
  return dias > 0 ? `${dias}d ${horas}h` : `${horas}h`;
}

export default function RelatoriosClient({ tickets, userName, userRole }: Props) {
  const totalValor = tickets.reduce((s, t) => s + (t.valorServico ?? 0), 0);
  const abertos = tickets;
  const resolvidos = tickets.filter((t) => t.status === "RESOLVIDO");
  const criticos = tickets.filter((t) => t.prioridade === "CRITICA" && !["RESOLVIDO", "FECHADO"].includes(t.status));
  const mediaResolucao = mediaTempoResolucao(tickets);

  const porStatus = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status, label, count: tickets.filter((t) => t.status === status).length,
  }));

  // Tickets por cliente
  const porCliente = tickets.reduce<Record<string, { nome: string; cor: string; total: number; abertos: number }>>((acc, t) => {
    if (!acc[t.cliente.id]) acc[t.cliente.id] = { nome: t.cliente.nome, cor: t.cliente.cor, total: 0, abertos: 0 };
    acc[t.cliente.id].total++;
    if (!["RESOLVIDO", "FECHADO"].includes(t.status)) acc[t.cliente.id].abertos++;
    return acc;
  }, {});

  // Tickets por UF
  const porUf = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.localizacao.uf] = (acc[t.localizacao.uf] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={userName} userRole={userRole} />

      <div className="flex-1 max-w-6xl mx-auto w-full p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Relatórios</h1>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: tickets.length, color: "text-gray-900" },
            { label: "Em Aberto", value: abertos.length, color: "text-indigo-700" },
            { label: "Críticos Abertos", value: criticos.length, color: "text-red-700" },
            { label: "Resolvidos", value: resolvidos.length, color: "text-green-700" },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {mediaResolucao && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-medium">Tempo médio de resolução</p>
              <p className="text-xl font-bold text-indigo-900">{mediaResolucao}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Por status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Por Status</h2>
            <div className="space-y-3">
              {porStatus.map(({ status, label, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-28 text-center ${STATUS_COLORS[status]}`}>{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: tickets.length > 0 ? `${(count / tickets.length) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Por cliente */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Por Cliente</h2>
            <div className="space-y-3">
              {Object.values(porCliente).sort((a, b) => b.total - a.total).map((c) => (
                <div key={c.nome} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="text-sm font-medium text-gray-900 flex-1">{c.nome}</span>
                  <span className="text-xs text-gray-400">{c.abertos} ab.</span>
                  <span className="text-sm font-bold text-gray-700">{c.total}</span>
                </div>
              ))}
              {Object.keys(porCliente).length === 0 && <p className="text-sm text-gray-400">Sem dados</p>}
            </div>
          </div>

          {/* Por UF */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Por UF / Região</h2>
            <div className="space-y-2">
              {Object.entries(porUf).sort((a, b) => b[1] - a[1]).map(([uf, count]) => (
                <div key={uf} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono w-10 text-center">{uf}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${(count / tickets.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-5 text-right">{count}</span>
                </div>
              ))}
              {Object.keys(porUf).length === 0 && <p className="text-sm text-gray-400">Sem dados</p>}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Todos os Chamados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Chamado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responsável</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aberto em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.slice(0, 50).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.numero}</td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-xs font-semibold text-gray-900 font-mono truncate">{tituloTicket(t)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_COLORS[t.prioridade]}`}>{PRIORIDADE_LABELS[t.prioridade]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.agente?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
