"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setLoading(false);

    // Mostra a mesma mensagem de sucesso mesmo se o e-mail não existir —
    // evita revelar quais e-mails têm conta cadastrada.
    if (resetError) {
      setError("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="msg msg-ok">
        Se esse e-mail estiver cadastrado, você vai receber um link para
        redefinir sua senha. Confira também a caixa de spam.
      </div>
    );
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

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </button>

      <Link href="/login" className="field-link field-link-center">
        Voltar para o login
      </Link>
    </form>
  );
}
