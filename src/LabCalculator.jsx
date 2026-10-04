import {tsatValue,rpiValue} from './clinical.js';
export default function LabCalculator({value={},onChange}) {
  const get=k=>value[k]?.value??'';
  const set=(k,v)=>onChange({...value,...(k==='hct'?{maturation:{value:''}}:{}),[k]:{...value[k],value:v}});
  const tsat=tsatValue(get('fe'),get('tibc'));
  const rpi=rpiValue(get('retic'),get('hct'),get('reticUnit')||'%',get('maturation'),get('normalHct')||45);
  const field=(k,label)=><label>{label}<input inputMode="decimal" aria-label={label} value={get(k)} onChange={e=>set(k,e.target.value)}/></label>;
  return <div className="clinical-form"><h3>TSAT・RPI</h3><div className="field-grid">{field('fe','Fe（µg/dL）')}{field('tibc','TIBC（µg/dL）')}</div>
    <p><b>TSAT {tsat===null?'—':tsat.toFixed(1)+' %'}</b> <small>Fe ÷ TIBC × 100</small></p>
    <div className="field-grid">{field('retic','網赤血球')}<label>網赤血球の単位<select value={get('reticUnit')||'%'} onChange={e=>set('reticUnit',e.target.value)}><option>%</option><option>‰</option></select></label>{field('hct','Hct（%）')}<label>成熟補正係数<select aria-label="成熟補正係数" value={get('maturation')} onChange={e=>set('maturation',e.target.value)}><option value="">選択してください</option>{[1,1.5,2,2.5,3].map(n=><option key={n}>{n}</option>)}</select></label><label>基準Hct（%）<input inputMode="decimal" value={get('normalHct')||45} onChange={e=>set('normalHct',e.target.value)}/></label></div>
    <p><b>RPI {rpi===null?'—':rpi.toFixed(2)}</b></p><p className="muted">網赤（%）× Hct ÷ 基準Hct ÷ 成熟補正係数。‰は10で割って計算します。Hctを変更したときは、係数を採用する換算表に合わせて選び直してください（代表点：Hct 45/35/25/15%に対し1/1.5/2/2.5）。</p>
    <details><summary>計算の出典・入力条件</summary><p>同じ採血時点の値を使用。空欄・負数・TIBC 0・FeがTIBCを上回る場合は計算しません。結果のみで疾患や正常／異常を判定しません。</p><a target="_blank" rel="noreferrer" href="https://www.mayocliniclabs.com/api/sitecore/TestCatalog/DownloadTestCatalog?testId=2503">Mayo Clinic：TSAT</a> / <a target="_blank" rel="noreferrer" href="https://www.ncbi.nlm.nih.gov/books/NBK499994/?report=classic">NCBI Bookshelf：RPI計算と係数</a></details>
  </div>;
}
