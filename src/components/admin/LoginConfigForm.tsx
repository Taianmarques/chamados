"use client";

import { useState, useEffect } from "react";

interface LoginConfig {
  id: string;
  logoUrl: string;
  titulo: string;
  descricao: string;
  corPrimaria: string;
}

export default function LoginConfigForm() {
  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch("/api/config/login");
      const data = await response.json();
      setConfig(data);
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      setMessage("Erro ao carregar configurações");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (máx 1MB)
    if (file.size > 1024 * 1024) {
      setMessage("Arquivo muito grande. Máximo 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      
      // Validar tamanho do base64 (máx 500KB de string)
      if (base64.length > 500 * 1024) {
        setMessage("Imagem comprimida é muito grande. Tente uma imagem menor ou de melhor compressão.");
        return;
      }
      
      setLogoPreview(base64);
      if (config) {
        setConfig({ ...config, logoUrl: base64 });
      }
      setMessage(""); // Limpar mensagem de erro anterior
    };
    reader.onerror = () => {
      setMessage("Erro ao carregar imagem");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/config/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: config.logoUrl,
          titulo: config.titulo,
          descricao: config.descricao,
          corPrimaria: config.corPrimaria,
        }),
      });

      if (response.ok) {
        setMessage("✓ Configurações salvas com sucesso!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(errorData.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setMessage("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  }

  if (!config) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Configurações da Página de Login</h2>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 p-2"
            />
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max 1MB)</p>
          </div>
          {logoPreview && (
            <div className="flex items-center justify-center w-20 h-20 rounded-lg bg-gray-50 border border-gray-200">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          type="text"
          value={config.titulo}
          onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
          placeholder="Ex: Sistema de Chamados"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          value={config.descricao}
          onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
          placeholder="Ex: Acesso interno"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Cor Primária */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
        <div className="flex gap-3">
          <input
            type="color"
            value={config.corPrimaria}
            onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={config.corPrimaria}
            onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
            placeholder="#6366f1"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Pré-visualização</p>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 rounded">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8 text-center">
              {logoPreview && (
                <div className="mb-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="inline-block w-12 h-12 rounded-xl object-contain"
                  />
                </div>
              )}
              {!logoPreview && (
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-xl font-bold mb-4"
                  style={{ backgroundColor: config.corPrimaria }}
                >
                  S
                </div>
              )}
              <h1 className="text-xl font-semibold text-gray-900">{config.titulo}</h1>
              <p className="text-sm text-gray-500 mt-1">{config.descricao}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith("✓")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? "Salvando..." : "Salvar Configurações"}
      </button>
    </form>
  );
}
