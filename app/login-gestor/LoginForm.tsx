"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/app/components/PasswordField";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      <PasswordField
        id="password"
        label="Senha"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--ink-faint)", textAlign: "center" }}>
        Ainda não tem cadastro? <a href="/cadastro-gestor" style={{ color: "var(--amber)" }}>Criar acesso</a>
      </p>
    </form>
  );
}
