"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // O acesso a este link já é restrito (área de membros do Voomp) —
        // por isso, qualquer e-mail que chegue até aqui pode receber o
        // código. O controle fino de quem continua com acesso ativo fica
        // por conta da área de admin (aba Assinantes).
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (otpError) {
      // Mensagem genérica de propósito — não revela se o e-mail é assinante ou não.
      setError(
        "Não conseguimos enviar o código. Verifique o e-mail e tente novamente em instantes."
      );
      return;
    }

    setInfo(`Enviamos um código de 6 dígitos para ${email}. Confira sua caixa de entrada (e o spam).`);
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError) {
      setLoading(false);
      setError("Código inválido ou expirado. Confira e tente novamente.");
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (otpError) {
      setError("Não conseguimos reenviar o código. Tente novamente em instantes.");
      return;
    }
    setInfo("Novo código enviado. Confira seu e-mail.");
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode}>
        {info && <div className="msg msg-ok">{info}</div>}
        {error && <div className="msg msg-error">{error}</div>}

        <div className="field">
          <label htmlFor="code">Código de 6 dígitos</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            style={{ letterSpacing: "0.4em", textAlign: "center", fontSize: "1.3rem" }}
          />
        </div>

        <button type="submit" className="btn" disabled={loading || code.length < 6}>
          {loading ? "Confirmando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-faint)",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: "0.78rem",
            marginTop: "14px",
            cursor: "pointer",
            textDecoration: "underline",
            width: "100%",
            textAlign: "center",
          }}
        >
          Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode}>
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
        {loading ? "Enviando..." : "Enviar código"}
      </button>
    </form>
  );
}
