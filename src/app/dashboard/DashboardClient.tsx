"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { formatBRL, STATUS_LABELS, PIPELINE_COLUMNS } from "@/store/board";

type Ticket = {
  id: string;
  numero: number;
  status: string;
  prioridade: string;
  ticketExterno: string;
  ovNumero: string;
  osNumero: string;
  valorServico: number;
  cliente: { id: string; nome: string; cor: string };
  localizacao: { id: string; nome: string; uf: string };
  agente: { id: string; name: string } | null;
  createdAt: string;
};

interface Props {
  tickets: Ticket[];
  userName: string;
  userRole: string;
}

const ETAPAS_FATURADO = ["FATURADO_AGUARD"];
const ETAPAS_EM_FAT = ["FATURAMENTO"];

function BarraHorizontal({ valor, max, cor }: { valor: number; max: number; cor?: string }) {
  const pct = max > 0 ? Math.max(2, (valor / max) * 100) : 0;
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: cor ?? "#6366f1" }}
      />
    </div>
  );
}

export default function DashboardClient({ tickets, userName, userRole }: Props) {
  const [periodoMeses, setPeriodoMeses] = useState<number | null>(null);

  // Filtro por período
  const ticketsFiltrados = periodoMeses
    ? tickets.filter((t) => {
        const mesesAtras = new Date();
        mesesAtras.setMonth(mesesAtras.getMonth() - periodoMeses);
        return new Date(t.createdAt) >= mesesAtras;
      })
    : tickets;

  // ── Totais ──
  const emAberto = ticketsFiltrados.filter((t) => !ETAPAS_FATURADO.includes(t.status) && !ETAPAS_EM_FAT.includes(t.status));
  const emFaturamento = ticketsFiltrados.filter((t) => ETAPAS_EM_FAT.includes(t.status));
  const faturados = ticketsFiltrados.filter((t) => ETAPAS_FATURADO.includes(t.status));

  const totalAberto = emAberto.reduce((s, t) => s + (t.valorServico ?? 0), 0);
  const totalEmFat = emFaturamento.reduce((s, t) => s + (t.valorServico ?? 0), 0);
  const totalFaturado = faturados.reduce((s, t) => s + (t.valorServico ?? 0), 0);
  const totalGeral = ticketsFiltrados.reduce((s, t) => s + (t.valorServico ?? 0), 0);

  // ── Por etapa (somente em aberto, com valor) ──
  const porEtapa = PIPELINE_COLUMNS
    .map((col) => {
      const ts = emAberto.filter((t) => t.status === col.id);
      return { id: col.id, label: col.label, cor: col.cor, valor: ts.reduce((s, t) => s + t.valorServico, 0), qtd: ts.length };
    })
    .filter((e) => e.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const maxEtapa = porEtapa[0]?.valor ?? 0;

  // ── Por empresa ──
  const porEmpresa = Object.values(
    emAberto.reduce<Record<string, { nome: string; cor: string; valor: number; qtd: number }>>((acc, t) => {
      if (!acc[t.cliente.id]) acc[t.cliente.id] = { nome: t.cliente.nome, cor: t.cliente.cor, valor: 0, qtd: 0 };
      acc[t.cliente.id].valor += t.valorServico;
      acc[t.cliente.id].qtd += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.valor - a.valor);

  const maxEmpresa = porEmpresa[0]?.valor ?? 0;

  // ── Por região (UF) ──
  const porRegiao = Object.entries(
    emAberto.reduce<Record<string, number>>((acc, t) => {
      acc[t.localizacao.uf] = (acc[t.localizacao.uf] ?? 0) + t.valorServico;
      return acc;
    }, {})
  )
    .map(([uf, valor]) => ({ uf, valor, qtd: emAberto.filter((t) => t.localizacao.uf === uf).length }))
    .sort((a, b) => b.valor - a.valor);

  const maxRegiao = porRegiao[0]?.valor ?? 0;

  // ── Por responsável (apenas com valor) ──
  const porResponsavel = Object.values(
    emAberto
      .filter((t) => t.valorServico > 0 && t.agente)
      .reduce<Record<string, { nome: string; valor: number; qtd: number }>>((acc, t) => {
        const key = t.agente!.id;
        if (!acc[key]) acc[key] = { nome: t.agente!.name, valor: 0, qtd: 0 };
        acc[key].valor += t.valorServico;
        acc[key].qtd += 1;
        return acc;
      }, {})
  ).sort((a, b) => b.valor - a.valor);

  const maxResponsavel = porResponsavel[0]?.valor ?? 0;

  const pctFaturado = totalGeral > 0 ? (totalFaturado / totalGeral) * 100 : 0;
  const pctEmFat = totalGeral > 0 ? (totalEmFat / totalGeral) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar userName={userName} userRole={userRole} />

      <div className="flex-1 max-w-6xl mx-auto w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard de Vendas</h1>
            <p className="text-sm text-gray-500 mt-0.5">{ticketsFiltrados.length} chamados no período</p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {([null, 1, 3, 6, 12] as const).map((m) => (
              <button
                key={String(m)}
                onClick={() => setPeriodoMeses(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  periodoMeses === m ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {m === null ? "Tudo" : `${m}m`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards de resumo ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total em Aberto</p>
            <p className="text-2xl font-bold text-gray-900">{formatBRL(totalAberto)}</p>
            <p className="text-xs text-gray-400 mt-1">{emAberto.length} chamados</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-1">Em Faturamento</p>
            <p className="text-2xl font-bold text-amber-600">{formatBRL(totalEmFat)}</p>
            <p className="text-xs text-gray-400 mt-1">{emFaturamento.length} chamados</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total Faturado</p>
            <p className="text-2xl font-bold text-emerald-600">{formatBRL(totalFaturado)}</p>
            <p className="text-xs text-gray-400 mt-1">{faturados.length} chamados</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-1">Volume Total</p>
            <p className="text-2xl font-bold text-indigo-700">{formatBRL(totalGeral)}</p>
            <p className="text-xs text-gray-400 mt-1">{ticketsFiltrados.length} chamados</p>
          </div>
        </div>

        {/* ── Barra de progresso faturamento ── */}
        {totalGeral > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Progresso de Faturamento</p>
              <p className="text-sm font-bold text-emerald-600">{pctFaturado.toFixed(1)}% faturado</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
              <div className="h-3 bg-emerald-500 transition-all" style={{ width: `${pctFaturado}%` }} />
              <div className="h-3 bg-amber-400 transition-all" style={{ width: `${pctEmFat}%` }} />
            </div>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Faturado
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Em faturamento
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Em aberto
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ── Por empresa ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Aberto por Empresa</h2>
            <p className="text-xs text-gray-400 mb-4">Valor total em aberto por cliente</p>
            {porEmpresa.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {porEmpresa.map((e) => (
                  <div key={e.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} />
                        <span className="text-sm font-medium text-gray-800">{e.nome}</span>
                        <span className="text-xs text-gray-400">{e.qtd} chamado{e.qtd !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(e.valor)}</span>
                    </div>
                    <BarraHorizontal valor={e.valor} max={maxEmpresa} cor={e.cor} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Por região ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Aberto por Região (UF)</h2>
            <p className="text-xs text-gray-400 mb-4">Valor total em aberto por estado</p>
            {porRegiao.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {porRegiao.map((r) => (
                  <div key={r.uf}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono w-10 text-center">{r.uf}</span>
                        <span className="text-xs text-gray-400">{r.qtd} chamado{r.qtd !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(r.valor)}</span>
                    </div>
                    <BarraHorizontal valor={r.valor} max={maxRegiao} cor="#6366f1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Por responsável ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Aberto por Responsável</h2>
          <p className="text-xs text-gray-400 mb-4">Valor total em aberto por agente atribuído</p>
          {porResponsavel.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {porResponsavel.map((r) => (
                <div key={r.nome}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                        {r.nome[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{r.nome}</span>
                      <span className="text-xs text-gray-400">{r.qtd} chamado{r.qtd !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatBRL(r.valor)}</span>
                  </div>
                  <BarraHorizontal valor={r.valor} max={maxResponsavel} cor="#6366f1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Por etapa (em aberto) ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Aberto por Etapa do Pipeline</h2>
          <p className="text-xs text-gray-400 mb-5">Valor total por etapa — apenas chamados em aberto (excluindo faturados)</p>
          {porEtapa.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem chamados em aberto com valor registrado</p>
          ) : (
            <div className="space-y-3">
              {porEtapa.map((e) => (
                <div key={e.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} />
                      <span className="text-xs text-gray-700 truncate">{e.label}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{e.qtd}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatBRL(e.valor)}</span>
                  </div>
                  <BarraHorizontal valor={e.valor} max={maxEtapa} cor={e.cor} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
