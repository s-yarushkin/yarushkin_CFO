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

export async function POST(request) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "Supabase env is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, reason: "Название клиента обязательно" }, { status: 400 });
    }

    const company = await getCompany(supabase);
    if (!company) {
      return NextResponse.json({ ok: false, reason: "Компания не найдена. Сначала выполните seed." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_id: company.id,
        name,
        status: "active"
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, client: data });
  } catch (error) {
    return NextResponse.json({ ok: false, reason: error.message || "Failed to create client" }, { status: 500 });
  }
}
