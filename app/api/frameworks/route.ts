import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const [{ data: themes, error: themesError }, { data: frameworks, error: frameworksError }] =
    await Promise.all([
      supabase.from("themes").select("*").order("sort_order", { ascending: true }),
      supabase.from("frameworks").select("*").order("title", { ascending: true }),
    ]);

  if (themesError || frameworksError) {
    return new NextResponse((themesError || frameworksError)?.message, { status: 500 });
  }

  return NextResponse.json({ themes, frameworks });
}
