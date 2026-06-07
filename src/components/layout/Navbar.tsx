"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface Props {
  userName: string;
  userRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  AGENTE: "Agente",
  SOLICITANTE: "Solicitante",
};

export default function Navbar({ userName, userRole }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = userRole === "SOLICITANTE" ? [
    { href: "/portal", label: "Meus Chamados", live: false },
  ] : [
    { href: "/board", label: "Board", live: false },
    ...(["ADMIN", "SUPERVISOR", "AGENTE"].includes(userRole) ? [{ href: "/dashboard", label: "Dashboard", live: false }] : []),
    ...(["ADMIN", "SUPERVISOR"].includes(userRole) ? [{ href: "/relatorios", label: "Relatórios", live: false }] : []),
    ...(["ADMIN", "SUPERVISOR"].includes(userRole) ? [{ href: "/importar", label: "Importar", live: false }] : []),
    ...(["ADMIN", "SUPERVISOR", "AGENTE"].includes(userRole) ? [{ href: "/tv", label: "Ao Vivo", live: true }] : []),
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
