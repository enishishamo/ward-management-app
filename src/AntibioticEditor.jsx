import {useState} from 'react';
import catalog from './antibioticCatalog.json';
import {DOSING,matchingDoses} from './renalDosing.js';
import {patientCCr,number} from './clinical.js';
export default function AntibioticEditor({patient,order,onChange,onAgeChange}) {
 const [reference,setReference]=useState(null);
 const selected=catalog.find(d=>d.id===order.drugId);
 const groups=DOSING[order.drugId]||[];
 const mode=order.renalMode||patient.renalMode||'stable';
 const entered=number(patient.ccrManual);
 const ccr=entered!==null&&entered>=0?entered:patientCCr(patient).value;
 const adult=number(patient.age)>=18;
 const set=(key,value)=>onChange({...order,[key]:value});
 const modeNames={stable:'非透析・腎機能安定',aki:'AKI・腎機能変動中',hd:'血液透析',pd:'腹膜透析',crrt:'持続血液透析（原資料の区分）'};
 const recorded=patient.ccrRecordedOn;
 return <div className="clinical-form">
  <label>抗菌薬を選択<select aria-label="抗菌薬を選択" value={selected?.id||(order.name?'custom':'')} onChange={e=>{setReference(null);const d=catalog.find(d=>d.id===e.target.value);onChange({...order,drugId:d?.id||'',name:d?`${d.administration||(d.route==='iv'?'静注':'内服')} ${d.name}`:'',regimenId:'',doseMemo:'',doseSelection:null,renalMode:order.renalMode||patient.renalMode||''});}}>
   <option value="">選択してください</option><optgroup label="よく使う抗菌薬">{catalog.slice(0,11).map(d=><option value={d.id} key={d.id}>{d.administration||(d.route==='iv'?'静注':'内服')} {d.name}</option>)}</optgroup>
   <optgroup label="その他">{catalog.slice(11).map(d=><option value={d.id} key={d.id}>{d.administration||(d.route==='iv'?'静注':'内服')} {d.name}</option>)}</optgroup><option value="custom">資料外・自由記載（自動用量なし）</option>
  </select></label>
  {!selected&&<label>薬剤名（既存の自由記載も保持）<input value={order.name||''} onChange={e=>set('name',e.target.value)}/></label>}
  {selected&&<><p>CCr：<b>{ccr===null?'未入力':ccr.toFixed(1)+' mL/min'}</b>（{entered!==null?'手入力':'Cockcroft–Gault式'}）<br/><small>記録日：{recorded||'未記録'}。現在の腎機能と一致するか確認してください。</small></p>
   <p className="muted">{mode==='stable'?'非透析・腎機能安定時の候補をCCrから表示':modeNames[mode]}</p>
   <details open={mode!=='stable'}><summary>透析・AKIなどの場合</summary><label>用量の参照条件<select aria-label="用量の参照条件" value={mode} onChange={e=>onChange({...order,renalMode:e.target.value,doseSelection:null})}>{Object.entries(modeNames).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label></details>
   <div className="dose-reference"><strong>腎機能別の用量を選択（成人用参考表）</strong>
    {!adult&&<div className="notice"><p>{number(patient.age)===null?'年齢未入力：参考表は確認できます。成人と確認できるまで処方メモへの採用はできません。':'18歳未満：以下は成人用参考表です。この患者の用量として処方メモへ採用できません。'}</p><label>患者の年齢（歳）<input aria-label="患者の年齢（歳）" type="number" min="0" max="139" step="1" value={patient.age??''} onChange={e=>onAgeChange(e.target.value)}/></label><small>入力すると候補を更新します。年齢は「保存」で患者情報にも反映します。</small></div>}
    {mode==='aki'&&<p>腎機能変動中はCCrによる自動選択を行いません。経時的な腎機能・TDM・施設手順で個別に確認してください。</p>}
    {groups.map(g=>{const matching=adult?matchingDoses(order.drugId,g.id,ccr,mode):[];const rows=[...g.rows.map(r=>({...r,mode:'stable'})),...['hd','pd','crrt'].filter(m=>g[m]).map(m=>({label:modeNames[m],dose:g[m],mode:m}))];const keyFor=i=>`${selected.id}:${g.id}:${i}`;const active=rows.findIndex((r,i)=>reference===keyFor(i));const isMatch=r=>r.mode===mode&&matching.some(x=>x.label===r.label&&x.dose===r.dose||r.mode!=='stable'&&x.dose===r.dose);const picked=rows[active];return <section key={g.id} className="dose-regimen" aria-label={g.label}><h3>{g.label}</h3>
     {g.blocked?<p role="alert">{g.blocked}</p>:<>
      {matching.length>1&&<p className="muted">CCrが資料の区分境界に一致しています。該当する両区分に目印を付けています。</p>}
      <div className="renal-tabs" role="group" aria-label={`${g.label}の腎機能区分`}>{rows.map((r,i)=>{const label=r.dose.replace(/^1回([0-9.]+(?:mg|g))・1日([12346])回$/,(_,dose,n)=>`${dose} q${24/Number(n)}h`);return <button key={i} className={isMatch(r)?'renal-match':''} aria-pressed={active===i} onClick={()=>setReference(keyFor(i))}><strong>{r.mode==='stable'?`CCr ${r.label}`:r.label}</strong><span>{label}</span>{isMatch(r)&&<small>入力条件に該当</small>}</button>;})}</div>
      {picked&&<div className="dose-picked"><b>{picked.mode==='stable'?`CCr ${picked.label} mL/min`:picked.label}：{picked.dose}</b>{adult&&mode!=='aki'&&!isMatch(picked)&&<p className="notice">入力中のCCr・参照条件とは異なる区分です。採用する条件を確認してください。</p>}<button disabled={!adult||mode==='aki'||/データなし|推奨されていません|原文参照/.test(picked.dose)} onClick={()=>onChange({...order,regimenId:g.id,renalMode:picked.mode,doseMemo:picked.dose,doseSelection:{ccr,mode:picked.mode,regimenId:g.id,drugId:order.drugId,dose:picked.dose}})}>この用量を処方メモに入れる</button>{order.regimenId===g.id&&order.doseMemo===picked.dose&&<p role="status">✓ 処方メモに入力済み（保存で確定）</p>}</div>}
     </>}
    </section>;})}
    {selected.id==='iv-VCM'&&<p>{selected.text}<br/><a href="https://idmp.ucsf.edu/content/vancomycin-iv" target="_blank" rel="noreferrer">VCM：血中濃度に基づく調整について（UCSF）</a></p>}
    {!groups.length&&selected.page&&<p>この薬剤は原資料を表示します。用量の自動抽出は未対応です。</p>}
    {selected.id==='oral-CVA/AMPC'&&<p>用量はAMPC/CVAの順。資料では250RS錠（AMPC250/CVA125）＋AMPC250mgを基本としています。製剤の組み合わせを確認してください。</p>}
    {selected.id==='iv-CTRX'&&<p>高用量・長期使用時の脳症・偽胆石症、Ca含有注射との同時投与、肝障害を伴う透析患者の過量に注意（原資料p.8）。</p>}
    {selected.id==='iv-DAP'&&<p>肺炎・髄膜炎には無効（原資料）。CKを週1回以上測定。用量は50mg刻みで調整。</p>}
    {selected.id==='iv-CMZ'&&<p>長期使用は週1回PTを測定（原資料p.7）。</p>}
    {selected.id==='oral-LVFX'&&<p>内服の多価陽イオン製剤（Al/Fe/Ca/Mg/Zn）との間隔に注意。資料は内服前後2～4時間を避けるとしています。</p>}
   </div>
   <p className="muted">添付された2025年版の成人用資料に基づく参照表示です。感染部位・菌の感受性・体格・アレルギー・併用薬、施設の基準を合わせて判断してください。原資料の推奨用量は国内添付文書と異なる場合があります。処方内容は自動変更しません。</p>
   {selected.page&&<details open={!groups.length}><summary>原資料を見る（{selected.sourceDate}・p.{selected.page}）</summary><p>藤田医科大学岡崎医療センター 抗菌薬適正使用支援チーム</p><a href={`/references/${selected.route}-2025.pdf#page=${selected.page}`} target="_blank" rel="noreferrer">PDFの該当ページを開く</a>{selected.id==='oral-CEX'&&<p className="notice">膀胱炎・咽頭炎の表に単位の誤記が疑われます。</p>}<pre className="source-text">{selected.text}</pre></details>}
  </>}
  <label>実際の処方・確認メモ<input placeholder="確定した用量・投与間隔など" value={order.doseMemo||''} onChange={e=>set('doseMemo',e.target.value)}/></label>
 </div>;
}
