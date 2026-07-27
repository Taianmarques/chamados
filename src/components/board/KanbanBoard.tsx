"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay,
  pointerWithin, rectIntersection, type CollisionDetection,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import TicketCard from "./TicketCard";
import MobileTicketCard from "./MobileTicketCard";
import { useBoardStore, PIPELINE_COLUMNS, SETORES, type Ticket } from "@/store/board";

const GRUPO_LABELS: Record<string, string> = {
  chamado: "Chamados",
  orcamento: "Orçamento",
  orc_aprov: "Orçamento Aprovado",
  compras: "Compras",
  corretiva: "Corretiva",
  faturamento: "Faturamento",
  reprovado:  "Reprovado",
  cancelado:  "Cancelado",
};

const GRUPO_BORDER: Record<string, string> = {
  chamado:    "border-blue-200",
  orcamento:  "border-amber-200",
  orc_aprov:  "border-emerald-200",
  compras:    "border-purple-200",
  corretiva:  "border-red-200",
  faturamento:"border-green-200",
  reprovado:  "border-rose-300",
  cancelado:  "border-gray-300",
};

const GRUPO_BG: Record<string, string> = {
  chamado:    "bg-blue-50/40",
  orcamento:  "bg-amber-50/40",
  orc_aprov:  "bg-emerald-50/40",
  compras:    "bg-purple-50/40",
  corretiva:  "bg-red-50/40",
  faturamento:"bg-green-50/40",
  reprovado:  "bg-rose-50/40",
  cancelado:  "bg-gray-50/40",
};

export default function KanbanBoard() {
  const { tickets, setTickets, setLoading, updateTicket, filtroClienteId, filtroUf, filtroPrioridade, filtroSetor, filtroPeriodo, busca } = useBoardStore();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mobileColuna, setMobileColuna] = useState<string>(PIPELINE_COLUMNS[0].id);
  // Guarda o último destino calculado durante o dragOver: o preview ao vivo
  // reflui o layout (cards trocam de lugar), então no instante exato do drop
  // o pointer pode não estar mais sobre nenhum droppable válido (`over` nulo).
  // Nesse caso usamos este último destino conhecido em vez de descartar o drop.
  const lastDestinoRef = useRef<{ status: string; ordem: number } | null>(null);

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
        String(t.numero).includes(q) ||
        t.localizacao.nome.toLowerCase().includes(q)
      )
    : tickets;

  // Prioriza a posição real do cursor; cai para rectIntersection só se o
  // ponteiro estiver momentaneamente fora de qualquer coluna (drag rápido).
  // closestCorners sozinho errava a coluna quando havia grande diferença de
  // altura entre colunas vizinhas (ex.: uma cheia e outra vazia).
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  // Calcula o status e a posição (ordem) de destino ao pairar/soltar sobre uma
  // coluna vazia (vai para o fim) ou sobre um card específico (entra antes dele).
  // Usado tanto no preview ao vivo (dragOver) quanto na persistência final (dragEnd).
  function computeDestino(activeId: string, overId: string) {
    const isColumn = PIPELINE_COLUMNS.some((c) => c.id === overId);
    const targetTicket = !isColumn ? tickets.find((t) => t.id === overId) : null;
    const newStatus = isColumn ? overId : targetTicket?.status;
    if (!newStatus) return null;

    const destino = tickets
      .filter((t) => t.status === newStatus && t.id !== activeId)
      .sort((a, b) => a.ordem - b.ordem);

    let ordem: number;
    if (targetTicket) {
      const idx = destino.findIndex((t) => t.id === targetTicket.id);
      const anterior = destino[idx - 1];
      ordem = anterior ? (anterior.ordem + targetTicket.ordem) / 2 : targetTicket.ordem - 10;
    } else {
      const ultimo = destino[destino.length - 1];
      ordem = ultimo ? ultimo.ordem + 10 : 0;
    }
    return { status: newStatus, ordem };
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTicket(tickets.find((t) => t.id === active.id) ?? null);
    setDragging(true);
    lastDestinoRef.current = null;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || over.id === active.id) return;
    const destino = computeDestino(active.id as string, over.id as string);
    if (!destino) return;
    lastDestinoRef.current = destino;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket && (ticket.status !== destino.status || ticket.ordem !== destino.ordem)) {
      updateTicket(ticket.id, destino);
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    // Guarda o ticket original antes de qualquer preview otimista do
    // handleDragOver, que já reescreve status/ordem no estado local
    // enquanto o card ainda está sendo arrastado.
    const original = activeTicket;
    setActiveTicket(null);
    setDragging(false);
    if (!original) return;

    // O preview ao vivo reflui o layout durante o drag; no instante do drop o
    // pointer pode não estar mais sobre nenhum droppable (`over` nulo ou
    // diferente do esperado). Usamos o último destino válido computado no
    // dragOver como fallback, para nunca perder silenciosamente o resultado.
    const overId = over && over.id !== active.id ? (over.id as string) : null;
    const destino = (overId ? computeDestino(active.id as string, overId) : null) ?? lastDestinoRef.current;
    lastDestinoRef.current = null;
    if (!destino) return;
    if (original.status === destino.status && original.ordem === destino.ordem) return;
    updateTicket(original.id, destino);
    await fetch(`/api/tickets/${original.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(destino),
    });
  }

  // Mobile não usa drag-and-drop (colunas ficam empilhadas, uma por vez): mudar
  // de etapa é feito pelo seletor no próprio card, reaproveitando computeDestino
  // (sempre entra no fim da coluna de destino, como um drop na área vazia dela).
  async function moverTicketMobile(ticket: Ticket, novoStatus: string) {
    const destino = computeDestino(ticket.id, novoStatus);
    if (!destino || destino.status === ticket.status) return;
    updateTicket(ticket.id, destino);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(destino),
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

  // Filtrar colunas pelo setor selecionado (ignorado durante o drag, para permitir soltar em qualquer coluna)
  const colunasVisiveis = filtroSetor && !dragging
    ? PIPELINE_COLUMNS.filter((c) =>
        (SETORES.find((s) => s.id === filtroSetor)?.colunas as readonly string[]).includes(c.id)
      )
    : PIPELINE_COLUMNS;

  // Agrupar colunas
  const grupos = [...new Set(colunasVisiveis.map((c) => c.grupo))];

  // Mobile: uma coluna por vez, selecionada por chips, sem drag-and-drop
  const colunaMobileAtual = colunasVisiveis.find((c) => c.id === mobileColuna) ?? colunasVisiveis[0];
  const ticketsMobile = colunaMobileAtual
    ? ticketsFiltrados.filter((t) => t.status === colunaMobileAtual.id).sort((a, b) => a.ordem - b.ordem)
    : [];

  return (
    <>
      {/* Desktop: board kanban com drag-and-drop */}
      <div className="hidden md:block">
        <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
          onDragCancel={() => {
            // Reverte o preview otimista do dragOver, já que o cancelamento não passa por handleDragEnd
            if (activeTicket) updateTicket(activeTicket.id, { status: activeTicket.status, ordem: activeTicket.ordem });
            lastDestinoRef.current = null;
            setActiveTicket(null);
            setDragging(false);
          }}>

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
                        tickets={ticketsFiltrados.filter((t) => t.status === column.id).sort((a, b) => a.ordem - b.ordem)}
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
      </div>

      {/* Mobile: uma etapa por vez, selecionada por chips, sem drag-and-drop */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {colunasVisiveis.map((c) => {
            const count = ticketsFiltrados.filter((t) => t.status === c.id).length;
            const ativo = c.id === colunaMobileAtual?.id;
            return (
              <button
                key={c.id}
                onClick={() => setMobileColuna(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  ativo ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300"
                }`}
                style={ativo ? { backgroundColor: c.cor } : {}}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ativo ? "rgba(255,255,255,0.7)" : c.cor }}
                />
                {c.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ativo ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pb-6 pt-2">
          {ticketsMobile.map((ticket) => (
            <MobileTicketCard
              key={ticket.id}
              ticket={ticket}
              onMover={(novoStatus) => moverTicketMobile(ticket, novoStatus)}
            />
          ))}
          {ticketsMobile.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400">
              Nenhum chamado nesta etapa
            </div>
          )}
        </div>
      </div>
    </>
  );
}
