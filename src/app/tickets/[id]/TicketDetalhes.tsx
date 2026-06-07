"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { tituloTicket, formatBRL, PIPELINE_COLUMNS, STATUS_LABELS } from "@/store/board";
const PRIORIDADE_LABELS: Record<string, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };
const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: "bg-gray-100 text-gray-600", MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700", CRITICA: "bg-red-100 text-red-700",
};

type Ticket = {
  id: string; numero: number; descricao: string; status: string; prioridade: string;
  ticketExterno: string; ovNumero: string; osNumero: string; valorServico: number; contatoNome: string;
  cliente: { id: string; nome: string; cor: string };
  localizacao: { id: string; nome: string; uf: string };
  solicitante: { id: string; name: string };
  agente: { id: string; name: string } | null;
  comentarios: {
    id: string; texto: string; interno: boolean; createdAt: string;
    autor: { id: string; name: string; role: string };
  }[];
  anexos: {
    id: string; originalName: string; mimeType: string; size: number; createdAt: string;
    uploadedBy: { name: string };
  }[];
  createdAt: string; updatedAt: string; resolvidoAt: string | null;
};

interface Props {
  ticket: Ticket;
  agentes: { id: string; name: string }[];
  currentUser: { id: string; role: string; name: string };
}

export default function TicketDetalhes({ ticket: initial, agentes, currentUser }: Props) {
  const [ticket, setTicket] = useState(initial);
  const [comentario, setComentario] = useState("");
  const [interno, setInterno] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDescricao, setEditDescricao] = useState(ticket.descricao);
  const [editContato, setEditContato] = useState(ticket.contatoNome);
  const [editTicketExt, setEditTicketExt] = useState(ticket.ticketExterno);
  const [editOv, setEditOv] = useState(ticket.ovNumero);
  const [editOs, setEditOs] = useState(ticket.osNumero);

  const isAgente   = ["AGENTE", "ADMIN", "SUPERVISOR"].includes(currentUser.role);
  const isGestor   = ["ADMIN", "SUPERVISOR"].includes(currentUser.role);
  const resolvido  = !!ticket.resolvidoAt;
  const titulo = tituloTicket(ticket);

  async function salvarEdicao() {
    setSaving(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: editDescricao,
        contatoNome: editContato,
        ticketExterno: editTicketExt,
        ovNumero: editOv,
        osNumero: editOs,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket((t) => ({ ...t, ...updated }));
      setEditMode(false);
    }
    setSaving(false);
  }

  function cancelarEdicao() {
    setEditDescricao(ticket.descricao);
    setEditContato(ticket.contatoNome);
    setEditTicketExt(ticket.ticketExterno);
    setEditOv(ticket.ovNumero);
    setEditOs(ticket.osNumero);
    setEditMode(false);
  }

  async function updateField(field: string, value: string) {
    setSaving(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket((t) => ({ ...t, ...updated }));
    }
    setSaving(false);
  }

  async function marcarResolvido(resolver: boolean) {
    setSaving(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolvidoAt: resolver ? new Date().toISOString() : null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket((t) => ({ ...t, resolvidoAt: updated.resolvidoAt }));
    }
    setSaving(false);
  }

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;
    setSendingComment(true);
    const res = await fetch(`/api/tickets/${ticket.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: comentario, interno }),
    });
    if (res.ok) {
      const novo = await res.json();
      setTicket((t) => ({ ...t, comentarios: [...t.comentarios, novo] }));
      setComentario("");
    }
    setSendingComment(false);
  }

  async function uploadArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/tickets/${ticket.id}/anexos`, { method: "POST", body: form });
    if (res.ok) {
      const novo = await res.json();
      setTicket((t) => ({ ...t, anexos: [...t.anexos, novo] }));
    }
    e.target.value = "";
    setUploading(false);
  }

  async function deletarAnexo(id: string) {
    const res = await fetch(`/api/anexos/${id}`, { method: "DELETE" });
    if (res.ok) setTicket((t) => ({ ...t, anexos: t.anexos.filter((a) => a.id !== id) }));
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={currentUser.name} userRole={currentUser.role} />

      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="mb-4">
          <Link href="/board" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Board
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm font-mono text-gray-400">#{ticket.numero}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 max-w-[180px] truncate" title={STATUS_LABELS[ticket.status]}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDADE_COLORS[ticket.prioridade]}`}>
                  {PRIORIDADE_LABELS[ticket.prioridade]}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${ticket.cliente.cor}20`, color: ticket.cliente.cor }}
                >
                  {ticket.cliente.nome}
                </span>
                {saving && <span className="text-xs text-gray-400">Salvando...</span>}
                <div className="ml-auto flex items-center gap-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={cancelarEdicao}
                        className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={salvarEdicao}
                        disabled={saving}
                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                      >
                        {saving ? "Salvando..." : "Salvar edições"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {/* Título estruturado */}
              <h1 className="text-base font-bold text-gray-900 font-mono mb-2 break-words">{titulo}</h1>

              {/* Nº Ticket / OV / OS editáveis */}
              {isAgente ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nº Ticket</label>
                    <div className="flex">
                      <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500">Nº</span>
                      <input
                        value={editTicketExt}
                        onChange={(e) => setEditTicketExt(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">OV</label>
                    <div className="flex">
                      <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500">OV</span>
                      <input
                        value={editOv}
                        onChange={(e) => setEditOv(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">OS</label>
                    <div className="flex">
                      <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500">OS</span>
                      <input
                        value={editOs}
                        onChange={(e) => setEditOs(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-700">
                  {ticket.ticketExterno && <span><span className="text-gray-400 text-xs">Ticket</span> {ticket.ticketExterno}</span>}
                  {ticket.ovNumero && <span><span className="text-gray-400 text-xs">OV</span> {ticket.ovNumero}</span>}
                  {ticket.osNumero && <span><span className="text-gray-400 text-xs">OS</span> {ticket.osNumero}</span>}
                  {ticket.valorServico > 0 && (
                    <span className="font-bold text-emerald-700">{formatBRL(ticket.valorServico)}</span>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Solicitante na empresa</label>
                      <input
                        value={editContato}
                        onChange={(e) => setEditContato(e.target.value)}
                        placeholder="Nome da pessoa que solicitou"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
                      <textarea
                        value={editDescricao}
                        onChange={(e) => setEditDescricao(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {ticket.contatoNome && (
                      <p className="text-xs text-gray-400 mb-2">
                        Solicitado por: <span className="font-semibold text-gray-700">{ticket.contatoNome}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {ticket.descricao || <span className="text-gray-400 italic">Sem descrição</span>}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Comentários */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Comentários ({ticket.comentarios.filter((c) => !c.interno || isAgente).length})
              </h2>

              <div className="space-y-4 mb-6">
                {ticket.comentarios
                  .filter((c) => !c.interno || isAgente)
                  .map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {c.autor.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{c.autor.name}</span>
                          {c.interno && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Nota interna</span>
                          )}
                          <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className={`text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 ${c.interno ? "border border-yellow-200" : ""}`}>
                          {c.texto}
                        </div>
                      </div>
                    </div>
                  ))}
                {ticket.comentarios.filter((c) => !c.interno || isAgente).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum comentário ainda</p>
                )}
              </div>

              <form onSubmit={enviarComentario} className="space-y-3">
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  placeholder="Escreva um comentário..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  {isAgente && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} className="rounded" />
                      Nota interna
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={sendingComment || !comentario.trim()}
                    className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {sendingComment ? "Enviando..." : "Comentar"}
                  </button>
                </div>
              </form>
            </div>

            {/* Anexos */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Anexos ({ticket.anexos.length})
                </h2>
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  uploading ? "bg-gray-100 text-gray-400" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {uploading ? "Enviando..." : "Anexar arquivo"}
                  <input type="file" className="hidden" onChange={uploadArquivo} disabled={uploading} />
                </label>
              </div>

              {ticket.anexos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum arquivo anexado</p>
              ) : (
                <div className="space-y-2">
                  {ticket.anexos.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 group transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.originalName}</p>
                        <p className="text-xs text-gray-400">
                          {formatBytes(a.size)} · {a.uploadedBy.name} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/api/anexos/${a.id}`}
                          download={a.originalName}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        {isAgente && (
                          <button
                            onClick={() => deletarAnexo(a.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Remover"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Detalhes</h2>

              {isAgente && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Etapa</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PIPELINE_COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {isAgente && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor do serviço</label>
                  <div className="flex">
                    <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500">R$</span>
                    <input
                      defaultValue={ticket.valorServico > 0 ? String(ticket.valorServico) : ""}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value.replace(",", "."));
                        if (!isNaN(v) && v !== ticket.valorServico) updateField("valorServico", String(v));
                      }}
                      placeholder="0,00"
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {!isAgente && ticket.valorServico > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Valor do serviço</p>
                  <p className="text-sm font-bold text-emerald-700">{formatBRL(ticket.valorServico)}</p>
                </div>
              )}

              {isAgente && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prioridade</label>
                  <select
                    value={ticket.prioridade}
                    onChange={(e) => updateField("prioridade", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(PRIORIDADE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {isAgente && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Responsável</label>
                  <select
                    value={ticket.agente?.id ?? ""}
                    onChange={(e) => updateField("agenteId", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Não atribuído</option>
                    {agentes.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {isGestor && (
                <div className="pt-2 border-t border-gray-100">
                  {resolvido ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-green-700">Resolvido</p>
                          <p className="text-xs text-green-600">{new Date(ticket.resolvidoAt!).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => marcarResolvido(false)}
                        disabled={saving}
                        className="w-full px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Reabrir chamado
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => marcarResolvido(true)}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Marcar como Resolvido
                    </button>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 space-y-2.5">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="text-sm font-semibold" style={{ color: ticket.cliente.cor }}>{ticket.cliente.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Localização</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.localizacao.nome}/{ticket.localizacao.uf}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Aberto por (sistema)</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.solicitante.name}</p>
                </div>
                {ticket.contatoNome && (
                  <div>
                    <p className="text-xs text-gray-500">Solicitante na empresa</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.contatoNome}</p>
                  </div>
                )}
                {ticket.agente && (
                  <div>
                    <p className="text-xs text-gray-500">Responsável</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.agente.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Aberto em</p>
                  <p className="text-sm text-gray-700">{new Date(ticket.createdAt).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
