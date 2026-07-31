import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { theme, title, difficulty, type, description, prompt } = body;

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("frameworks")
    .update({ theme, title, difficulty, type, description, prompt })
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();
  const { error: dbError } = await supabase.from("frameworks").delete().eq("id", params.id);

  if (dbError) return new NextResponse(dbError.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
