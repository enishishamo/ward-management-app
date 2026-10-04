// Transcribed from the user-supplied Fujita Okazaki 2025 guides.
// Closed intervals intentionally return BOTH rows at shared boundaries: the source
// uses overlapping “30～50 / 50～” labels. Do not silently resolve that ambiguity.
const row=(min,max,dose)=>({min,max,label:max===Infinity?(min===0?"全域":`${min}～`):min===0?`～${max}`:`${min}～${max}`,dose});
const group=(id,label,rows,extra={})=>({id,label,rows,...extra});
const r=(limits,doses)=>limits.map((n,i)=>row(n,i?limits[i-1]:Infinity,doses[i]));
export const DOSING={
 'iv-ABPC':[
 group('standard','標準量',r([50,30,15,0],['1回2g・1日4回','1回2g・1日3回','1回2g・1日2回','1回2g・1日1回']),{hd:'1回2g・1日1回（透析後）',pd:'1回2g・1日1回、または1回1g・1日2回',crrt:'1回2g・1日3回'}),
 group('high','高用量：敗血症・心内膜炎・骨髄炎・髄膜炎・Listeria',r([50,30,15,0],['1回2g・1日6回','1回2g・1日4回','1回2g・1日3回','1回2g・1日2回']),{hd:'1回2g・1日2回（透析日は透析後に投与できるよう時間調整）',pd:'1回2g・1日2回',crrt:'1回2g・1日4回'})],
 'iv-SBT/ABPC':[group('standard','標準量（AcinetobacterはAST/ICTに相談）',r([30,15,0],['1回3g・1日4回','1回3g・1日2回','1回3g・1日1回']),{hd:'1回3g・1日1回（透析後）。重症は1日2回まで',pd:'1回3g・1日1回',crrt:'1回3g・1日2回（重症は1日3回）'})],
 'iv-TAZ/PIPC':[
 group('severe','重症：肺炎・敗血症・FN・緑膿菌',r([100,40,20,0],['1回4.5g・1日4回、または1回4.5g・1日3回を各4時間、または1回4.5g・1日4回を各3時間','1回4.5g・1日4回','1回4.5g・1日3回','1回4.5g・1日2回、または1回2.25g・1日4回']),{hd:'初回4.5g、以後1回4.5g・1日2回、または1回2.25g・1日3回（透析後になるよう調整）',pd:'初回4.5g、以後1回4.5g・1日2回、または1回2.25g・1日3回',crrt:'初回4.5g、以後1回4.5g・1日3回、または1回2.25g・1日4回'}),
 group('mild','軽症～中等症：尿路・腹腔内感染症',r([100,40,20,0],['1回4.5g・1日4回、または1回4.5g・1日3回を各4時間、または1回4.5g・1日4回を各3時間','1回4.5g・1日3回','1回2.25g・1日4回','1回2.25g・1日3回']),{hd:'初回4.5g、以後1回4.5g・1日2回、または1回2.25g・1日3回（透析後になるよう調整）',pd:'初回4.5g、以後1回4.5g・1日2回、または1回2.25g・1日3回',crrt:'初回4.5g、以後1回4.5g・1日3回、または1回2.25g・1日4回'})],
 'iv-CTRX':[group('standard','標準量',r([0],['1回1～2g・1日1回（重症・心内膜炎・膿瘍は1回2g）']),{hd:'1回1～2g・1日1回。MIC≦1の場合、1回2g・週3回透析後も選択肢（原文参照）',pd:'腎機能による調整不要。原文参照',crrt:'腎機能による調整不要。原文参照'}),group('cns','髄膜炎・E. faecalis心内膜炎',r([0],['1回2g・1日2回（腎機能による調整不要）']),{hd:'1回2g・1日2回（原文の注意事項を確認）',pd:'1回2g・1日2回',crrt:'1回2g・1日2回'})],
 'iv-CMZ':[80,60].map(cut=>group('cut'+cut,cut===80?'標準（境界80）':'重症（境界60）',r([cut,30,10,0],['1回1g・1日4回、または1回2g・1日3回','1回1g・1日3回、または1回2g・1日2回','1回1g・1日2回、または1回2g・1日1回','1回1g・1日1回、または1回2g・2日に1回']),{hd:'1回2g・週3回、透析後',pd:'1回2g・2日に1回',crrt:'データなし・原資料では推奨されていません'})),
 'iv-MEPM':[group('standard','標準量',r([50,25,10,0],['1回1g・1日3回','1回1g・1日2回','1回500mg・1日2回','1回500mg・1日1回']),{hd:'1回500mg・1日1回（透析後）',pd:'1回500mg・1日1回',crrt:'1回1g・1日3回'}),group('cns','中枢神経感染症',r([50,25,10,0],['1回2g・1日3回','1回2g・1日2回','1回1g・1日2回','1回1g・1日1回']),{hd:'1回1g・1日1回（透析後）',pd:'1回1g・1日1回',crrt:'1回2g・1日2回'})],
 'oral-AMPC':[group('standard','標準量',r([30,0],['1回500mg・1日3回','1回500mg・1日2回']),{hd:'1回500mg・1日2回',pd:'1回500mg・1日2回'})],
 'oral-CVA/AMPC':[group('standard','標準量（下記はAMPC/CVAの順で表示）',r([30,10,0],['1回500mg/125mg・1日3回','1回500mg/125mg・1日2回','1回500mg/125mg・1日1回']),{hd:'1回500mg/125mg・1日1回（透析後）',pd:'1回500mg/125mg・1日2回'})],
 'oral-CEX':[group('standard','標準量（膀胱炎・咽頭炎以外）',r([30,15,0],['1回500mg・1日4回','1回500mg・1日3回','1回500mg・1日2回']),{hd:'1回500mg・1日2回',pd:'1回500mg・1日2回'}),group('cystitis','膀胱炎・咽頭炎',[],{blocked:'原文p.5に「1回500g」とあります。誤記の可能性があるため、この疾患用の自動表示は停止しています。原資料の発行元・施設手順で確認してください。'})],
 'oral-LVFX':[group('standard','標準量（初回と維持量を区別）',r([50,20,0],['初回500mg、以後1回500mg・1日1回','初回500mg、以後1回250mg・1日1回','初回500mg、以後1回250mg・2日に1回']),{hd:'初回500mg、以後1回250mg・2日に1回（透析日は透析後）',pd:'初回500mg、以後1回250mg・2日に1回'})]
};
export function matchingDoses(drugId,regimenId,ccr,mode) {
 const g=DOSING[drugId]?.find(g=>g.id===regimenId);
 if(!g||g.blocked)return [];
 if(['hd','pd','crrt'].includes(mode))return g[mode]?[{label:mode,dose:g[mode]}]:[];
 if(mode!=='stable'||ccr==null||!Number.isFinite(ccr)||ccr<0)return [];
 return g.rows.filter(r=>(r.minExclusive?ccr>r.min:ccr>=r.min)&&(r.maxExclusive?ccr<r.max:ccr<=r.max));
}

// Remaining antibacterial agents in the supplied source order. Doses expressed
// per kg or as a percent remain in source units; no body-weight model is assumed.
const fixed=(id,label,dose)=>group(id,label,r([0],[dose]));
DOSING['iv-PCG']=[group('renal','疾患別の標準1日量に対する調整率（原資料p.2で基準量を確認）',r([50,30,10,0],['標準1日量の100%を6回に分割、または持続投与','標準1日量の50～75%を4回に分割、または持続投与','標準1日量の50%を4回に分割、または持続投与','標準1日量の20～25%を2～4回に分割、または持続投与']),{hd:'標準1日量の25～50%を2～4回に分割、または持続投与。透析後になるよう時間調整',pd:'標準1日量の20～25%を2～4回に分割、または持続投与',crrt:'標準1日量の50～75%を4回に分割、または持続投与'})];
DOSING['iv-CEZ']=['standard','severe'].map(id=>group(id,id==='severe'?'心内膜炎などの重症感染症':'それ以外',r([50,30,10,0],['1回2g・1日3回',id==='severe'?'1回2g・1日3回':'1回1g・1日3回',id==='severe'?'1回2g・1日2回':'1回1g・1日2回','1回1g・1日1回']),{hd:'1回1g・1日1回（透析後）、または週3回2g–2g–3gを透析後投与',pd:'1回1g・1日1回',crrt:'1回2g・1日2回、または1回1g・1日3回'}));
DOSING['iv-CTX']=[group('standard','標準量',r([50,10,0],['1回2g・1日3回','1回2g・1日2回','1回2g・1日1回']),{hd:'1回2g・1日1回（透析後になるよう時間調整）',pd:'1回2g・1日1回',crrt:'1回2g・1日2回'}),group('cns','中枢神経感染症（髄膜炎・脳膿瘍）',r([50,10,0],['1回2g・1日4回','1回2g・1日3回','1回2g・1日2回']),{hd:'1回2g・1日2回（透析後になるよう時間調整）',pd:'1回2g・1日2回',crrt:'1回2g・1日3回'})];
DOSING['iv-SBT/CPZ']=[group('standard','標準量（製剤の総量）',r([15,0],['1回2g・1日2回','1回1g・1日2回（重症では1回2g・1日2回まで増量可）']),{hd:'1回1g・1日2回（透析後になるよう調整、重症は1回2gまで増量可）',pd:'データなし（原資料は他剤推奨）',crrt:'1回2g・1日2回'})];
DOSING['iv-CAZ']=[group('pseudomonas','緑膿菌またはそれに準じる微生物を想定',r([50,30,15,0],['1回2g・1日3回','1回2g・1日2回','1回2g・1日1回','1回1g・1日1回']),{hd:'1回1g・1日1回（透析後）、または1回1～2g・週3回透析後',pd:'1回1g・1日1回',crrt:'1回2g・1日2回（重症例では1日3回まで）'})];
DOSING['iv-CFPM']=[group('source','重症度別の用量表',[],{blocked:'原資料p.12の最上段はCrCl「60」とのみ記載され、範囲の記号がありません。境界条件を推定した自動表示はせず、原資料・施設手順で用量を確認してください。'})];
DOSING['iv-AZT']=[1,2].map(d=>group(d===1?'standard':'severe',d===1?'標準量':'重症感染症（髄膜炎など）',r([30,10,0],[`1回${d}g・1日3回`,`1回${d}g・1日2回`,`1回${d}g・1日1回`]),{hd:`1回${d}g・1日1回（透析後）`,pd:`1回${d}g・1日1回`,crrt:'1回1g・1日3回、または1回2g・1日2回'}));
DOSING['iv-LVFX']=[{...DOSING['oral-LVFX'][0],crrt:'初回500mg、以後1回500mg・2日に1回、または1回250mg・1日1回'},group('high','高用量：重症、緑膿菌・S. maltophilia',r([50,20,0],['1回750mg・1日1回','1回750mg・2日に1回','1回500mg・2日に1回']),{hd:'1回500mg・2日に1回、または1回250mg・1日1回（透析後）',pd:'1回500mg・2日に1回、または1回250mg・1日1回',crrt:'1回500mg・1日1回'})];
DOSING['iv-MINO']=[fixed('standard','標準量（腎機能による調整不要）','1回100mg・1日2回')];
const stGroups=(iv)=>[
 ['skin',iv?'皮膚・腹腔内：標準は1回2錠相当を1日2回。S. aureusは1回3～4錠相当への増量検討':'尿路・皮膚・腹腔内：標準は1回2錠を1日2回。S. aureusは1回3～4錠への増量検討'],
 ['bone',iv?'骨・関節：標準は1回3～4錠相当を1日2回、またはTMP 8mg/kg/日を2～3分割':'骨・関節：標準は1回3～4錠を1日2回'],
 ['pcp','PCP・Listeria・Nocardia脳膿瘍・中枢神経：標準はTMP 15mg/kg/日を3～4分割（非HIVのPCPは10mg/kg/日まで減量検討可）'],
 ...(iv?[['sm','S. maltophilia：標準はTMP 10mg/kg/日を2～3分割']]:[])
].map(([id,label])=>group(id,label,r([30,15,0],['上記標準量の100%','上記標準1日量の50%を2回に分割','上記標準1日量の25～33%を1日1回']),{hd:'上記標準1日量の25～33%を1日1回（透析後）',pd:'上記標準1日量の25～33%を1日1回',...(iv?{crrt:'上記標準量の100%'}:{})}));
DOSING['iv-ST']=stGroups(true);DOSING['oral-ST']=stGroups(false);
DOSING['iv-DAP']=[group('standard','標準量（心内膜炎・E. faeciumは8～10mg/kg/日）',r([30,0],['1回6～10mg/kg・1日1回','1回6～10mg/kg・2日に1回']),{hd:'1回6～10mg/kg・2日に1回（透析後）',pd:'1回6～10mg/kg・2日に1回',crrt:'1回6mg/kg・1日1回'})];
DOSING['iv-LZD']=[fixed('standard','標準量（腎機能による調整不要）','1回600mg・1日2回'),group('reduced','臨床的に安定している場合の減量検討（CrCl≦40）',[row(0,40,'1回300mg・1日2回、または1回600mg・1日1回への減量を検討')])];
DOSING['iv-CLDM']=[fixed('standard','標準量（腎機能による調整不要）','1回600mg・1日3回'),fixed('toxin','Toxic shock syndrome・壊死性筋膜炎','1回900mg・1日3回')];
DOSING['iv-AZM']=[fixed('standard','標準量（腎機能による調整不要）','1回500mg・1日1回・3日間（レジオネラ肺炎などは適宜延長）')];
DOSING['oral-AZM']=[...DOSING['iv-AZM'],fixed('chlamydia','クラミジア尿道炎・子宮頸管炎','1000mg単回'),fixed('ntm','肺非結核性抗酸菌症','1回250mg・1日1回・長期間')];
const mnz=(iv)=>[['anaerobe','嫌気性菌感染症・膣トリコモナス症',2],['cns','中枢神経感染症・CDI・アメーバ赤痢',3],['tetanus','破傷風',4]].map(([id,label,n])=>group(id,label,[{...row(10,Infinity,`1回500mg・1日${n}回`),minExclusive:true},row(0,10,'1回500mg・1日2回')],{hd:`腎機能による調整不要：1回500mg・1日${n}回`,pd:`腎機能による調整不要：1回500mg・1日${n}回`,...(iv?{crrt:`腎機能による調整不要：1回500mg・1日${n}回`}:{})}));
DOSING['iv-MNZ']=mnz(true);DOSING['oral-MNZ']=mnz(false);
DOSING['oral-SBTPC']=[group('standard','標準量（375mg錠）',[row(30,Infinity,'1回1錠・1日3回'),{...row(0,30,'1回1錠・1日2回への減量を検討'),maxExclusive:true}],{hd:'1回1錠・1日2回への減量を検討',pd:'1回1錠・1日2回への減量を検討'})];
DOSING['oral-CCL']=[group('standard','標準量',r([10,0],['1回500mg・1日3回','1回500mg・1日2回']),{hd:'1回500mg・1日2回',pd:'1回500mg・1日2回'})];
DOSING['oral-CFDN']=[group('source','原資料の国内用量',r([30,0],['1回100mg・1日3回（原資料の国内用量）','1回100mg・1日3回（原資料の国内用量。海外用量と区別）']),{hd:'1回100mg・1日1回（原資料の国内用量）',pd:'データなし'})];
DOSING['oral-CDTR-PI']=[group('standard','原資料の国内用量',r([50,10,0],['1回200mg・1日3回','1回200mg・1日2回','1回200mg・1日1回']),{hd:'1回200mg・1日1回',pd:'1回200mg・1日1回'})];
DOSING['oral-CAM']=[group('standard','原資料の国内用量（海外用量と区別）',r([30,0],['1回200mg・1日2回','1回200mg・1日1～2回']),{hd:'1回200mg・1日1～2回',pd:'1回200mg・1日1～2回'})];
DOSING['oral-GRNX']=[group('standard','標準量',r([30,0],['1回400mg・1日1回','1回200mg・1日1回']),{hd:'データなし',pd:'データなし'})];
DOSING['oral-STFX']=[group('standard','標準量',[row(50,Infinity,'1回50～100mg・1日2回'),row(30,50,'1回50～100mg・1日1回'),row(10,30,'1回50～100mg・2日に1回')],{hd:'データなし',pd:'データなし'})];
DOSING['oral-LSFX']=[fixed('standard','標準量（腎機能による調整不要）','1回75mg・1日1回')];
DOSING['oral-DOXY']=[fixed('standard','原資料の標準量（腎機能による調整不要）','1回100mg・1日2回')];
DOSING['oral-MINO']=[...DOSING['oral-DOXY']];
DOSING['oral-CLDM']=[fixed('pharyngitis','咽頭炎','1回300mg・1日3回'),fixed('other','咽頭炎以外','1回450mg・1日3回')];
DOSING['oral-FOM']=[fixed('short','国内カルシウム塩・短期使用（腎不全のデータは少ない）','1日2～3gを3～4回に分割。原資料では短期使用時は腎機能による調整不要')];
// Antifungals and antivirals included in the oral source are kept in its order.
DOSING['oral-テルビナフィン']=[group('standard','爪白癬など・国内用量',r([50,20,0],['1回125mg・1日1回','1回125mg・1日1回（データ限定的）','データなし（原資料は他剤推奨）']),{hd:'データなし（原資料は他剤推奨）',pd:'データなし（原資料は他剤推奨）'})];
DOSING['oral-FLCZ']=[['standard','基本',400],['esophageal','食道カンジダ症',200],['oral','口腔カンジダ症',100]].map(([id,label,d])=>group(id,label,r([50,0],[`初回${d}mg、以後1回${d}mg・1日1回`,`初回${d}mg、以後1回${d/2}mg・1日1回`]),{hd:`初回は通常量${d}mg。維持は1回${d}mg・週3回透析後`,pd:`初回${d}mg、以後1回${d/2}mg・1日1回`}));
DOSING['oral-オセルタミビル']=[group('treatment','治療（通常5日間・国内用量）',r([30,10,0],['1回75mg・1日2回','1回75mg・1日1回','1回30mg・2日に1回（確立した投与量はない）']),{hd:'初回30mg、その後は1回30mgを透析後',pd:'75mgを1回投与'}),group('prevention','予防（通常7～10日間・国内用量）',r([30,10,0],['1回75mg・1日1回','1回75mg・2日に1回','1回30mg・週1回（確立した投与量はない）']),{hd:'初回30mg、その後は透析2回につき1回、透析後に30mg',pd:'30mgを1回投与（必要時週1回30mg）'})];
DOSING['oral-ザナミビル']=[group('source','吸入薬',[],{blocked:'原資料には「腎機能による投与量調整不要」と記載されていますが、具体的な投与量の記載はありません。製剤の用法・用量を確認してください。'})];
DOSING['oral-ラニナミビル']=DOSING['oral-ザナミビル'];
DOSING['oral-VACV']=[group('hsv','単純疱疹（HSV）',r([50,30,10,0],['1回500mg・1日2回','1回500mg・1日2回','1回500mg・1日1回','1回500mg・1日1回']),{hd:'1回500mg・1日1回（透析後）',pd:'1回500mg・1日1回'}),group('vzv','水痘・帯状疱疹（VZV）',r([50,30,10,0],['1回1000mg・1日3回','1回1000mg・1日2回','1回1000mg・1日1回','1回500mg・1日1回']),{hd:'1回500mg・1日1回（透析後）',pd:'1回500mg・1日1回'})];
DOSING['oral-モルヌピラビル']=[fixed('standard','原資料の対象：呼吸不全のないCOVID-19、発症5日以内に開始','1回800mg・1日2回・5日間（腎機能による調整不要）')];
DOSING['oral-ニルマトレルビル/リトナビル']=[group('egfr','CCrでは選択できません',[],{blocked:'この原資料の区分はeGFR（mL/min）で、CCrではありません。CCrからの自動用量表示は行いません。最新の添付文書と施設手順でeGFR・併用薬を確認してください。'})];
DOSING['oral-エンシトレルビル']=[fixed('standard','原資料の対象：呼吸不全のないCOVID-19、発症72時間以内に開始','1日目：1回375mg・1日1回。2～5日目：1回125mg・1日1回（腎機能による調整不要）')];
DOSING['oral-アトバコン']=[fixed('treatment','ニューモシスチス肺炎の治療','1回750mg・1日2回（腎機能による調整不要）'),fixed('prevention','ニューモシスチス肺炎の予防','1回1500mg・1日1回（腎機能による調整不要）')];
