export const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function parseDate(s,legacyYear=2026) {
 if(typeof s!=='string')return null;
 const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s),md=/^(\d{1,2})\/(\d{1,2})$/.exec(s);
 if(!iso&&!md)return null;
 const [y,m,d]=iso?[+iso[1],+iso[2],+iso[3]]:[legacyYear,+md[1],+md[2]];
 const date=new Date(y,m-1,d);
 return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
}
export const shortDate=s=>{const d=s instanceof Date?s:parseDate(s);return d?`${d.getMonth()+1}/${d.getDate()}`:s||'';};
const dateFields=new Set(['admitDate','startDate','endDate','resultDate','lastFamilyCall','dischargeDate','plannedDischargeDate','plannedFollowUp','followUp']);
export function migrateDates(value,key='') {
 if(typeof value==='string'&&(dateFields.has(key)||key==='dates')){const d=parseDate(value);return d?dateKey(d):value;}
 if(Array.isArray(value))return value.map(v=>migrateDates(v,key));
 if(value&&typeof value==='object') {
  const next=Object.fromEntries(Object.entries(value).map(([k,v])=>[/^\d{1,2}\/\d{1,2}$/.test(k)&&parseDate(k)?dateKey(parseDate(k)):k,migrateDates(v,k)]));
  if(next.type==='img'&&next.reportConfirmed&&!next.confirmations) {next.confirmations=Object.fromEntries((next.dates||[]).map(d=>[d,true]));delete next.reportConfirmed;}
  if(next.type?.startsWith('culture')&&next.resultDate&&!next.confirmations) {next.confirmations=Object.fromEntries((next.dates||[]).filter(d=>d<=next.resultDate).map(d=>[d,true]));next.legacyResultDate=next.resultDate;delete next.resultDate;}
  if(next.type?.startsWith('culture_')){next.specimen=next.specimen||({culture_blood:'血液',culture_urine:'尿',culture_sputum:'痰'}[next.type]||'');next.type='culture';}
  return next;
 }
 return value;
}
export function occurrenceDone(order,date) { return !!order.confirmations?.[date]; }
