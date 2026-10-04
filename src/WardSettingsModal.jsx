import {useState} from 'react';
import {prescriptionWeekday} from './wardSettings.js';
export default function WardSettingsModal({wards,settings,patients,onSave,onClose}) {
  const [rows,setRows]=useState(() => [...new Set([...wards,...patients.map(p=>p.room).filter(Boolean)])].map(name=>({original:name,name,day:prescriptionWeekday(settings,name)??''})));
  const [error,setError]=useState('');
  const update=(i,key,value)=>setRows(prev=>prev.map((r,n)=>n===i?{...r,[key]:value}:r));
  function save() {
    const names=rows.map(r=>r.name.trim());
    if(names.some(n=>!n)||new Set(names).size!==names.length||!names.length){setError('病棟名を重複しない名前で入力してください。');return;}
    const rename={};const next={};
    rows.forEach((r,i)=>{if(r.original)rename[r.original]=names[i];next[names[i]]=r.day===''?null:Number(r.day);});
    try {onSave(next,names,rename);}catch{setError('保存できませんでした。空き容量を確認してください。');}
  }
  return <div className="modal-shade"><section className="ward-dialog" role="dialog" aria-modal="true" aria-labelledby="ward-title">
    <h2 id="ward-title">定期処方・病棟の設定</h2>
    <p>病棟名は自由に変更できます。名前を変えると登録済みの患者にも反映します。処方曜日は後から設定できます。</p>
    <div className="ward-rows">{rows.map((r,i)=><div className="ward-row" key={i}>
      <label>病棟名<input aria-label={`病棟名 ${i+1}`} value={r.name} onChange={e=>update(i,'name',e.target.value)}/></label>
      <label>定期処方<select aria-label={`${r.name}の定期処方曜日`} value={r.day} onChange={e=>update(i,'day',e.target.value)}><option value="">未設定</option>{['日','月','火','水','木','金','土'].map((d,n)=><option key={n} value={n}>{d}曜日</option>)}</select></label>
      <button aria-label={`${r.name}を候補から削除`} disabled={patients.some(p=>p.room===r.original)} onClick={()=>setRows(rows.filter((_,n)=>n!==i))}>削除</button>
    </div>)}</div>
    <button onClick={()=>setRows([...rows,{name:'',original:'',day:''}])}>＋ 病棟を追加</button>
    <p className="muted">患者がいる病棟は削除できません。未設定にすると曜日の自動表示を停止します。処方済みの日付は残ります。</p>
    {error&&<p role="alert">{error}</p>}
    <footer><button onClick={onClose}>キャンセル</button><button className="primary" onClick={save}>保存</button></footer>
  </section></div>;
}
