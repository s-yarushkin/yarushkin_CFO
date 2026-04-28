export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function getCompany(supabase) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function getPeriod(supabase, companyId, year, month) {
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function POST(request) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "Supabase env is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();

    const year = Number(body.year || 2026);
    const month = Number(body.month);
    const scenario = String(body.scenario || "fact");
    const clientId = body.client_id || null;
    const serviceId = body.service_id || null;
    const recordType = String(body.record_type || "");
    const rawAmount = String(body.amount || "").replace(",", ".").replace(/\s/g, "");
    const amount = Number(rawAmount);
    const comment = body.comment ? String(body.comment).trim() : null;

    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, reason: "Месяц обязателен" }, { status: 400 });
    }

    if (!["fact", "plan", "forecast"].includes(scenario)) {
      return NextResponse.json({ ok: false, reason: "Некорректный сценарий" }, { status: 400 });
    }

    if (!recordType) {
      return NextResponse.json({ ok: false, reason: "Тип показателя обязателен" }, { status: 400 });
    }

    if (!Number.isFinite(amount)) {
      return NextResponse.json({ ok: false, reason: "Сумма должна быть числом" }, { status: 400 });
    }

    const company = await getCompany(supabase);
    if (!company) {
      return NextResponse.json({ ok: false, reason: "Компания не найдена. Сначала выполните seed." }, { status: 400 });
    }

    const period = await getPeriod(supabase, company.id, year, month);
    if (!period) {
      return NextResponse.json({ ok: false, reason: `Период ${month}.${year} не найден` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("financial_records")
      .insert({
        company_id: company.id,
        period_id: period.id,
        client_id: clientId,
        service_id: serviceId,
        scenario,
        record_type: recordType,
        amount,
        comment
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, record: data });
  } catch (error) {
    return NextResponse.json({ ok: false, reason: error.message || "Failed to create record" }, { status: 500 });
  }
}
