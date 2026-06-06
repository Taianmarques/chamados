"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import * as XLSX from "xlsx";

interface Props { userName: string; userRole: string; }

interface LinhaPreview {
  linha: number;
  cliente: string;
  uf: string;
  localizacao: string;
  ticket: string;
  ov: string;
  os: string;
  descricao: string;
  contato: string;
  prioridade: string;
  etapa: string;
  valor: string;
}

interface Resultado {
  total: number;
  importados: number;
  erros: { linha: number; motivo: string }[];
  clientesCriados: string[];
  localizacoesCriadas: string[];
}

function col(row: Record<string, string>, ...keys: string[]): string {
  const rowLower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
  for (const k of keys) {
    const v = rowLower[k.toLowerCase().trim()];
    if (v !== undefined && v !== "") return String(v).trim();
  }
  return "";
}

export default function ImportarClient({ userName, userRole }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<LinhaPreview[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);

  // Sincroniza barra de rolagem superior com a tabela
  const syncFromTop = useCallback(() => {
    if (tableScrollRef.current && topScrollRef.current)
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  }, []);

  const syncFromTable = useCallback(() => {
    if (topScrollRef.current && tableScrollRef.current)
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
  }, []);

  // Atualiza largura do espaçador superior quando os dados mudam
  useEffect(() => {
    if (tableScrollRef.current && topInnerRef.current) {
      topInnerRef.current.style.width = tableScrollRef.current.scrollWidth + "px";
    }
  }, [preview]);

  function parseArquivo(file: File) {
    setArquivo(file);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!buffer) return;

      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

      // Captura cabeçalhos originais
      if (rows.length > 0) setCabecalhos(Object.keys(rows[0]));

      const linhas: LinhaPreview[] = rows.slice(0, 100).map((row, i) => ({
        linha: i + 2,
        cliente: col(row, "cliente"),
        uf: col(row, "uf", "estado"),
        localizacao: col(row, "localização", "localizacao", "local", "loja", "unidade"),
        ticket: col(row, "nº ticket", "n° ticket", "num ticket", "numero ticket", "ticket", "chamado", "nº chamado"),
        ov: col(row, "ov", "nº ov", "n° ov", "num ov", "numero ov", "número ov", "nro ov", "ordem de venda", "ordem venda"),
        os: col(row, "os", "nº os", "n° os", "num os", "numero os", "número os", "nro os", "ordem de serviço", "ordem de servico"),
        descricao: col(row, "descrição", "descricao", "description", "obs"),
        contato: col(row, "contato na empresa", "contato", "solicitante"),
        prioridade: col(row, "prioridade"),
        etapa: col(row, "etapa", "status"),
        valor: col(row, "valor (r$)", "valor", "value"),
      }));

      setPreview(linhas);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      alert("Use um arquivo .xlsx, .xls ou .csv");
      return;
    }
    parseArquivo(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function importar() {
    if (!arquivo) return;
    setImportando(true);
    setResultado(null);

    const form = new FormData();
    form.append("file", arquivo);

    const res = await fetch("/api/importar", { method: "POST", body: form });
    const data = await res.json();
    setResultado(data);
    setImportando(false);
  }

  function limpar() {
    setArquivo(null);
    setPreview([]);
    setCabecalhos([]);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar userName={userName} userRole={userRole} />

      <div className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Importar Chamados</h1>
            <p className="text-sm text-gray-500 mt-0.5">Importe chamados existentes a partir de uma planilha Excel ou CSV</p>
          </div>
          <a
            href="/api/importar"
            download
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar template .xlsx
          </a>
        </div>

        {/* Área de upload */}
        {!arquivo && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Arraste a planilha aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-400 mt-1">Suporta .xlsx, .xls e .csv</p>
              </div>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Preview */}
        {arquivo && !resultado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{arquivo.name}</p>
                  <p className="text-xs text-gray-400">{preview.length} linha{preview.length !== 1 ? "s" : ""} encontrada{preview.length !== 1 ? "s" : ""}{preview.length === 100 ? " (mostrando primeiras 100)" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={limpar} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Trocar arquivo
                </button>
                <button
                  onClick={importar}
                  disabled={importando || preview.length === 0}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                >
                  {importando ? "Importando..." : `Importar ${preview.length} chamados`}
                </button>
              </div>
            </div>

            {/* Cabeçalhos detectados */}
            {cabecalhos.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Colunas detectadas na planilha:</p>
                <div className="flex flex-wrap gap-1.5">
                  {cabecalhos.map((h) => {
                    const isOv = ["ov","nº ov","n° ov","num ov","numero ov","número ov","nro ov","ordem de venda"].includes(h.toLowerCase().trim());
                    const isOs = ["os","nº os","n° os","num os","numero os","número os","nro os","ordem de serviço","ordem de servico"].includes(h.toLowerCase().trim());
                    const isTicket = ["nº ticket","n° ticket","ticket","chamado","num ticket"].includes(h.toLowerCase().trim());
                    const isObrig = ["cliente","uf","localização","localizacao","local","loja"].includes(h.toLowerCase().trim());
                    const color = isObrig ? "bg-indigo-100 text-indigo-700" : isOv || isOs || isTicket ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600";
                    return (
                      <span key={h} className={`text-xs px-2 py-0.5 rounded font-mono ${color}`}>{h}</span>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-indigo-100 mr-1" />obrigatórias &nbsp;
                  <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-100 mr-1" />ticket/OV/OS detectados &nbsp;
                  <span className="inline-block w-2.5 h-2.5 rounded bg-gray-100 mr-1" />outros campos
                </p>
              </div>
            )}

            {preview.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Barra de rolagem superior */}
                <div
                  ref={topScrollRef}
                  onScroll={syncFromTop}
                  className="overflow-x-auto border-b border-gray-100"
                  style={{ height: 12 }}
                >
                  <div ref={topInnerRef} style={{ height: 1 }} />
                </div>

                <div ref={tableScrollRef} onScroll={syncFromTable} className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Linha", "Cliente", "UF", "Localização", "Ticket", "OV", "OS", "Contato", "Prioridade", "Etapa", "Valor", "Descrição"].map((h) => (
                          <th key={h} className="text-left px-3 py-2.5 font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.map((r) => (
                        <tr key={r.linha} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 font-mono">{r.linha}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.cliente || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-gray-600">{r.uf || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-700">{r.localizacao || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{r.ticket}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{r.ov}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{r.os}</td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.contato}</td>
                          <td className="px-3 py-2">
                            {r.prioridade && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">{r.prioridade}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate" title={r.etapa}>{r.etapa}</td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.valor}</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[180px] truncate" title={r.descricao}>{r.descricao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className={`border rounded-2xl p-6 ${resultado.erros.length === 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${resultado.erros.length === 0 ? "bg-emerald-500" : "bg-amber-500"}`}>
                  {resultado.erros.length === 0 ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">
                    {resultado.importados === resultado.total
                      ? `Todos os ${resultado.importados} chamados importados com sucesso!`
                      : `${resultado.importados} de ${resultado.total} chamados importados`}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-sm text-emerald-700 font-medium">✓ {resultado.importados} importados</span>
                    {resultado.erros.length > 0 && (
                      <span className="text-sm text-red-600 font-medium">✗ {resultado.erros.length} com erro</span>
                    )}
                    {resultado.clientesCriados.length > 0 && (
                      <span className="text-sm text-indigo-700 font-medium">+ {resultado.clientesCriados.length} cliente{resultado.clientesCriados.length !== 1 ? "s" : ""} criado{resultado.clientesCriados.length !== 1 ? "s" : ""}</span>
                    )}
                    {resultado.localizacoesCriadas.length > 0 && (
                      <span className="text-sm text-purple-700 font-medium">+ {resultado.localizacoesCriadas.length} localização{resultado.localizacoesCriadas.length !== 1 ? "ões" : ""} criada{resultado.localizacoesCriadas.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {(resultado.clientesCriados.length > 0 || resultado.localizacoesCriadas.length > 0) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Novos cadastros criados automaticamente durante a importação.
                    </p>
                  )}
                </div>
                <button
                  onClick={limpar}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Importar outra planilha
                </button>
              </div>
            </div>

            {/* Erros */}
            {resultado.erros.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 bg-red-50">
                  <p className="text-sm font-semibold text-red-700">Linhas com erro ({resultado.erros.length})</p>
                  <p className="text-xs text-red-500 mt-0.5">Corrija os dados na planilha e importe novamente apenas essas linhas</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {resultado.erros.map((e) => (
                    <div key={e.linha} className="flex items-start gap-3 px-5 py-3">
                      <span className="text-xs font-mono text-gray-400 mt-0.5 flex-shrink-0">Linha {e.linha}</span>
                      <span className="text-sm text-red-600">{e.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instruções */}
        {!arquivo && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Como preparar a planilha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Colunas reconhecidas automaticamente:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {[
                    ["Cliente *", "Nome exato do cliente (ex: SMARTFIT)"],
                    ["UF *", "Estado em 2 letras (ex: CE, SP)"],
                    ["Localização *", "Nome da unidade (ex: PITAGUARY)"],
                    ["Nº Ticket", "Número do ticket externo"],
                    ["OV", "Número da ordem de venda"],
                    ["OS", "Número da ordem de serviço"],
                    ["Contato na Empresa", "Nome do solicitante"],
                    ["Descrição", "Descrição do chamado"],
                    ["Prioridade", "BAIXA, MEDIA, ALTA ou CRITICA"],
                    ["Etapa", "Nome da etapa do pipeline"],
                    ["Valor (R$)", "Valor numérico (ex: 1500 ou 1500,00)"],
                  ].map(([col, desc]) => (
                    <li key={col} className="flex gap-2">
                      <span className="font-mono text-indigo-600 flex-shrink-0 text-xs bg-indigo-50 px-1.5 rounded">{col}</span>
                      <span className="text-xs text-gray-500">{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Dicas importantes:</p>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> Baixe o template para ver os clientes e localizações já cadastrados</li>
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> As colunas marcadas com * são obrigatórias</li>
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> O nome do Cliente deve ser idêntico ao cadastrado no sistema</li>
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> A primeira linha deve ser o cabeçalho com os nomes das colunas</li>
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> Você pode usar sua planilha existente — renomeie as colunas para os nomes acima</li>
                  <li className="flex gap-2"><span className="text-indigo-500 flex-shrink-0">•</span> Se a Etapa não for reconhecida, o chamado entra em "Chamado Refrigeração"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
