"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PIPELINE_COLUMNS } from "@/store/board";

type Localizacao = { id: string; nome: string; uf: string };
type Cliente = { id: string; nome: string; cor: string; localizacoes: Localizacao[] };
type Ticket = {
  id: string; numero: number; descricao: string; status: string; prioridade: string;
  localizacao: Localizacao; agente: { name: string } | null; createdAt: string; resolvidoAt: string | null;
};

interface Props {
  userName: string;
  cliente: Cliente | null;
  tickets: Ticket[];
}

const STATUS_PORTAL: Record<string, { label: string; bg: string; text: string }> = {};
PIPELINE_COLUMNS.forEach((c) => {
  const map = {
    chamado:     { label: "Novo",          bg: "bg-blue-100",    text: "text-blue-700" },
    orcamento:   { label: "Em análise",    bg: "bg-amber-100",   text: "text-amber-700" },
    orc_aprov:   { label: "Aprovado",      bg: "bg-emerald-100", text: "text-emerald-700" },
    compras:     { label: "Em compras",    bg: "bg-violet-100",  text: "text-violet-700" },
    corretiva:   { label: "Em execução",   bg: "bg-orange-100",  text: "text-orange-700" },
    faturamento: { label: "Concluído",     bg: "bg-green-100",   text: "text-green-700" },
  };
  STATUS_PORTAL[c.id] = map[c.grupo as keyof typeof map];
});

const PRIORIDADE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  BAIXA:   { label: "Baixa",  bg: "bg-gray-100",   text: "text-gray-600" },
  MEDIA:   { label: "Média",  bg: "bg-blue-100",   text: "text-blue-700" },
  ALTA:    { label: "Alta",   bg: "bg-orange-100", text: "text-orange-700" },
  CRITICA: { label: "Crítica",bg: "bg-red-100",    text: "text-red-700" },
};

const TIPOS = [
  { status: "CHAMADO_REFRIG",    label: "Refrigeração / Exaustão" },
  { status: "CHAMADO_CIVIL",     label: "Civil / Elétrica / Marcenaria" },
  { status: "CHAMADO_BEBEDOURO", label: "Bebedouro" },
  { status: "CHAMADO_CAPEX",     label: "Capex" },
];

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PortalClient({ userName, cliente, tickets: init }: Props) {
  const router = useRouter();
  const [tickets, setTickets] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: TIPOS[0].status,
    localizacaoId: "",
    prioridade: "MEDIA",
    descricao: "",
    contatoNome: "",
  });
  const [erro, setErro] = useState("");

  const faturados = tickets.filter((t) => ["FATURAMENTO", "FATURADO_AGUARD"].includes(t.status));
  const emAberto  = tickets.filter((t) => !["FATURAMENTO", "FATURADO_AGUARD"].includes(t.status));

  async function abrirChamado(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;
    if (!form.localizacaoId) { setErro("Selecione a localização."); return; }
    if (!form.descricao.trim()) { setErro("Descreva o problema."); return; }
    setErro("");
    setSaving(true);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: cliente.id,
        localizacaoId: form.localizacaoId,
        status: form.tipo,
        prioridade: form.prioridade,
        descricao: form.descricao,
        contatoNome: form.contatoNome,
      }),
    });

    if (res.ok) {
      const novo = await res.json();
      setTickets((t) => [novo, ...t]);
      setModalOpen(false);
      setForm({ tipo: TIPOS[0].status, localizacaoId: "", prioridade: "MEDIA", descricao: "", contatoNome: "" });
      router.refresh();
    } else {
      const data = await res.json();
      setErro(data.error ?? "Erro ao abrir chamado.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ backgroundColor: cliente?.cor ?? "#6366f1" }}
          >
            {(cliente?.nome ?? "?")[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{cliente?.nome ?? "Sem empresa vinculada"}</p>
            <p className="text-xs text-gray-500">{userName}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Sair
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* KPIs + Botão */}
        <div className="flex items-center gap-4">
          <div className="flex gap-3 flex-1">
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-0.5">
              <p className="text-xs font-medium text-gray-500">Total</p>
              <p className="text-3xl font-black text-gray-900">{tickets.length}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-2xl px-5 py-4 flex flex-col gap-0.5">
              <p className="text-xs font-medium text-blue-600">Em aberto</p>
              <p className="text-3xl font-black text-blue-700">{emAberto.length}</p>
            </div>
            <div className="bg-white border border-green-200 rounded-2xl px-5 py-4 flex flex-col gap-0.5">
              <p className="text-xs font-medium text-green-600">Concluídos</p>
              <p className="text-3xl font-black text-green-700">{faturados.length}</p>
            </div>
          </div>

          {cliente ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Abrir Chamado
            </button>
          ) : (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Sua conta não está vinculada a uma empresa. Contate o administrador.
            </div>
          )}
        </div>

        {/* Lista de chamados */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Meus Chamados</h2>
          </div>

          {tickets.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Nenhum chamado aberto ainda.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nº</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localização</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Abertura</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => {
                  const st = STATUS_PORTAL[t.status];
                  const pr = PRIORIDADE_CONFIG[t.prioridade];
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-black text-indigo-600">#{t.numero}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="truncate text-gray-800 font-medium">{t.descricao || "—"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700">{t.localizacao.nome}</span>
                        <span className="ml-1.5 text-xs font-bold text-gray-400 font-mono">{t.localizacao.uf}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pr?.bg} ${pr?.text}`}>
                          {pr?.label ?? t.prioridade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st?.bg} ${st?.text}`}>
                          {st?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{t.agente?.name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal — Novo Chamado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Abrir Novo Chamado</h2>
              <button onClick={() => { setModalOpen(false); setErro(""); }}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={abrirChamado} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de chamado</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TIPOS.map((t) => <option key={t.status} value={t.status}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Localização</label>
                <select
                  value={form.localizacaoId}
                  onChange={(e) => setForm((f) => ({ ...f, localizacaoId: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione a unidade</option>
                  {cliente?.localizacoes.map((l) => (
                    <option key={l.id} value={l.id}>{l.uf} — {l.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prioridade</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["BAIXA", "MEDIA", "ALTA"] as const).map((p) => {
                    const cfg = PRIORIDADE_CONFIG[p];
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => setForm((f) => ({ ...f, prioridade: p }))}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          form.prioridade === p
                            ? `${cfg.bg} ${cfg.text} border-current`
                            : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-300"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descrição do problema</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  required rows={4}
                  placeholder="Descreva o problema com detalhes..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Seu nome / contato</label>
                <input
                  value={form.contatoNome}
                  onChange={(e) => setForm((f) => ({ ...f, contatoNome: e.target.value }))}
                  placeholder="Nome para contato"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erro}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setModalOpen(false); setErro(""); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm">
                  {saving ? "Enviando..." : "Abrir Chamado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
