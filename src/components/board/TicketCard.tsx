"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import type { Ticket } from "@/store/board";
import { tituloTicket, formatBRL } from "@/store/board";

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
  overlay?: boolean;
}

export default function TicketCard({ ticket, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dias = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 86400000);
  const titulo = tituloTicket(ticket);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border border-gray-200 p-2.5 shadow-xs cursor-grab active:cursor-grabbing select-none ${
        overlay ? "shadow-lg rotate-1" : "hover:border-indigo-300 hover:shadow-sm"
      } transition-all`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[10px] text-gray-400 font-mono">#{ticket.numero}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[ticket.prioridade]}`}>
          {PRIORIDADE_LABELS[ticket.prioridade]}
        </span>
      </div>

      <Link
        href={`/tickets/${ticket.id}`}
        className="block text-[11px] font-semibold text-gray-900 hover:text-indigo-600 leading-snug mb-1 break-words line-clamp-2"
        onClick={(e) => e.stopPropagation()}
      >
        {titulo}
      </Link>

      {ticket.descricao && (
        <p className="text-[10px] text-gray-500 leading-snug mb-1.5 line-clamp-2">
          {ticket.descricao}
        </p>
      )}

      {ticket.valorServico > 0 && (
        <p className="text-[11px] font-bold text-emerald-700 mb-1.5">
          {formatBRL(ticket.valorServico)}
        </p>
      )}

      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100">
        <div className="flex items-center gap-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: ticket.cliente.cor }}
          >
            {ticket.cliente.nome[0]}
          </div>
          <span className="text-[10px] text-gray-500 flex-shrink-0">{ticket.localizacao.uf}</span>
          {ticket.agente ? (
            <>
              <span className="text-[10px] text-gray-300 flex-shrink-0">·</span>
              <span className="text-[10px] text-indigo-600 font-medium truncate">{ticket.agente.name}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-300 flex-shrink-0">·</span>
              <span className="text-[10px] text-gray-400 italic">Sem responsável</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          {ticket._count.comentarios > 0 && (
            <span className="flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {ticket._count.comentarios}
            </span>
          )}
          <span>{dias === 0 ? "hoje" : `${dias}d`}</span>
        </div>
      </div>
    </div>
  );
}
