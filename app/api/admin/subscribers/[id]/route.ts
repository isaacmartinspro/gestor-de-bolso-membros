import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();

  // Busca o e-mail antes de apagar, para também poder remover a conta de login.
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("email")
    .eq("id", params.id)
    .maybeSingle();

  const { error: dbError } = await supabase.from("subscribers").delete().eq("id", params.id);
  if (dbError) return new NextResponse(dbError.message, { status: 500 });

  // Remove também a conta de login, se existir, para que a pessoa não
  // consiga mais entrar mesmo tendo criado senha antes.
  if (subscriber?.email) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === subscriber.email.toLowerCase()
    );
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id);
    }
  }

  return NextResponse.json({ ok: true });
}
