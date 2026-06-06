"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import NovoTicketModal from "@/components/tickets/NovoTicketModal";
import { useBoardStore, SETORES, type SetorId } from "@/store/board";

const KanbanBoard = dynamic(() => import("@/components/board/KanbanBoard"), { ssr: false });

interface Props { userName: string; userRole: string; }

interface Cliente { id: string; nome: string; cor: string; localizacoes: { uf: string }[]; }

const PRIORIDADE_LABELS: Record<string, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };
const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;

export default function BoardClient({ userName, userRole }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const {
    tickets, busca, filtroClienteId, filtroUf, filtroPrioridade, filtroSetor, filtroPeriodo,
    setBusca, setFiltroClienteId, setFiltroUf, setFiltroPrioridade, setFiltroSetor, setFiltroPeriodo,
  } = useBoardStore();

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClientes);
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === filtroClienteId);
  const ufsDisponiveis = clienteSelecionado
    ? [...new Set(clienteSelecionado.localizacoes.map((l) => l.uf))].sort()
    : [];

  function handleClienteChange(id: string) {
    setFiltroClienteId(id || null);
    setFiltroUf(null);
  }

  const totalAbertos = tickets.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={userName} userRole={userRole} />

      <div className="flex-1 flex flex-col p-4 min-w-0">
        {/* Linha de controles */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">Pipeline de Chamados</h1>
            <p className="text-xs text-gray-500">{totalAbertos} chamado{totalAbertos !== 1 ? "s" : ""} carregado{totalAbertos !== 1 ? "s" : ""}</p>
          </div>

          {/* Busca por Ticket / OV / OS */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Ticket, OV ou OS..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtro cliente */}
          <select
            value={filtroClienteId ?? ""}
            onChange={(e) => handleClienteChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          {/* Filtro UF */}
          {filtroClienteId && ufsDisponiveis.length > 0 && (
            <select
              value={filtroUf ?? ""}
              onChange={(e) => setFiltroUf(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas UFs</option>
              {ufsDisponiveis.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          )}

          {/* Filtro prioridade */}
          <select
            value={filtroPrioridade ?? ""}
            onChange={(e) => setFiltroPrioridade((e.target.value as typeof PRIORIDADES[number]) || null)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas prioridades</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABELS[p]}</option>)}
          </select>

          {/* Filtro período */}
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {([null, "dia", "semana", "mes", "ano"] as const).map((p) => (
              <button
                key={String(p)}
                onClick={() => setFiltroPeriodo(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filtroPeriodo === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === null ? "Tudo" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Chamado
          </button>
        </div>

        {/* Filtro por setor */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setFiltroSetor(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filtroSetor === null
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            Todos os setores
          </button>
          {SETORES.map((s) => (
            <button
              key={s.id}
              onClick={() => setFiltroSetor(filtroSetor === s.id ? null : s.id as SetorId)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filtroSetor === s.id
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
              style={filtroSetor === s.id ? { backgroundColor: s.cor, borderColor: s.cor } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>

        <KanbanBoard />
      </div>

      <NovoTicketModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
