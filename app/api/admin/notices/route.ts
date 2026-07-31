import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { message } = body;

  if (!message) {
    return new NextResponse("Escreva o texto do aviso", { status: 400 });
  }

  const supabase = createAdminClient();

  // Desativa qualquer aviso ativo anterior, depois cria o novo já ativo.
  await supabase.from("notices").update({ active: false }).eq("active", true);

  const { data, error: dbError } = await supabase
    .from("notices")
    .insert({ message, active: true })
    .select()
    .single();

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();
  const { error: dbError } = await supabase.from("notices").update({ active: false }).eq("active", true);

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
