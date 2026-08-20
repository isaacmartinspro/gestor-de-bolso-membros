import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Esta rota está protegida pelo middleware.ts (matcher inclui /api/portal-content).
// Fazemos uma segunda checagem aqui, incluindo o status da assinatura, para
// que o conteúdo nunca seja servido para quem não tem assinatura ativa —
// mesmo que a pessoa chame essa URL diretamente.
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

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
    return new NextResponse("Assinatura não ativa", { status: 403 });
  }

  // Arquivo fora de /public — não é servido diretamente, só através desta
  // rota autenticada.
  const filePath = path.join(process.cwd(), "private", "gestor-de-bolso-content.html");
  const html = await readFile(filePath, "utf-8");

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
