import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

// Usado no início de toda rota de API da área de admin.
// Retorna { user } se autorizado, ou uma NextResponse de erro para
// a rota devolver imediatamente.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: new NextResponse("Não autorizado", { status: 401 }) };
  }
  if (!isAdminEmail(user.email)) {
    return { error: new NextResponse("Acesso restrito ao administrador", { status: 403 }) };
  }
  return { user };
}
