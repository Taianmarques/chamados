"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface Props {
  userName: string;
  userRole: string;
}

type NotificacaoItem = {
  id: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
  ticket: { id: string; numero: number };
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestão de Chamados",
  SUPERVISOR: "Supervisor",
  AGENTE: "Agente",
  SOLICITANTE: "Solicitante",
};

export default function Navbar({ userName, userRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);

  async function buscarNotificacoes() {
    try {
      const res = await fetch("/api/notificacoes");
      if (!res.ok) return;
      const data = await res.json();
      setNaoLidas(data.naoLidas);
      setNotificacoes(data.notificacoes);
    } catch {
      // silencioso — não é crítico falhar uma atualização de notificações
    }
  }

  useEffect(() => {
    buscarNotificacoes();
    const intervalId = setInterval(buscarNotificacoes, 30_000);
    return () => clearInterval(intervalId);
  }, []);

  async function abrirNotificacao(n: NotificacaoItem) {
    setNotifOpen(false);
    if (!n.lida) {
      await fetch(`/api/notificacoes/${n.id}`, { method: "PATCH" });
      setNaoLidas((v) => Math.max(0, v - 1));
      setNotificacoes((lista) => lista.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
    }
    router.push(`/tickets/${n.ticket.id}`);
  }

  async function marcarTodasLidas() {
    await fetch("/api/notificacoes", { method: "POST" });
    setNaoLidas(0);
    setNotificacoes((lista) => lista.map((x) => ({ ...x, lida: true })));
  }

  const links = userRole === "SOLICITANTE" ? [
    { href: "/portal", label: "Meus Chamados", live: false },
  ] : userRole === "SUPERVISOR" ? [
    { href: "/board", label: "Board", live: false },
    { href: "/relatorios", label: "Relatórios", live: false },
    { href: "/importar", label: "Importar", live: false },
    { href: "/tv", label: "Ao Vivo", live: true },
  ] : userRole === "GESTOR" ? [
    { href: "/board", label: "Pipeline", live: false },
    { href: "/tv", label: "Ao Vivo", live: true },
  ] : [
    { href: "/board", label: "Board", live: false },
    ...(["ADMIN", "AGENTE"].includes(userRole) ? [{ href: "/dashboard", label: "Dashboard", live: false }] : []),
    ...(userRole === "ADMIN" ? [{ href: "/relatorios", label: "Relatórios", live: false }] : []),
    ...(userRole === "ADMIN" ? [{ href: "/importar", label: "Importar", live: false }] : []),
    ...(["ADMIN", "AGENTE"].includes(userRole) ? [{ href: "/tv", label: "Ao Vivo", live: true }] : []),
    ...(userRole === "ADMIN" ? [{ href: "/admin", label: "Admin", live: false }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          S
        </div>
        <span className="font-semibold text-gray-900 text-sm hidden sm:block">Chamados</span>
      </div>

      <div className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              link.live
                ? pathname.startsWith(link.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                : pathname.startsWith(link.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {link.live && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {link.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto relative">
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notificações"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {naoLidas > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notificações</span>
                {naoLidas > 0 && (
                  <button onClick={marcarTodasLidas} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {notificacoes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma notificação ainda.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notificacoes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => abrirNotificacao(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-2 ${!n.lida ? "bg-indigo-50/50" : ""}`}
                    >
                      {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                      <div className={!n.lida ? "" : "pl-3.5"}>
                        <p className="text-sm text-gray-800">{n.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
