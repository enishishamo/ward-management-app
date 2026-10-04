const arrays=new Set(['ward_patients_v2','ward_discharged_v2','ward_names_v1','ward_studyList']);
export function validateBackup(snap,keys) {
 if(!snap||typeof snap!=='object'||Array.isArray(snap)||!Object.hasOwn(snap,'ward_patients_v2'))throw new Error('病棟管理のバックアップではありません。');
 const out={};
 for(const key of keys){
  if(snap[key]==null)continue;
  const data=typeof snap[key]==='string'?JSON.parse(snap[key]):snap[key];
  if(data==null||typeof data!=='object'||Array.isArray(data)!==arrays.has(key))throw new Error(key+' のデータ形式が不正です。');
  if(['ward_patients_v2','ward_discharged_v2'].includes(key)&&data.some(p=>!p||typeof p!=='object'||!p.id||typeof p.name!=='string'))throw new Error('患者データの形式が不正です。');
  if(key==='ward_orders_v2'&&Object.values(data).some(list=>!Array.isArray(list)||list.some(o=>!o||typeof o!=='object'||!o.id||typeof o.type!=='string'||(o.dates!=null&&!Array.isArray(o.dates)))))throw new Error('予定データの形式が不正です。');
  out[key]=JSON.stringify(data);
 }
 return out;
}
