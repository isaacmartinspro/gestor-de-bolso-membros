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
    .select("name, email")
    .eq("email", user.email)
    .maybeSingle();

  return NextResponse.json({
    name: subscriber?.name ?? null,
    email: user.email,
  });
}
