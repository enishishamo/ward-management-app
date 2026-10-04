import {parseDate,occurrenceDone} from './dates.js';
export const abxCumDay = (po, currentAbx, todayDateStr) => {
  if (!currentAbx || currentAbx.type !== "abx" || !currentAbx.startDate) return null;
  const td = parseDate(todayDateStr), curS = parseDate(currentAbx.startDate), curE = parseDate(currentAbx.endDate || currentAbx.startDate);
  if (!td || !curS || td < curS || td > curE) return null;
  // Find earliest startDate by walking backwards through chain of overlapping/contiguous abx orders
  const allAbx = (po||[]).filter(o => o.type === "abx" && o.startDate && o.endDate)
    .map(o => ({s: parseDate(o.startDate), e: parseDate(o.endDate)})).filter(x => x.s && x.e);
  let earliest = curS;
  let changed = true;
  while (changed) {
    changed = false;
    for (const ab of allAbx) {
      // If this order ends on or after (earliest - 1 day) and starts before earliest -> extend back
      const gapDays = Math.round((earliest - ab.e) / 86400000);
      if (ab.s < earliest && gapDays <= 1) { earliest = ab.s; changed = true; }
    }
  }
  return Math.round((td - earliest) / 86400000) + 1;
};
export const categoryOrder=['abx','drip_main','med','lab','culture','img','meeting','consult','family_call','rehab_call','msw_call'];
export const categoryRank=t=>{const i=categoryOrder.indexOf(t);return i<0?categoryOrder.length:i;};
export const sortSchedule=items=>[...items].sort((a,b)=>categoryRank(a.type)-categoryRank(b.type));
export const pendingOccurrences=(o,date)=>['culture','img'].includes(o.type)?(o.dates||[]).filter(d=>d<=date&&!occurrenceDone(o,d)).sort():[];
export const elapsedDay=(start,end)=>{const a=parseDate(start),b=parseDate(end);return a&&b?Math.round((b-a)/86400000)+1:null;};

export const scheduleCategories=[
 {type:'abx',icon:'🦠',label:'抗菌薬'},
 {type:'drip_main',icon:'💉',label:'メイン点滴'},
 {type:'med',icon:'💊',label:'内服'},
 {type:'lab',icon:'🩸',label:'検査'},
 {type:'culture',icon:'🧫',label:'培養'},
 {type:'img',icon:'📷',label:'画像'},
 {type:'meeting',icon:'👥',label:'面談'},
 {type:'consult',icon:'📨',label:'他科依頼'},
 {type:'family_call',icon:'📞',label:'家族連絡'},
 {type:'rehab_call',icon:'🏃',label:'リハ連絡'},
 {type:'msw_call',icon:'👩‍⚕️',label:'MSW連絡'}
];
export function groupSchedule(orders,categories=[]) {
 const known=new Map(scheduleCategories.map(c=>[c.type,c]));
 for(const c of categories) if(!known.has(c.type)) known.set(c.type,c);
 for(const o of orders) if(!known.has(o.type)) known.set(o.type,{type:o.type,icon:'📌',label:o.type});
 const always=['abx','drip_main','med','lab','family_call'];
 return sortSchedule([...known.values()]).map(c=>({...c,items:orders.filter(o=>o.type===c.type)})).filter(c=>c.items.length||always.includes(c.type));
}

export function changeScheduleDate(order,date,range=false) {
 if(!parseDate(date))return order;
 if(range){
  if(!parseDate(order.startDate))return {...order,startDate:date,endDate:date};
  return date<order.startDate?{...order,startDate:date,endDate:order.endDate||order.startDate}:{...order,endDate:date};
 }
 const dates=order.dates||[];
 if(dates.includes(date)){const confirmations={...order.confirmations};delete confirmations[date];return {...order,dates:dates.filter(d=>d!==date),confirmations};}
 return {...order,dates:[...dates,date].sort()};
}

export function imageCellStatus(order,date,today) {
 if(order.type!=='img'||!(order.dates||[]).includes(date))return '';
 if(occurrenceDone(order,date))return 'confirmed';
 return date<=today?'pending':'planned';
}
