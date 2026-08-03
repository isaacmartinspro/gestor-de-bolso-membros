"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // O link de recuperação de senha do Supabase injeta a sessão temporária
    // no client assim que a página carrega (via hash da URL). Só precisamos
    // confirmar que a sessão existe antes de liberar o formulário.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível salvar a senha. Peça um novo link e tente de novo.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/portal"), 1500);
  }

  if (!ready) {
    return (
      <div className="msg msg-error">
        Este link expirou ou já foi usado. Peça um novo link em
        &quot;Esqueci minha senha&quot; na tela de login.
      </div>
    );
  }

  if (done) {
    return <div className="msg msg-ok">Senha redefinida! Redirecionando para o Gestor de Bolso...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="msg msg-error">{error}</div>}

      <div className="field">
        <label htmlFor="password">Nova senha</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="field">
        <label htmlFor="confirm">Confirme a nova senha</label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repita a senha"
        />
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha e entrar"}
      </button>
    </form>
  );
}
