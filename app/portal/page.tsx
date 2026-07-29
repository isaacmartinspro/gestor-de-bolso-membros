import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalFrame from "./PortalFrame";

export default async function PortalPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // O middleware já garante que existe uma sessão válida, mas aqui checamos
  // se a assinatura desse e-mail está realmente ativa antes de liberar o
  // conteúdo — é o que impede alguém com login válido mas assinatura
  // cancelada/expirada de continuar acessando.
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status, expires_at")
    .eq("email", user.email)
    .maybeSingle();

  const isExpired =
    subscriber?.expires_at !== null &&
    subscriber?.expires_at !== undefined &&
    new Date(subscriber.expires_at) < new Date();

  const isActive = subscriber?.status === "active" && !isExpired;

  if (!isActive) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="dot" />
            Gestor de Bolso
          </div>
          <h1>Assinatura não ativa</h1>
          <p className="sub">
            Não encontramos uma assinatura ativa para{" "}
            <strong>{user.email}</strong>. Se você acabou de assinar, aguarde
            alguns minutos e atualize a página. Se o problema continuar, fale
            com o suporte.
          </p>
        </div>
      </div>
    );
  }

  return <PortalFrame />;
}
