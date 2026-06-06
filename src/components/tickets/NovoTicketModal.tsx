"use client";

import { useEffect, useRef, useState } from "react";
import { useBoardStore, PIPELINE_COLUMNS } from "@/store/board";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRIORIDADES = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

interface Cliente {
  id: string;
  nome: string;
  cor: string;
  localizacoes: { id: string; nome: string; uf: string }[];
}

const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export default function NovoTicketModal({ open, onClose }: Props) {
  const { addTicket } = useBoardStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [ufFiltro, setUfFiltro] = useState("");
  const [localizacaoId, setLocalizacaoId] = useState("");
  const [ticketExterno, setTicketExterno] = useState("");
  const [ovNumero, setOvNumero] = useState("");
  const [osNumero, setOsNumero] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [valorServico, setValorServico] = useState("");
  const [status, setStatus] = useState("CHAMADO_REFRIG");
  const [prioridade, setPrioridade] = useState("MEDIA");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const firstRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (open) {
      setErro("");
      fetch("/api/clientes").then((r) => r.json()).then(setClientes);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const ufsDisponiveis = clienteSelecionado
    ? [...new Set(clienteSelecionado.localizacoes.map((l) => l.uf))].sort()
    : [];
  const localizacoesFiltradas = clienteSelecionado
    ? clienteSelecionado.localizacoes.filter((l) => !ufFiltro || l.uf === ufFiltro)
    : [];

  function handleClienteChange(id: string) {
    setClienteId(id);
    setUfFiltro("");
    setLocalizacaoId("");
  }

  function handleUfChange(uf: string) {
    setUfFiltro(uf);
    setLocalizacaoId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        clienteId, localizacaoId, status, ticketExterno, ovNumero, osNumero, contatoNome, prioridade, descricao,
        valorServico: valorServico ? parseFloat(valorServico.replace(",", ".")) : 0,
      }),
      });

      if (res.ok) {
        const ticket = await res.json();
        addTicket(ticket);
        setClienteId(""); setUfFiltro(""); setLocalizacaoId("");
        setTicketExterno(""); setOvNumero(""); setOsNumero(""); setContatoNome(""); setValorServico(""); setStatus("CHAMADO_REFRIG"); setPrioridade("MEDIA"); setDescricao("");
        setErro("");
        onClose();
      } else {
        const body = await res.json().catch(() => ({}));
        setErro(body.error ?? `Erro ao abrir chamado (${res.status})`);
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Preview do título
  const locSelecionada = localizacoesFiltradas.find((l) => l.id === localizacaoId);
  const tituloPreview = clienteSelecionado && locSelecionada
    ? `${locSelecionada.nome}/${locSelecionada.uf} - ${clienteSelecionado.nome}${ticketExterno ? ` ${ticketExterno}` : ""}${ovNumero ? ` / OV ${ovNumero}` : ""}${osNumero ? ` / OS ${osNumero}` : ""}`
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Novo Chamado</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview do título */}
        {tituloPreview && (
          <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-xs text-indigo-500 font-medium mb-0.5">Título do chamado</p>
            <p className="text-sm font-semibold text-indigo-900 font-mono">{tituloPreview}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              ref={firstRef}
              value={clienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione o cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* UF (filtro de região) */}
          {clienteId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF / Região</label>
              <select
                value={ufFiltro}
                onChange={(e) => handleUfChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas as UFs</option>
                {ufsDisponiveis.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          )}

          {/* Localização */}
          {clienteId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização *</label>
              <select
                value={localizacaoId}
                onChange={(e) => setLocalizacaoId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione a localização</option>
                {localizacoesFiltradas.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}/{l.uf}</option>
                ))}
              </select>
              {localizacoesFiltradas.length === 0 && clienteId && (
                <p className="text-xs text-gray-400 mt-1">Nenhuma localização cadastrada para este cliente{ufFiltro ? ` em ${ufFiltro}` : ""}.</p>
              )}
            </div>
          )}

          {/* Contato na empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do solicitante na empresa</label>
            <input
              value={contatoNome}
              onChange={(e) => setContatoNome(e.target.value)}
              placeholder="Nome da pessoa que solicitou o chamado"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Nº Ticket / OV / OS — mesma linha */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº Ticket</label>
              <div className="flex">
                <span className="px-2 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500 font-medium whitespace-nowrap">Nº</span>
                <input
                  value={ticketExterno}
                  onChange={(e) => setTicketExterno(e.target.value)}
                  placeholder="225258"
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OV</label>
              <div className="flex">
                <span className="px-2 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500 font-medium">OV</span>
                <input
                  value={ovNumero}
                  onChange={(e) => setOvNumero(e.target.value)}
                  placeholder="3495"
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OS</label>
              <div className="flex">
                <span className="px-2 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500 font-medium">OS</span>
                <input
                  value={osNumero}
                  onChange={(e) => setOsNumero(e.target.value)}
                  placeholder="6960"
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Etapa inicial + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa inicial *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PIPELINE_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor do serviço (R$)</label>
              <div className="flex">
                <span className="px-2.5 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500 font-medium">R$</span>
                <input
                  value={valorServico}
                  onChange={(e) => setValorServico(e.target.value)}
                  placeholder="0,00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o problema, impacto, urgência..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !clienteId || !localizacaoId}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Abrindo..." : "Abrir Chamado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
