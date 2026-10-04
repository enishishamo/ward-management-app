// Inputs are explicit units. Do not coerce blank fields to zero.
export const number = value => (typeof value === 'string' && !value.trim()) || value == null || typeof value === 'boolean' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export function tsatValue(fe,tibc) {
  const f=number(fe),t=number(tibc);
  return f!==null&&t!==null&&f>=0&&t>0&&f<=t ? f/t*100 : null;
}
// Maturation factor is selected explicitly: published conversion tables differ.
export function rpiValue(retic,hct,unit='%',factor,normalHct=45) {
  const r=number(retic),h=number(hct),m=number(factor),n=number(normalHct);
  const pct=unit==='‰'?r/10:r;
  return r!==null&&h!==null&&m!==null&&n!==null&&['%','‰'].includes(unit)&&pct>=0&&pct<=100&&h>0&&h<=100&&m>0&&m<=4&&n>0&&n<=100 ? pct*h/n/m : null;
}
export function patientCCr(p) {
  const a=number(p.age),w=number(p.weight),c=number(p.cr);
  const missing=[];
  if(a===null||a<18||a>=140)missing.push('成人の年齢');
  if(w===null||w<=0)missing.push('体重');
  if(c===null||c<=0)missing.push('Cr');
  if(!['M','F'].includes(p.sex))missing.push('性別');
  return {value:missing.length?null:(140-a)*w/(72*c)*(p.sex==='F'?.85:1),missing};
}
