"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import LoginConfigForm from "@/components/admin/LoginConfigForm";

type Usuario = {
  id: string; name: string; email: string; role: string; ativo: boolean; createdAt: string;
  clienteId: string | null; cliente: { id: string; nome: string } | null;
  localizacaoId: string | null; localizacao: { id: string; nome: string; uf: string } | null;
};
type Localizacao = { id: string; nome: string; uf: string };
type Cliente = { id: string; nome: string; cor: string; localizacoes: Localizacao[] };

const ROLE_OPTIONS = ["ADMIN", "SUPERVISOR", "AGENTE", "SOLICITANTE"];
const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", SUPERVISOR: "Supervisor", AGENTE: "Agente", SOLICITANTE: "Solicitante" };
const CORES_PRESET = ["#6366f1","#f59e0b","#3b82f6","#ef4444","#10b981","#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316"];

const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

interface Props {
  usuarios: Usuario[];
  clientes: Cliente[];
  userName: string;
  userRole: string;
}

export default function AdminClient({ usuarios: init, clientes: initClientes, userName, userRole }: Props) {
  const [tab, setTab] = useState<"usuarios" | "clientes" | "localizacoes" | "login-config">("usuarios");
  const [usuarios, setUsuarios] = useState(init);
  const [clientes, setClientes] = useState(initClientes);
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);

  // Form novo usuário
  const [novoUser, setNovoUser] = useState({ name: "", email: "", password: "", role: "SOLICITANTE", clienteId: "", ufFiltro: "", localizacaoId: "" });
  const [savingUser, setSavingUser] = useState(false);

  // Form novo cliente
  const [novoCliente, setNovoCliente] = useState({ nome: "", cor: "#6366f1" });
  const [savingCliente, setSavingCliente] = useState(false);

  // Form nova localização
  const [novaLoc, setNovaLoc] = useState({ nome: "", uf: "", clienteId: "" });
  const [savingLoc, setSavingLoc] = useState(false);

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoUser),
    });
    if (res.ok) {
      const user = await res.json();
      setUsuarios((u) => [...u, user].sort((a, b) => a.name.localeCompare(b.name)));
      setNovoUser({ name: "", email: "", password: "", role: "SOLICITANTE", clienteId: "", ufFiltro: "", localizacaoId: "" });
    }
    setSavingUser(false);
  }

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();
    setSavingCliente(true);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoCliente),
    });
    if (res.ok) {
      const c = await res.json();
      setClientes((list) => [...list, { ...c, localizacoes: [] }].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoCliente({ nome: "", cor: "#6366f1" });
    }
    setSavingCliente(false);
  }

  async function criarLocalizacao(e: React.FormEvent) {
    e.preventDefault();
    setSavingLoc(true);
    const res = await fetch("/api/localizacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaLoc),
    });
    if (res.ok) {
      const loc = await res.json();
      setClientes((list) =>
        list.map((c) =>
          c.id === novaLoc.clienteId
            ? { ...c, localizacoes: [...c.localizacoes, loc].sort((a, b) => a.uf.localeCompare(b.uf) || a.nome.localeCompare(b.nome)) }
            : c
        )
      );
      setNovaLoc((l) => ({ ...l, nome: "", uf: "" }));
    }
    setSavingLoc(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={userName} userRole={userRole} />

      <div className="flex-1 max-w-5xl mx-auto w-full p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Administração</h1>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(["usuarios", "clientes", "localizacoes", "login-config"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {t === "usuarios" ? "Usuários" : t === "clientes" ? "Clientes" : t === "localizacoes" ? "Localizações" : "Login"}
            </button>
          ))}
        </div>

        {/* ── USUÁRIOS ── */}
        {tab === "usuarios" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Novo Usuário</h2>
              <form onSubmit={criarUsuario} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                  <input value={novoUser.name} onChange={(e) => setNovoUser((u) => ({ ...u, name: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={novoUser.email} onChange={(e) => setNovoUser((u) => ({ ...u, email: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                  <input type="password" value={novoUser.password} onChange={(e) => setNovoUser((u) => ({ ...u, password: e.target.value }))} required minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mín. 6 caracteres" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Perfil</label>
                  <select value={novoUser.role} onChange={(e) => setNovoUser((u) => ({ ...u, role: e.target.value, clienteId: "" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                {novoUser.role === "SOLICITANTE" && (() => {
                  const clienteSel = clientes.find((c) => c.id === novoUser.clienteId);
                  const ufs = [...new Set((clienteSel?.localizacoes ?? []).map((l) => l.uf))].sort();
                  const locsFiltradas = (clienteSel?.localizacoes ?? []).filter((l) => !novoUser.ufFiltro || l.uf === novoUser.ufFiltro);
                  return (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                        <select
                          value={novoUser.clienteId}
                          onChange={(e) => setNovoUser((u) => ({ ...u, clienteId: e.target.value, ufFiltro: "", localizacaoId: "" }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Selecione a empresa</option>
                          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      {clienteSel && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Região (UF)</label>
                            <select
                              value={novoUser.ufFiltro}
                              onChange={(e) => setNovoUser((u) => ({ ...u, ufFiltro: e.target.value, localizacaoId: "" }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Todas as regiões</option>
                              {ufs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Localização responsável</label>
                            <select
                              value={novoUser.localizacaoId}
                              onChange={(e) => setNovoUser((u) => ({ ...u, localizacaoId: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Sem localização específica</option>
                              {locsFiltradas.map((l) => <option key={l.id} value={l.id}>{l.uf} — {l.nome}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
                <div className="col-span-2">
                  <button type="submit" disabled={savingUser}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
                    {savingUser ? "Criando..." : "Criar Usuário"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Localização</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{u.cliente?.nome ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {u.localizacao ? <span>{u.localizacao.uf} — {u.localizacao.nome}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CLIENTES ── */}
        {tab === "clientes" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Novo Cliente</h2>
              <form onSubmit={criarCliente} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                  <input value={novoCliente.nome} onChange={(e) => setNovoCliente((c) => ({ ...c, nome: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: SMARTFIT, C&A, RENNER..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                    {CORES_PRESET.map((cor) => (
                      <button key={cor} type="button" onClick={() => setNovoCliente((c) => ({ ...c, cor }))}
                        className={`w-6 h-6 rounded-full transition-transform ${novoCliente.cor === cor ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                        style={{ backgroundColor: cor }} />
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={savingCliente}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg whitespace-nowrap">
                  {savingCliente ? "Criando..." : "Criar"}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientes.map((c) => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />
                    <span className="text-sm font-bold text-gray-900">{c.nome}</span>
                    <span className="ml-auto text-xs text-gray-400">{c.localizacoes.length} loc.</span>
                  </div>
                </div>
              ))}
              {clientes.length === 0 && <p className="col-span-3 text-sm text-gray-400 text-center py-8">Nenhum cliente cadastrado</p>}
            </div>
          </div>
        )}

        {/* ── LOCALIZAÇÕES ── */}
        {tab === "localizacoes" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Nova Localização</h2>
              <form onSubmit={criarLocalizacao} className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                  <select value={novaLoc.clienteId} onChange={(e) => setNovaLoc((l) => ({ ...l, clienteId: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">UF</label>
                  <select value={novaLoc.uf} onChange={(e) => setNovaLoc((l) => ({ ...l, uf: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione</option>
                    {UFS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome da unidade</label>
                  <input value={novaLoc.nome} onChange={(e) => setNovaLoc((l) => ({ ...l, nome: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: PITAGUARY, MEIRELES..." />
                </div>
                <div className="col-span-3">
                  <button type="submit" disabled={savingLoc}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg">
                    {savingLoc ? "Criando..." : "Adicionar Localização"}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista agrupada por cliente */}
            <div className="space-y-4">
              {clientes.map((c) => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setClienteExpandido(clienteExpandido === c.id ? null : c.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />
                    <span className="font-semibold text-gray-900">{c.nome}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.localizacoes.length} localização{c.localizacoes.length !== 1 ? "ões" : ""}</span>
                    <svg className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${clienteExpandido === c.id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {clienteExpandido === c.id && (
                    <div className="border-t border-gray-100">
                      {c.localizacoes.length === 0 ? (
                        <p className="text-sm text-gray-400 px-5 py-4">Nenhuma localização cadastrada.</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {c.localizacoes.map((l) => (
                            <div key={l.id} className="flex items-center gap-3 px-5 py-2.5">
                              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">{l.uf}</span>
                              <span className="text-sm text-gray-800">{l.nome}</span>
                              <span className="text-xs text-gray-400 ml-auto font-mono">{l.nome}/{l.uf}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFIGURAÇÃO LOGIN ── */}
        {tab === "login-config" && (
          <div className="space-y-6">
            <LoginConfigForm />
          </div>
        )}
      </div>
    </div>
  );
}
