import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Esta rota fica pública de propósito: o acesso a ela é protegido pelo
// fato de o link /cadastro-gestor só ser divulgado dentro da área de
// membros do Voomp (só quem comprou chega até aqui). Por isso, qualquer
// cadastro feito aqui já libera acesso na hora — o admin pode remover o
// acesso de alguém depois, pela aba Assinantes, se precisar.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, cargo, whatsapp, password } = body;

  if (!email || !password) {
    return new NextResponse("Preencha e-mail e senha", { status: 400 });
  }
  if (String(password).length < 8) {
    return new NextResponse("A senha precisa ter pelo menos 8 caracteres", { status: 400 });
  }

  const supabase = createAdminClient();

  // Verifica se já existe uma conta com esse e-mail — pode ter sido criada
  // antes por outro caminho (ex: teste anterior, ou o webhook do Voomp).
  // Nesse caso, só definimos a senha nessa conta em vez de dar erro.
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Erro ao consultar contas existentes:", listError);
    return new NextResponse("Não foi possível criar o acesso. Tente novamente.", { status: 500 });
  }

  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === String(email).toLowerCase()
  );

  let userId: string | undefined;

  if (existing) {
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { password, email_confirm: true, user_metadata: { name, cargo, whatsapp } }
    );
    if (updateError) {
      console.error("Erro ao definir senha na conta existente:", updateError);
      return new NextResponse("Não foi possível criar o acesso. Tente novamente.", { status: 500 });
    }
    userId = updated.user?.id;
  } else {
    // Cria a conta já confirmada — sem precisar de e-mail de verificação.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, cargo, whatsapp },
    });
    if (createError) {
      console.error("Erro ao criar conta:", createError);
      return new NextResponse("Não foi possível criar o acesso. Tente novamente.", { status: 500 });
    }
    userId = created.user?.id;
  }

  const { error: subscriberError } = await supabase.from("subscribers").upsert(
    {
      email,
      name: name || null,
      cargo: cargo || null,
      whatsapp: whatsapp || null,
      plan: "cadastro",
      status: "active",
      expires_at: null,
    },
    { onConflict: "email" }
  );

  if (subscriberError) {
    console.error("Erro ao registrar assinante:", subscriberError);
    // A conta de login já foi criada; não falha o cadastro por causa disso.
  }

  return NextResponse.json({ ok: true, userId });
}
