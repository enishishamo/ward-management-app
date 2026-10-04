// Records carry stable identities; later edits and deletion markers prevent
// previously previewed future days from reviving completed tasks.
export function stampTasks(previous,next,date,prefix,now=Date.now()) {
 const out={...next};
 for(const [key,value] of Object.entries(next)) {
  const old=previous[key];
  if(JSON.stringify(old)===JSON.stringify(value))continue;
  if(!value.presetId&&!old?.presetId)continue;
  if(!value.presetId&&old?.carryId&&Object.values(next).some(t=>t.presetId&&t.carryId===old.carryId)){out[key]={...value};continue;}
  const id=value.carryId || (old?.presetId ? old.carryId||`${date}:${prefix}:${key}` : `${date}:${prefix}:${key}:${now}`);
  out[key]={...value,carryId:id,modifiedAt:now,deleted:!value.presetId};
 }
 return out;
}
export function carryTasks(db,date,fresh) {
 const current=db[date]||fresh;
 const next={...current,am:{...current.am},pm:{...current.pm},carriedFrom:{...current.carriedFrom}};
 for(const part of ['am','pm']) {
  const latest=new Map();
  for(const d of Object.keys(db).filter(d=>d<=date).sort())for(const [key,task] of Object.entries(db[d][part]||{})){
   if(!task.presetId&&!task.carryId)continue;
   const id=task.carryId||`${d}:${part}:${key}`;
   const time=task.modifiedAt||0,existing=latest.get(id);
   if(!existing||time>=existing.time)latest.set(id,{task,key,id,time,day:d});
  }
  for(const {task,key,id,time,day} of latest.values()) {
   const pid=key.replace(/^(am|pm)\d+_/, '');
   if(!Object.keys(fresh[part]).some(k=>k.endsWith('_'+pid)))continue;
   const own=Object.entries(next[part]).find(([k,t])=>(t.carryId||`${date}:${part}:${k}`)===id);
   if(own){if(time>(own[1].modifiedAt||0))next[part][own[0]]={...task,carryId:id,carriedOn:own[1].carriedOn};continue;}
   if(day===date||task.checked||task.deleted||task.suppressed||!task.presetId||next.carriedFrom[id])continue;
   let i=0;while(next[part][`${part}${i}_${pid}`]?.presetId||next[part][`${part}${i}_${pid}`]?.carryId)i++;
   next[part][`${part}${i}_${pid}`]={...task,carryId:id,carriedOn:date,priority:null};
   next.carriedFrom[id]=true;
  }
 }
 return next;
}
export const taskSlots=(cells,prefix,min)=>Math.max(min,...Object.keys(cells||{}).filter(k=>cells[k].presetId).map(k=>k.match(new RegExp('^'+prefix+'(\\d+)_'))).filter(Boolean).map(m=>Number(m[1])+2));
