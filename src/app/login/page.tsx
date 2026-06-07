"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginConfig {
  logoUrl: string;
  titulo: string;
  descricao: string;
  corPrimaria: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<LoginConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch("/api/config/login");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      setConfig({
        logoUrl: "",
        titulo: "Sistema de Chamados",
        descricao: "Acesso interno",
        corPrimaria: "#6366f1",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha inválidos.");
    } else {
      router.push("/board");
      router.refresh();
    }
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo"
              className="inline-block w-12 h-12 mb-4 rounded-xl object-contain"
            />
          ) : (
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="seu@email.com"
              style={{
                focusRingColor: config.corPrimaria,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="••••••••"
              style={{
                focusRingColor: config.corPrimaria,
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: config.corPrimaria,
            }}
            onMouseEnter={(e) => {
              const element = e.currentTarget as HTMLButtonElement;
              element.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              const element = e.currentTarget as HTMLButtonElement;
              element.style.filter = "brightness(1)";
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
