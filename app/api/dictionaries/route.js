export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      reason: "Supabase env is not configured",
      companies: [],
      clients: [],
      services: [],
      periods: []
    });
  }

  try {
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (companiesError) throw companiesError;

    const company = companies?.[0];

    if (!company) {
      return NextResponse.json({
        ok: false,
        reason: "No company found",
        companies: [],
        clients: [],
        services: [],
        periods: []
      });
    }

    const [
      { data: clients, error: clientsError },
      { data: services, error: servicesError },
      { data: periods, error: periodsError }
    ] = await Promise.all([
      supabase.from("clients").select("*").eq("company_id", company.id).order("name"),
      supabase.from("services").select("*").eq("company_id", company.id).order("name"),
      supabase.from("periods").select("*").eq("company_id", company.id).eq("year", 2026).order("month")
    ]);

    if (clientsError) throw clientsError;
    if (servicesError) throw servicesError;
    if (periodsError) throw periodsError;

    return NextResponse.json({
      ok: true,
      company,
      clients: clients || [],
      services: services || [],
      periods: periods || []
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, reason: error.message || "Failed to load dictionaries" },
      { status: 500 }
    );
  }
}
