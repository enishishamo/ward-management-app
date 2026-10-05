import {tsatValue,automaticRpi} from './clinical.js';
export default function LabCalculator({value={},onChange,sex}) {
  const get=k=>value[k]?.value??'';
  const set=(k,v)=>onChange({...value,[k]:{...value[k],value:v}});
  const tsat=tsatValue(get('fe'),get('tibc'));
  const result=automaticRpi(get('retic'),get('hct'),get('reticUnit')||'%',sex);
  const rpi=result.value;
  const field=(k,label)=><label>{label}<input inputMode="decimal" aria-label={label} value={get(k)} onChange={e=>set(k,e.target.value)}/></label>;
  return <div className="clinical-form"><h3>TSAT・RPI</h3><div className="field-grid">{field('fe','Fe（µg/dL）')}{field('tibc','TIBC（µg/dL）')}</div>
    <p><b>TSAT {tsat===null?'—':tsat.toFixed(1)+' %'}</b> <small>Fe ÷ TIBC × 100</small></p>
    <div className="field-grid">{field('retic','網赤血球')}<label>網赤血球の単位<select value={get('reticUnit')||'%'} onChange={e=>set('reticUnit',e.target.value)}><option>%</option><option>‰</option></select></label>{field('hct','Hct（%）')}</div>
    <p><b>RPI {rpi===null?'—':rpi.toFixed(2)}</b></p>
    <p className="muted">{sex==='M'?'男性':sex==='F'?'女性':'性別未設定'}・性別とHctから自動補正{result.factor!=null&&`（基準Hct ${result.normalHct}%・成熟補正係数 ${Number(result.factor.toFixed(4))}）`}</p>
    {result.reason&&<p role="status">{result.reason}</p>}
    <p className="muted">網赤（%）× Hct ÷ 基準Hct ÷ 成熟補正係数。‰は10で割って計算します。以前の手動係数・基準Htは使用しません。</p>
    <details><summary>計算の出典・入力条件</summary><p>同じ採血時点の値を使用。空欄・負数・TIBC 0・FeがTIBCを上回る場合は計算しません。男性：基準Ht 45%、係数 3.25 − 0.05 × Hct。女性：基準Ht 40%、係数 3.00 − 0.05 × Hct。基準Htを超える値は外挿しません。結果のみで疾患や正常／異常を判定しません。</p><a target="_blank" rel="noreferrer" href="https://www.mayocliniclabs.com/api/sitecore/TestCatalog/DownloadTestCatalog?testId=2503">Mayo Clinic：TSAT</a> / <a target="_blank" rel="noreferrer" href="https://hokuto.app/post/VF0FD8LmbSCV6HwHhQlb">HOKUTO公開解説：RPIの計算式</a></details>
  </div>;
}
