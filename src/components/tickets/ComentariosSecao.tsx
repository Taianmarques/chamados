"use client";

import { useState } from "react";

type Comentario = {
  id: string; texto: string; interno: boolean; categoria: string; createdAt: string;
  autor: { id: string; name: string; role: string };
};

interface Props {
  ticketId: string;
  titulo: string;
  categoria: string;
  comentarios: Comentario[];
  isAgente: boolean;
  accordion?: boolean;
  cor?: "indigo" | "amber" | "violet";
  placeholder: string;
  botaoLabel: string;
  emptyLabel: string;
  onNovoComentario: (c: Comentario) => void;
}

const TEMAS = {
  indigo: { avatarBg: "bg-indigo-100", avatarText: "text-indigo-700", ring: "focus:ring-indigo-500", btn: "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400" },
  amber:  { avatarBg: "bg-amber-100",  avatarText: "text-amber-700",  ring: "focus:ring-amber-500",  btn: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400" },
  violet: { avatarBg: "bg-violet-100", avatarText: "text-violet-700", ring: "focus:ring-violet-500", btn: "bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400" },
};

export default function ComentariosSecao({
  ticketId, titulo, categoria, comentarios, isAgente, accordion = false, cor = "indigo",
  placeholder, botaoLabel, emptyLabel, onNovoComentario,
}: Props) {
  const [texto, setTexto] = useState("");
  const [interno, setInterno] = useState(false);
  const [sending, setSending] = useState(false);
  const [aberta, setAberta] = useState(!accordion);
  const tema = TEMAS[cor];

  const visiveis = comentarios.filter((c) => c.categoria === categoria && (!c.interno || isAgente));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${ticketId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, interno, categoria }),
    });
    if (res.ok) {
      onNovoComentario(await res.json());
      setTexto("");
    }
    setSending(false);
  }

  const conteudo = (
    <>
      <div className="space-y-4 mb-6">
        {visiveis.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full ${tema.avatarBg} flex-shrink-0 flex items-center justify-center text-xs font-bold ${tema.avatarText}`}>
              {c.autor.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{c.autor.name}</span>
                {c.interno && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Nota interna</span>
                )}
                <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <div className={`text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 whitespace-pre-wrap ${c.interno ? "border border-yellow-200" : ""}`}>
                {c.texto}
              </div>
            </div>
          </div>
        ))}
        {visiveis.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">{emptyLabel}</p>
        )}
      </div>

      <form onSubmit={enviar} className="space-y-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${tema.ring} resize-none`}
        />
        <div className="flex items-center justify-between">
          {isAgente && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} className="rounded" />
              Nota interna
            </label>
          )}
          <button
            type="submit"
            disabled={sending || !texto.trim()}
            className={`ml-auto px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${tema.btn}`}
          >
            {sending ? "Enviando..." : botaoLabel}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {accordion ? (
        <>
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <h2 className="text-sm font-semibold text-gray-900">{titulo} ({visiveis.length})</h2>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${aberta ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`grid transition-all duration-300 ease-in-out ${aberta ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">{conteudo}</div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{titulo} ({visiveis.length})</h2>
          {conteudo}
        </>
      )}
    </div>
  );
}
