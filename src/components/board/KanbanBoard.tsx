"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import TicketCard from "./TicketCard";
import { useBoardStore, PIPELINE_COLUMNS, SETORES, type Ticket } from "@/store/board";

const GRUPO_LABELS: Record<string, string> = {
  chamado: "Chamados",
  orcamento: "Orçamento",
  orc_aprov: "Orçamento Aprovado",
  compras: "Compras",
  corretiva: "Corretiva",
  faturamento: "Faturamento",
};

const GRUPO_BORDER: Record<string, string> = {
  chamado:    "border-blue-200",
  orcamento:  "border-amber-200",
  orc_aprov:  "border-emerald-200",
  compras:    "border-purple-200",
  corretiva:  "border-red-200",
  faturamento:"border-green-200",
};

const GRUPO_BG: Record<string, string> = {
  chamado:    "bg-blue-50/40",
  orcamento:  "bg-amber-50/40",
  orc_aprov:  "bg-emerald-50/40",
  compras:    "bg-purple-50/40",
  corretiva:  "bg-red-50/40",
  faturamento:"bg-green-50/40",
};

export default function KanbanBoard() {
  const { tickets, setTickets, setLoading, updateTicket, filtroClienteId, filtroUf, filtroPrioridade, filtroSetor, filtroPeriodo, busca } = useBoardStore();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroClienteId) params.set("clienteId", filtroClienteId);
    if (filtroUf) params.set("uf", filtroUf);
    if (filtroPrioridade) params.set("prioridade", filtroPrioridade);
    if (filtroPeriodo) params.set("periodo", filtroPeriodo);

    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then((data) => setTickets(data))
      .finally(() => setLoading(false));
  }, [setTickets, setLoading, filtroClienteId, filtroUf, filtroPrioridade, filtroPeriodo]);

  // Busca client-side por ticket, OV, OS
  const q = busca.trim().toLowerCase();
  const ticketsFiltrados = q
    ? tickets.filter((t) =>
        t.ticketExterno.toLowerCase().includes(q) ||
        t.ovNumero.toLowerCase().includes(q) ||
        t.osNumero.toLowerCase().includes(q) ||
        String(t.numero).includes(q)
      )
    : tickets;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTicket(tickets.find((t) => t.id === active.id) ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const overId = over.id as string;
    const isColumn = PIPELINE_COLUMNS.some((c) => c.id === overId);
    if (!isColumn) return;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket && ticket.status !== overId) {
      updateTicket(ticket.id, { status: overId });
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTicket(null);
    if (!over) return;
    const overId = over.id as string;
    const isColumn = PIPELINE_COLUMNS.some((c) => c.id === overId);
    const targetTicket = tickets.find((t) => t.id === overId);
    const newStatus = isColumn ? overId : (targetTicket?.status ?? null);
    if (!newStatus) return;
    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket || ticket.status === newStatus) return;
    updateTicket(ticket.id, { status: newStatus });
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const topScrollRef = useRef<HTMLDivElement>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);

  const syncFromTop = useCallback(() => {
    if (boardScrollRef.current && topScrollRef.current)
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  }, []);

  const syncFromBoard = useCallback(() => {
    if (topScrollRef.current && boardScrollRef.current)
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
  }, []);

  useEffect(() => {
    const update = () => {
      if (boardScrollRef.current && topInnerRef.current)
        topInnerRef.current.style.width = boardScrollRef.current.scrollWidth + "px";
    };
    update();
    const ro = new ResizeObserver(update);
    if (boardScrollRef.current) ro.observe(boardScrollRef.current);
    return () => ro.disconnect();
  }, [tickets, filtroSetor]);

  // Filtrar colunas pelo setor selecionado
  const colunasVisiveis = filtroSetor
    ? PIPELINE_COLUMNS.filter((c) =>
        (SETORES.find((s) => s.id === filtroSetor)?.colunas as readonly string[]).includes(c.id)
      )
    : PIPELINE_COLUMNS;

  // Agrupar colunas
  const grupos = [...new Set(colunasVisiveis.map((c) => c.grupo))];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>

      {/* Barra de rolagem superior */}
      <div
        ref={topScrollRef}
        onScroll={syncFromTop}
        className="overflow-x-auto mb-1"
        style={{ height: 14 }}
      >
        <div ref={topInnerRef} style={{ height: 1 }} />
      </div>

      <div ref={boardScrollRef} onScroll={syncFromBoard} className="flex gap-3 overflow-x-auto pb-6 px-1">
        {grupos.map((grupo) => {
          const cols = colunasVisiveis.filter((c) => c.grupo === grupo);
          return (
            <div key={grupo} className={`flex gap-2 p-2 rounded-2xl border ${GRUPO_BG[grupo]} ${GRUPO_BORDER[grupo]}`}>
              <div className="flex gap-2">
                {/* Grupo label vertical */}
                <div className="flex items-start pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 writing-mode-vertical"
                    style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>
                    {GRUPO_LABELS[grupo]}
                  </span>
                </div>
                {/* Colunas do grupo */}
                {cols.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tickets={ticketsFiltrados.filter((t) => t.status === column.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
