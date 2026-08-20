import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login-gestor");
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="dot" />
            Gestor de Bolso
          </div>
          <h1>Acesso restrito</h1>
          <p className="sub">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard adminEmail={user.email!} />;
}
