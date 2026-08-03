"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      // Mensagem genérica de propósito — não revela se o e-mail existe ou não.
      setError("E-mail ou senha inválidos. Verifique e tente novamente.");
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="msg msg-error">{error}</div>}

      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Senha</label>
        <div className="field-input-wrap">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="field-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <Link href="/forgot-password" className="field-link">
          Esqueci minha senha
        </Link>
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
