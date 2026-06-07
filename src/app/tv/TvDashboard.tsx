"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_COLUMNS, SETORES } from "@/store/board";

type Ticket = {
  id: string; numero: number; status: string; prioridade: string; descricao: string;
  valorServico: number; ticketExterno: string; ovNumero: string; osNumero: string;
  cliente: { id: string; nome: string; cor: string };
  localizacao: { id: string; nome: string; uf: string };
  agente: { name: string } | null;
  createdAt: string; resolvidoAt: string | null;
};

interface Props { tickets: Ticket[]; }

const GRUPOS_CONFIG = [
  { id: "chamado",     label: "Chamado",        cor: "#3b82f6" },
  { id: "orcamento",   label: "Orçamento",       cor: "#f59e0b" },
  { id: "orc_aprov",   label: "Orc. Aprovado",   cor: "#10b981" },
  { id: "compras",     label: "Compras",          cor: "#8b5cf6" },
  { id: "corretiva",   label: "Corretiva",        cor: "#ef4444" },
  { id: "faturamento", label: "Faturamento",      cor: "#059669" },
] as const;

const FATURAMENTO_IDS = ["FATURAMENTO", "FATURADO_AGUARD"];
const CORRETIVA_IDS   = ["CORRETIVA_REFRIG","CORRETIVA_CIVIL","CORRETIVA_BEBEDOURO","CORRETIVA_CAPEX","CORRETIVA_SEM_APROV","EMERGENCIAL"];

const GRUPO_BADGE: Record<string, string> = {
  chamado:     "bg-blue-900/60 text-blue-300",
  orcamento:   "bg-amber-900/60 text-amber-300",
  orc_aprov:   "bg-emerald-900/60 text-emerald-300",
  compras:     "bg-violet-900/60 text-violet-300",
  corretiva:   "bg-red-900/60 text-red-300",
  faturamento: "bg-green-900/60 text-green-300",
};
const GRUPO_SHORT: Record<string, string> = {
  chamado: "Chamado", orcamento: "Orçamento", orc_aprov: "Orc.Aprovado",
  compras: "Compras", corretiva: "Corretiva", faturamento: "Faturamento",
};

const STATUS_BADGE: Record<string, string>  = {};
const STATUS_SHORT: Record<string, string>  = {};
PIPELINE_COLUMNS.forEach((c) => {
  STATUS_BADGE[c.id] = GRUPO_BADGE[c.grupo]  ?? "bg-gray-800 text-gray-400";
  STATUS_SHORT[c.id] = GRUPO_SHORT[c.grupo]  ?? c.grupo;
});

function tempoAtras(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function mediaTempoResolucao(tickets: Ticket[]) {
  const res = tickets.filter((t) => t.resolvidoAt);
  if (!res.length) return null;
  const ms = res.reduce((s, t) =>
    s + (new Date(t.resolvidoAt!).getTime() - new Date(t.createdAt).getTime()), 0
  ) / res.length;
  const dias  = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  return dias > 0 ? `${dias}d ${horas}h` : `${horas}h`;
}

export default function TvDashboard({ tickets }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [router]);

  const faturados = tickets.filter((t) => FATURAMENTO_IDS.includes(t.status));
  const corretiva = tickets.filter((t) => CORRETIVA_IDS.includes(t.status));
  const criticos  = tickets.filter((t) => t.prioridade === "CRITICA" && !FATURAMENTO_IDS.includes(t.status));
  const emAberto  = tickets.filter((t) => !FATURAMENTO_IDS.includes(t.status));
  const mediaRes  = mediaTempoResolucao(tickets);
  const recentes  = tickets.slice(0, 10); // já vem ordenado por createdAt desc

  const porGrupo = GRUPOS_CONFIG.map((g) => {
    const cols  = PIPELINE_COLUMNS.filter((c) => c.grupo === g.id);
    const total = cols.reduce((s, c) => s + tickets.filter((t) => t.status === c.id).length, 0);
    return { ...g, total };
  });

  const porSetor = SETORES.map((s) => {
    const total = (s.colunas as readonly string[]).reduce(
      (sum, col) => sum + tickets.filter((t) => t.status === col).length, 0
    );
    return { ...s, total };
  });

  const porCliente = Object.values(
    tickets.reduce<Record<string, { nome: string; cor: string; total: number; abertos: number }>>((acc, t) => {
      if (!acc[t.cliente.id]) acc[t.cliente.id] = { nome: t.cliente.nome, cor: t.cliente.cor, total: 0, abertos: 0 };
      acc[t.cliente.id].total++;
      if (!FATURAMENTO_IDS.includes(t.status)) acc[t.cliente.id].abertos++;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const maxCliente = Math.max(...porCliente.map((c) => c.total), 1);

  const porUf = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.localizacao.uf] = (acc[t.localizacao.uf] ?? 0) + 1;
    return acc;
  }, {});
  const maxUf = Math.max(...Object.values(porUf), 1);

  const kpis = [
    { label: "Total de Chamados", value: tickets.length,   cor: "#ffffff", borda: "#374151" },
    { label: "Em Aberto",         value: emAberto.length,  cor: "#60a5fa", borda: "#1d4ed8" },
    { label: "Em Corretiva",      value: corretiva.length, cor: "#f87171", borda: "#b91c1c" },
    { label: "Críticos Ativos",   value: criticos.length,  cor: "#fb923c", borda: "#c2410c" },
    { label: "Faturados",         value: faturados.length, cor: "#34d399", borda: "#065f46" },
  ];

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col min-h-0 select-none">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black">S</div>
          <span className="text-base font-semibold tracking-tight">Sistema de Chamados</span>
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold ml-2 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </span>
        </div>
        <div className="flex items-center gap-6">
          {mediaRes && (
            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Média resolução:&nbsp;<span className="text-white font-bold">{mediaRes}</span>
            </span>
          )}
          <span className="text-gray-400 text-xs">
            {now?.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }) ?? ""}
          </span>
          <span className="font-mono font-bold text-2xl tabular-nums">
            {now?.toLocaleTimeString("pt-BR") ?? "--:--:--"}
          </span>
        </div>
      </header>

      <div
        className="flex-1 p-4 min-h-0 overflow-hidden"
        style={{ display: "grid", gap: "12px", gridTemplateRows: "auto auto 1fr 140px" }}
      >

        {/* Row 1 — KPIs */}
        <div className="grid grid-cols-5 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border bg-gray-900 px-5 py-4 flex flex-col gap-1"
              style={{ borderColor: k.borda }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{k.label}</p>
              <p className="text-5xl font-black leading-none tabular-nums" style={{ color: k.cor }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Row 2 — Por Etapa | Por Supervisão */}
        <div className="grid grid-cols-2 gap-3">

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Por Etapa do Pipeline</h2>
            <div className="grid grid-cols-3 gap-2">
              {porGrupo.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bg-gray-800/60"
                  style={{ borderLeft: `3px solid ${g.cor}` }}
                >
                  <span className="text-xs font-semibold text-gray-300 truncate">{g.label}</span>
                  <span className="text-2xl font-black tabular-nums ml-2 shrink-0" style={{ color: g.cor }}>{g.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Por Supervisão</h2>
            <div className="grid grid-cols-3 gap-2">
              {porSetor.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bg-gray-800/60"
                  style={{ borderLeft: `3px solid ${s.cor}` }}
                >
                  <span className="text-xs font-semibold text-gray-300 truncate">{s.label}</span>
                  <span className="text-2xl font-black tabular-nums ml-2 shrink-0" style={{ color: s.cor }}>{s.total}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Row 3 — Clientes | Críticos | Mais Recentes */}
        <div className="grid grid-cols-3 gap-3 min-h-0">

          {/* Clientes */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col min-h-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 shrink-0">Clientes</h2>
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
              {porCliente.length === 0 && <p className="text-sm text-gray-600">Sem dados</p>}
              {porCliente.slice(0, 4).map((c) => (
                <div key={c.nome} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                      <span className="text-sm font-bold text-gray-100 truncate">{c.nome}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-2xl font-black tabular-nums">{c.total}</span>
                      <span className="text-xs text-gray-500">{c.abertos} ab.</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${(c.total / maxCliente) * 100}%`, backgroundColor: c.cor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Críticos em destaque */}
          <div className="bg-gray-900 border border-red-900/60 rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-widest text-red-400">
                Críticos em Destaque&nbsp;<span className="text-red-300">({criticos.length})</span>
              </h2>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
              {criticos.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-600">Nenhum chamado crítico</p>
                </div>
              )}
              {criticos.slice(0, 4).map((t) => (
                <div key={t.id} className="rounded-xl border px-3 py-2 flex items-start gap-2 bg-red-950/20 border-red-900/40 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.cliente.cor }} />
                      <span className="text-xs font-bold text-gray-100 truncate">{t.cliente.nome}</span>
                      <span className="text-xs text-gray-500 shrink-0 font-mono">{t.localizacao.uf}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{t.localizacao.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${STATUS_BADGE[t.status] ?? "bg-gray-800 text-gray-300"}`}>
                        {STATUS_SHORT[t.status] ?? t.status}
                      </span>
                      <span className="text-[10px] text-gray-500">{tempoAtras(t.createdAt)} atrás</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mais Recentes */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col min-h-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 shrink-0">Mais Recentes</h2>
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
              {recentes.map((t) => (
                <div key={t.id} className="rounded-lg border border-gray-700/50 px-2.5 py-1.5 flex items-start gap-2 bg-gray-800/40 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: t.cliente.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-200 truncate">{t.cliente.nome}</span>
                      <span className="text-xs text-gray-500 shrink-0 font-mono">{t.localizacao.uf}</span>
                      <span className="text-xs font-black font-mono text-indigo-400 shrink-0">#{t.ticketExterno || t.numero}</span>
                      {t.ovNumero && <span className="text-[10px] text-gray-500 font-mono shrink-0">OV {t.ovNumero}</span>}
                      {t.osNumero && <span className="text-[10px] text-gray-500 font-mono shrink-0">OS {t.osNumero}</span>}
                    </div>
                    {t.descricao && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{t.descricao}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${STATUS_BADGE[t.status] ?? "bg-gray-800 text-gray-300"}`}>
                      {STATUS_SHORT[t.status] ?? t.status}
                    </span>
                    <span className="text-[10px] text-gray-500">{tempoAtras(t.createdAt)} atrás</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Row 4 — Por Região (largura total) */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col p-4 min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Por Região (UF)</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Menos</span>
              {["#1e3a5f","#1d4ed8","#2563eb","#3b82f6","#60a5fa"].map((c) => (
                <span key={c} className="w-5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Mais</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {Object.keys(porUf).length === 0 ? (
              <p className="text-sm text-gray-600">Sem dados regionais</p>
            ) : (
              <div
                className="h-full"
                style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px 48px", alignContent: "start" }}
              >
                {Object.entries(porUf)
                  .sort(([, a], [, b]) => b - a)
                  .map(([uf, count]) => {
                    const ratio = count / maxUf;
                    const barColor = ratio > 0.85 ? "#60a5fa"
                      : ratio > 0.65 ? "#3b82f6"
                      : ratio > 0.35 ? "#2563eb"
                      : ratio > 0.15 ? "#1d4ed8"
                      : "#1e3a5f";
                    return (
                      <div key={uf} className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-gray-400 w-7 shrink-0">{uf}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="text-sm font-black tabular-nums text-white w-6 text-right shrink-0">{count}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
