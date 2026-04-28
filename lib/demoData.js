const months=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const r2=n=>Number(n.toFixed(2));
const series=(a,b=0)=>months.map((_,i)=>r2(a+i*b));
const scale=(x,k)=>x.map(v=>r2(v*k));
const sum=xs=>months.map((_,i)=>r2(xs.reduce((s,a)=>s+(a?.[i]||0),0)));
const annual=x=>x.reduce((s,v)=>s+(v||0),0);
const keys=["revenue","fot","materials","direct","gm","commercial","gmAfterCommercial","office","ebitda","depr","ebit","interest","taxes","ni","addbackDep","ar","ap","adv","cfo","capex","ofcf","loans","principal","owners","ncc","cashBegin","cashEnd","reserve","distributable"];
const base=[
 {name:"МОП",revenue:series(.82,.015),fot:series(-.34,-.006),materials:series(-.08,-.002),commercial:series(-.045,-.001),depr:series(-.015),ar:series(-.05,.002),ap:series(.02,-.0005),adv:series(.015),capex:[-.03,0,-.02,0,-.04,0,0,-.02,0,0,0,-.03]},
 {name:"ПТ",revenue:series(.38,.01),fot:series(-.16,-.004),materials:series(-.07,-.002),commercial:series(-.025,-.001),depr:series(-.012),ar:series(-.035,.0015),ap:series(.015,-.0005),adv:series(.012),capex:[-.02,0,0,0,-.02,0,0,-.01,0,0,0,-.02]},
 {name:"Опиловка",revenue:series(.22,.008),fot:series(-.10,-.003),materials:series(-.04,-.001),commercial:series(-.016,-.0005),depr:series(-.008),ar:series(-.02,.001),ap:series(.01,-.0003),adv:series(.008),capex:[0,0,-.01,0,-.01,0,0,0,0,0,0,-.01]}
];
const shared={office:series(-.17,-.003),interest:series(-.02),taxes:series(-.05,-.001),loans:[0,.2,0,0,0,0,0,0,0,0,0,0],principal:series(-.03),owners:series(-.08,-.004),reserve:series(-.35,-.005),cashBegin:[.35,.55,.83,1.04,1.29,1.45,1.66,1.88,2.02,2.26,2.47,2.70]};
function aggregate(children){const o={}; keys.forEach(k=>o[k]=sum(children.map(c=>c.metrics[k]))); return o}
function makeClient(name,factor){
 const prep=base.map(s=>{const revenue=scale(s.revenue,factor),fot=scale(s.fot,factor),materials=scale(s.materials,factor),commercial=scale(s.commercial,factor),depr=scale(s.depr,factor),ar=scale(s.ar,factor),ap=scale(s.ap,factor),adv=scale(s.adv,factor),capex=scale(s.capex,factor); const direct=sum([fot,materials]),gm=sum([revenue,direct]),gmAfterCommercial=sum([gm,commercial]); return {name:s.name,prelim:{revenue,fot,materials,commercial,depr,ar,ap,adv,capex,direct,gm,gmAfterCommercial}}});
 const tot=prep.reduce((a,s)=>a+annual(s.prelim.revenue),0);
 const services=prep.map(s=>{const sh=tot?annual(s.prelim.revenue)/tot:0; const office=scale(shared.office,factor*sh),interest=scale(shared.interest,factor*sh),taxes=scale(shared.taxes,factor*sh),loans=scale(shared.loans,factor*sh),principal=scale(shared.principal,factor*sh),owners=scale(shared.owners,factor*sh),reserve=scale(shared.reserve,factor*sh),cashBegin=scale(shared.cashBegin,factor*sh); const {revenue,fot,materials,commercial,depr,ar,ap,adv,capex,direct,gm,gmAfterCommercial}=s.prelim; const ebitda=sum([gmAfterCommercial,office]),ebit=sum([ebitda,depr]),ni=sum([ebit,interest,taxes]),addbackDep=scale(depr,-1),cfo=sum([ni,addbackDep,ar,ap,adv]),ofcf=sum([cfo,capex]),ncc=sum([ofcf,loans,principal,owners]),cashEnd=sum([cashBegin,ncc]),distributable=sum([cashEnd,reserve]); return {name:s.name,childLabels:[],metrics:{revenue,fot,materials,direct,gm,commercial,gmAfterCommercial,office,ebitda,depr,ebit,interest,taxes,ni,addbackDep,ar,ap,adv,cfo,capex,ofcf,loans,principal,owners,ncc,cashBegin,cashEnd,reserve,distributable}}});
 return {name,services,childLabels:services.map(s=>s.name),metrics:aggregate(services)};
}
export function getDemoModel(){const clients=[makeClient("РЭМП",1),makeClient("Радомир",.82),makeClient("Сити-Сервис",1.12)]; const business={name:"Весь бизнес",childLabels:clients.map(c=>c.name),clients,metrics:aggregate(clients)}; return {source:"demo",months,clients,business}}
