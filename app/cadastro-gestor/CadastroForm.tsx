"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CadastroForm() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    cargo: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        cargo: form.cargo,
        whatsapp: form.whatsapp,
        password: form.password,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      const text = await res.text();
      setError(text || "Não foi possível concluir o cadastro. Tente novamente.");
      return;
    }

    // Conta criada — agora entra com a senha que acabou de definir.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      setError("Cadastro criado, mas não foi possível entrar automaticamente. Vá para a tela de login.");
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="msg msg-error">{error}</div>}

      <div className="field">
        <label htmlFor="name">Nome completo</label>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Seu nome"
        />
      </div>

      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="voce@email.com"
        />
      </div>

      <div className="field">
        <label htmlFor="cargo">Cargo</label>
        <input
          id="cargo"
          type="text"
          value={form.cargo}
          onChange={(e) => update("cargo", e.target.value)}
          placeholder="Ex: Gerente Comercial"
        />
      </div>

      <div className="field">
        <label htmlFor="whatsapp">WhatsApp</label>
        <input
          id="whatsapp"
          type="tel"
          value={form.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="(11) 91234-5678"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Crie sua senha</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="field">
        <label htmlFor="confirmPassword">Confirme a senha</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          placeholder="Repita a senha"
        />
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Criando acesso..." : "Criar acesso e entrar"}
      </button>

      <p style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--ink-faint)", textAlign: "center" }}>
        Já tem cadastro? <a href="/login-gestor" style={{ color: "var(--amber)" }}>Entrar</a>
      </p>
    </form>
  );
}
