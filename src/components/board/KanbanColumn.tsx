"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TicketCard from "./TicketCard";
import type { Ticket } from "@/store/board";
import { formatBRL } from "@/store/board";

interface Column {
  id: string;
  label: string;
  cor: string;
  grupo: string;
}

interface Props {
  column: Column;
  tickets: Ticket[];
}

export default function KanbanColumn({ column, tickets }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const totalValor = tickets.reduce((s, t) => s + (t.valorServico ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[240px] max-w-[240px]">
      {/* Header */}
      <div className="mb-2 px-1">
        <div className="flex items-start gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: column.cor }} />
          <span className="text-xs font-semibold text-gray-700 leading-tight">{column.label}</span>
        </div>
        <div className="flex items-center gap-2 ml-3.5">
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {tickets.length}
          </span>
          {totalValor > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {formatBRL(totalValor)}
            </span>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl p-2 space-y-2 transition-colors ${
          isOver ? "bg-indigo-50 ring-2 ring-indigo-200" : "bg-gray-100/60"
        }`}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-gray-400">
            Nenhum chamado
          </div>
        )}
      </div>
    </div>
  );
}
