export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { buildModelFromSupabaseRows, getFallbackModel } from "@/lib/financialModelEngine";
export async function GET(request){
 const {searchParams}=new URL(request.url); const year=Number(searchParams.get("year")||"2026"); const scenarioMode=searchParams.get("mode")||"fact_forecast"; const supabase=createServerSupabaseClient();
 if(!supabase) return NextResponse.json({ok:true,source:"demo",reason:"Supabase env is not configured",model:getFallbackModel("Supabase env is not configured")});
 try{
  const {data:companies,error:ce}=await supabase.from("companies").select("*").order("created_at",{ascending:true}).limit(1); if(ce)throw ce; const company=companies?.[0];
  if(!company) return NextResponse.json({ok:true,source:"demo",reason:"No company found",model:getFallbackModel("No company found")});
  const [cl,sv,pe]=await Promise.all([
   supabase.from("clients").select("*").eq("company_id",company.id).eq("status","active").order("name"),
   supabase.from("services").select("*").eq("company_id",company.id).eq("status","active").order("name"),
   supabase.from("periods").select("*").eq("company_id",company.id).eq("year",year).order("month")
  ]);
  if(cl.error)throw cl.error; if(sv.error)throw sv.error; if(pe.error)throw pe.error; const periodIds=(pe.data||[]).map(p=>p.id);
  if(!periodIds.length)return NextResponse.json({ok:true,source:"demo",reason:`No periods for ${year}`,model:getFallbackModel(`No periods for ${year}`)});
  const scenarios=scenarioMode==="fact"?["fact"]:["fact","plan","forecast"];
  const {data:records,error:re}=await supabase.from("financial_records").select("*").eq("company_id",company.id).in("period_id",periodIds).in("scenario",scenarios); if(re)throw re;
  return NextResponse.json({ok:true,source:"supabase",company,model:buildModelFromSupabaseRows({clients:cl.data||[],services:sv.data||[],periods:pe.data||[],records:records||[]})});
 }catch(e){return NextResponse.json({ok:true,source:"demo",reason:e.message||"Supabase read error",model:getFallbackModel(e.message||"Supabase read error")})}
}
