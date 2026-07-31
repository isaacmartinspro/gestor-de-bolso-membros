import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createAdminClient();

  const { data: subscribers, error: dbError } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) return new NextResponse(dbError.message, { status: 500 });

  // Junta com os dados de login (auth.users) para trazer o último acesso.
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const merged = (subscribers || []).map((s) => {
    const authUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === s.email.toLowerCase()
    );
    return {
      ...s,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      has_account: !!authUser,
    };
  });

  return NextResponse.json(merged);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { email, name, plan, expiresInDays } = body;

  if (!email) {
    return new NextResponse("Informe o e-mail do assinante", { status: 400 });
  }

  const supabase = createAdminClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number(expiresInDays) || 365));

  const { data: subscriber, error: dbError } = await supabase
    .from("subscribers")
    .upsert(
      {
        email,
        name: name || null,
        plan: plan || "anual",
        status: "active",
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (dbError) return new NextResponse(dbError.message, { status: 500 });

  // Se ainda não existe conta de login para esse e-mail, convida.
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const alreadyHasAccount = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!alreadyHasAccount) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/set-password`,
    });
  }

  return NextResponse.json(subscriber);
}
