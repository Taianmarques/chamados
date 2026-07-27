"use client";

import Link from "next/link";
import { PIPELINE_COLUMNS, tituloTicket, formatBRL, type Ticket } from "@/store/board";

const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: "bg-gray-100 text-gray-600",
  MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
};
const PRIORIDADE_LABELS: Record<string, string> = {
  BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica",
};

interface Props {
  ticket: Ticket;
  onMover: (novoStatus: string) => void;
}

export default function MobileTicketCard({ ticket, onMover }: Props) {
  const dias = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 86400000);
  const titulo = tituloTicket(ticket);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[11px] text-gray-400 font-mono">#{ticket.numero}</span>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[ticket.prioridade]}`}>
          {PRIORIDADE_LABELS[ticket.prioridade]}
        </span>
      </div>

      <Link href={`/tickets/${ticket.id}`} className="block text-sm font-semibold text-gray-900 mb-1 break-words">
        {titulo}
      </Link>

      {ticket.descricao && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.descricao}</p>
      )}

      {ticket.valorServico > 0 && (
        <p className="text-sm font-bold text-emerald-700 mb-2">{formatBRL(ticket.valorServico)}</p>
      )}

      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-gray-500">
        <div className="flex items-center gap-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: ticket.cliente.cor }}
          >
            {ticket.cliente.nome[0]}
          </div>
          <span className="flex-shrink-0">{ticket.localizacao.uf}</span>
          <span className="truncate">{ticket.agente ? ticket.agente.name : "Sem responsável"}</span>
        </div>
        <span className="flex-shrink-0">{dias === 0 ? "hoje" : `${dias}d`}</span>
      </div>

      <select
        value={ticket.status}
        onChange={(e) => onMover(e.target.value)}
        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-700"
      >
        {PIPELINE_COLUMNS.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}
