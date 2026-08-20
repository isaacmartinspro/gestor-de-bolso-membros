import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PortalFrame from "./PortalFrame";

export default async function PortalPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login-gestor");
  }

  // O acesso a este projeto é controlado pelo link secreto de login (a
  // área de membros do Voomp só mostra esse link para quem comprou). Por
  // isso, no primeiro login de um e-mail novo, liberamos o acesso na hora
  // — sem depender do webhook já ter rodado antes. A partir daí, a pessoa
  // aparece na aba "Assinantes" do admin, e o acesso pode ser removido
  // manualmente ali se necessário.
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status, expires_at")
    .eq("email", user.email)
    .maybeSingle();

  if (!subscriber) {
    const adminSupabase = createAdminClient();
    await adminSupabase.from("subscribers").upsert(
      {
        email: user.email,
        plan: "link",
        status: "active",
        expires_at: null,
      },
      { onConflict: "email" }
    );
  } else {
    const isExpired =
      subscriber.expires_at !== null &&
      subscriber.expires_at !== undefined &&
      new Date(subscriber.expires_at) < new Date();

    const isActive = subscriber.status === "active" && !isExpired;

    if (!isActive) {
      return (
        <div className="auth-shell">
          <div className="auth-card">
            <div className="auth-brand">
              <span className="dot" />
              Gestor de Bolso
            </div>
            <h1>Acesso não disponível</h1>
            <p className="sub">
              Não encontramos um acesso ativo para <strong>{user.email}</strong>.
              Se você acabou de assinar, aguarde alguns minutos e tente de
              novo. Se o problema continuar, fale com o suporte.
            </p>
          </div>
        </div>
      );
    }
  }

  return <PortalFrame />;
}
