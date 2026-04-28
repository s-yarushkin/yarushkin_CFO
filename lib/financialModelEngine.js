import { getDemoModel } from "@/lib/demoData";
export const metricKeys=["revenue","fot","materials","direct","gm","commercial","gmAfterCommercial","office","ebitda","depr","ebit","interest","taxes","ni","addbackDep","ar","ap","adv","cfo","capex","ofcf","loans","principal","owners","ncc","cashBegin","cashEnd","reserve","distributable"];
const map={revenue:"revenue",fot:"fot",materials:"materials",commercial_cost:"commercial",office_cost:"office",depreciation:"depr",interest:"interest",tax:"taxes",ar_change:"ar",ap_change:"ap",advance_received_change:"adv",capex:"capex",loan_received:"loans",loan_principal_repayment:"principal",owner_withdrawal:"owners",cash_begin:"cashBegin",minimum_cash_reserve:"reserve"};
const r2=n=>Number(n.toFixed(2)); const empty=()=>Array(12).fill(0); const sum=xs=>Array.from({length:12},(_,i)=>r2(xs.reduce((s,a)=>s+(a?.[i]||0),0))); const scale=(x,k)=>x.map(v=>r2(v*k)); const annual=x=>x.reduce((s,v)=>s+(v||0),0);
function emptyMetrics(){const o={}; metricKeys.forEach(k=>o[k]=empty()); return o}
function aggregate(children){const o={}; metricKeys.forEach(k=>o[k]=sum(children.map(c=>c.metrics[k]))); return o}
function derive(m){m.direct=sum([m.fot,m.materials]);m.gm=sum([m.revenue,m.direct]);m.gmAfterCommercial=sum([m.gm,m.commercial]);m.ebitda=sum([m.gmAfterCommercial,m.office]);m.ebit=sum([m.ebitda,m.depr]);m.ni=sum([m.ebit,m.interest,m.taxes]);m.addbackDep=scale(m.depr,-1);m.cfo=sum([m.ni,m.addbackDep,m.ar,m.ap,m.adv]);m.ofcf=sum([m.cfo,m.capex]);m.ncc=sum([m.ofcf,m.loans,m.principal,m.owners]);m.cashEnd=sum([m.cashBegin,m.ncc]);m.distributable=sum([m.cashEnd,m.reserve]);return m}
export function buildModelFromSupabaseRows({clients=[],services=[],periods=[],records=[]}){
 const pById=new Map(periods.map(p=>[p.id,p])); const cById=new Map(clients.map(c=>[c.id,c])); const models=new Map();
 services.forEach(s=>{const c=cById.get(s.client_id); if(c) models.set(s.id,{id:s.id,name:s.name,clientId:c.id,clientName:c.name,childLabels:[],metrics:emptyMetrics()})});
 clients.forEach(c=>models.set(`client-direct-${c.id}`,{id:`client-direct-${c.id}`,name:"Без услуги",clientId:c.id,clientName:c.name,childLabels:[],metrics:emptyMetrics()}));
 records.forEach(rec=>{const k=map[rec.record_type]; if(!k)return; const p=pById.get(rec.period_id); const idx=Math.max(0,Math.min(11,(p?.month||1)-1)); const sid=rec.service_id || (rec.client_id?`client-direct-${rec.client_id}`:null); const sm=models.get(sid); if(!sm)return; sm.metrics[k][idx]=r2(sm.metrics[k][idx]+Number(rec.amount||0)/1000000)});
 const serviceModels=Array.from(models.values()).map(s=>({...s,metrics:derive(s.metrics)})).filter(s=>Math.abs(annual(s.metrics.revenue))+Math.abs(annual(s.metrics.fot))+Math.abs(annual(s.metrics.office))>0);
 const clientModels=clients.map(c=>{const child=serviceModels.filter(s=>s.clientId===c.id); return {id:c.id,name:c.name,services:child,childLabels:child.map(s=>s.name),metrics:aggregate(child)}}).filter(c=>c.services.length>0);
 const business={name:"Весь бизнес",clients:clientModels,childLabels:clientModels.map(c=>c.name),metrics:aggregate(clientModels)};
 return {source:"supabase",months:["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],clients:clientModels,business};
}
export function getFallbackModel(reason="Supabase not configured"){const m=getDemoModel(); return {...m,source:"demo",fallbackReason:reason}}
