import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("frameworks")
    .select("*")
    .order("theme", { ascending: true })
    .order("title", { ascending: true });

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { theme, title, difficulty, type, description, prompt } = body;

  if (!theme || !title || !difficulty || !type || !description || !prompt) {
    return new NextResponse("Preencha todos os campos do framework", { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("frameworks")
    .insert({ theme, title, difficulty, type, description, prompt })
    .select()
    .single();

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json(data);
}
