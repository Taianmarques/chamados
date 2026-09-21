"use client";

import { useEffect, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", GESTOR: "Gestão de Chamados", SUPERVISOR: "Supervisor",
  AGENTE: "Agente", SOLICITANTE: "Solicitante",
};

interface Linha { id: string; name: string; email: string; role: string; ativo: boolean; acessos: number; }

function mesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AcessosPorUsuario() {
  const [mes, setMes] = useState(mesAtualISO());
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/acessos?mes=${mes}`)
      .then((r) => r.json())
      .then(setLinhas)
      .finally(() => setLoading(false));
  }, [mes]);

  const total = linhas.reduce((s, l) => s + l.acessos, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Acessos por usuário</h2>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-6">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Usuário</th>
                <th className="py-2 pr-4">Papel</th>
                <th className="py-2 pr-4 text-right">Acessos no mês</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4">
                    <span className={l.ativo ? "" : "text-gray-400 line-through"}>{l.name}</span>
                    <p className="text-xs text-gray-400">{l.email}</p>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{ROLE_LABELS[l.role] ?? l.role}</td>
                  <td className="py-2 pr-4 text-right font-semibold text-gray-900">{l.acessos}</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Total de acessos no mês: {total}</p>
        </div>
      )}
    </div>
  );
}
