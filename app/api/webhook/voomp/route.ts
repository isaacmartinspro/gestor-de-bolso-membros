import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * IMPORTANTE — AJUSTE ANTES DE USAR EM PRODUÇÃO
 * ------------------------------------------------
 * Este arquivo assume um formato de payload comum entre plataformas de
 * checkout (e-mail, status do pedido, nome do plano, id da transação), mas
 * cada campo abaixo precisa ser conferido com a documentação real de
 * webhooks do Voomp (ou com um payload de teste real que o Voomp te mandar).
 * Ajuste os nomes dos campos marcados com "AJUSTE AQUI" para bater com o
 * que o Voomp realmente envia.
 *
 * Autenticação do webhook: como forma simples de garantir que só o Voomp
 * consegue chamar essa rota, exigimos um segredo — configure a mesma string
 * em VOOMP_WEBHOOK_SECRET e na URL do webhook cadastrada no Voomp, assim:
 *   https://SEU-DOMINIO/api/webhook/voomp?secret=SEU_SEGREDO
 * Se o Voomp permitir enviar um header customizado em vez de query param,
 * prefira isso (mais seguro que deixar o segredo na URL/logs).
 */

// Nomes de plano usados no seu produto -> por quanto tempo o acesso fica
// ativo a partir da confirmação/renovação (com alguns dias de folga para
// cobrir atraso de cobrança recorrente).
const PLAN_DURATIONS_DAYS: Record<string, number> = {
  mensal: 35,
  semestral: 190,
  anual: 375,
};

function normalizePlan(rawPlan: string | undefined | null): string {
  const value = (rawPlan || "").toLowerCase();
  if (value.includes("anual") || value.includes("annual")) return "anual";
  if (value.includes("semestr")) return "semestral";
  return "mensal";
}

// Status que devem revogar o acesso imediatamente.
const CANCEL_EVENTS = ["canceled", "cancelled", "refunded", "chargeback", "expired"];
// Status que devem confirmar/renovar o acesso.
const APPROVE_EVENTS = ["approved", "paid", "completed", "renewed", "active"];

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.VOOMP_WEBHOOK_SECRET) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Corpo da requisição inválido", { status: 400 });
  }

  // ---- AJUSTE AQUI: mapeie para os campos reais do payload do Voomp ----
  const email: string | undefined = payload?.buyer?.email ?? payload?.email;
  const eventRaw: string = (payload?.status ?? payload?.event ?? "").toString().toLowerCase();
  const planRaw: string | undefined = payload?.product?.name ?? payload?.plan;
  const transactionId: string | undefined =
    payload?.transaction_id ?? payload?.id ?? payload?.order_id;
  // -----------------------------------------------------------------------

  if (!email) {
    return new NextResponse("E-mail do comprador não encontrado no payload", {
      status: 400,
    });
  }

  const plan = normalizePlan(planRaw);
  const supabase = createAdminClient();

  if (CANCEL_EVENTS.some((e) => eventRaw.includes(e))) {
    await supabase
      .from("subscribers")
      .update({ status: "canceled" })
      .eq("email", email);

    return NextResponse.json({ ok: true, action: "canceled" });
  }

  const isApproval = APPROVE_EVENTS.some((e) => eventRaw.includes(e)) || !eventRaw;
  if (!isApproval) {
    // Evento que não reconhecemos (ex: "pending", "waiting_payment") — só
    // confirmamos o recebimento, sem alterar o acesso.
    return NextResponse.json({ ok: true, action: "ignored", event: eventRaw });
  }

  const durationDays = PLAN_DURATIONS_DAYS[plan] ?? PLAN_DURATIONS_DAYS.mensal;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Cria ou atualiza a linha de assinante e libera o acesso.
  const { error: upsertError } = await supabase
    .from("subscribers")
    .upsert(
      {
        email,
        plan,
        status: "active",
        voomp_transaction_id: transactionId ?? null,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "email" }
    );

  if (upsertError) {
    console.error("Erro ao gravar assinante:", upsertError);
    return new NextResponse("Erro interno ao registrar assinatura", {
      status: 500,
    });
  }

  // Verifica se já existe uma conta de login para esse e-mail. Se não
  // existir, cria e dispara automaticamente o e-mail de "criar senha"
  // (fluxo de convite do Supabase Auth).
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const alreadyHasAccount = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!alreadyHasAccount) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${siteUrl}/set-password` }
    );

    if (inviteError) {
      console.error("Erro ao enviar convite de acesso:", inviteError);
      // Não falha o webhook por causa disso — a assinatura já está ativa
      // no banco; o convite pode ser reenviado manualmente pelo Supabase
      // se necessário.
    }
  }

  return NextResponse.json({ ok: true, action: "activated", plan, expiresAt });
}
