import { useState, useMemo, useRef, useEffect } from "react";

const DOW = ["日","月","火","水","木","金","土"];
const COL = {
  red:{bg:"#FEE2E2",bd:"#F87171",tx:"#B91C1C",dt:"#EF4444",hd:"#EF4444",bar:"#FCA5A5"},
  blue:{bg:"#DBEAFE",bd:"#60A5FA",tx:"#1E40AF",dt:"#3B82F6",hd:"#3B82F6",bar:"#93C5FD"},
  green:{bg:"#DCFCE7",bd:"#4ADE80",tx:"#166534",dt:"#22C55E",hd:"#22C55E",bar:"#86EFAC"},
  orange:{bg:"#FFF7ED",bd:"#FB923C",tx:"#9A3412",dt:"#F97316",hd:"#F97316",bar:"#FDBA74"},
  purple:{bg:"#F3E8FF",bd:"#C084FC",tx:"#6B21A8",dt:"#A855F7",hd:"#A855F7",bar:"#D8B4FE"},
  teal:{bg:"#F0FDFA",bd:"#2DD4BF",tx:"#115E59",dt:"#14B8A6",hd:"#14B8A6",bar:"#5EEAD4"}
};
const COLORS = Object.keys(COL);
const WARDS = ["HCU","4N","4S","5N","5S","6N","6S","7N","7S"];
const PRESETS = [
  {id:"lab",icon:"🩸",label:"血液検査確認",type:"lab"},
  {id:"img",icon:"📷",label:"画像検査確認",type:"imaging"},
  {id:"culture",icon:"🧫",label:"培養確認",type:"culture"},
  {id:"rehab_call",icon:"🏃",label:"リハさんに電話"},
  {id:"msw_call",icon:"👩‍⚕️",label:"MSWに電話"},
  {id:"family_call",icon:"📞",label:"家族に電話"},
  {id:"meds",icon:"💊",label:"投薬確認"},
  {id:"free",icon:"✏️",label:"自由記載",type:"free"}
];
const LAB_F = ["血球","CRP","電解質","腎機能","肝胆道系","その他"];
const CULTURE_T = ["血液","尿","痰"];
const R_LABS = [
  {id:"b12",l:"B12"},{id:"folate",l:"葉酸"},{id:"ferritin",l:"フェリチン"},
  {id:"fe",l:"Fe"},{id:"tibc",l:"TIBC"},{id:"tsh",l:"TSH"},
  {id:"ft4",l:"FT4"},{id:"cortisol",l:"コルチゾール"},{id:"retic",l:"網赤%"},{id:"hct",l:"Hct"}
];
const ADMIT_CL = ["同意書(DNAR)","同意書(身体拘束)","同意書(その他)","病名","入院決定",
  "入院カルテ1号紙","複合セット・指示","他科依頼","入院計画書","IC記録",
  "持参薬処方","点滴","内服薬","検査","追加検査","必要時","栄養計画"];
const DISCH_CL = ["退院決定","退院計画書","退院時処方","外来F/U","情報診療提供書","退院サマリ"];
const DEFAULT_CATS = [
  {type:"abx",icon:"🦠",label:"抗菌薬",isBar:true,showDay:true},
  {type:"drip_main",icon:"💉",label:"メイン点滴"},
  {type:"med",icon:"💊",label:"内服"},
  {type:"lab",icon:"🩸",label:"検査"},
  {type:"culture",icon:"🧫",label:"培養",showDay:true},
  {type:"img",icon:"📷",label:"画像"},
  {type:"meeting",icon:"👥",label:"面談"},
  {type:"consult",icon:"📨",label:"他科依頼"},
  {type:"family_call",icon:"📞",label:"家族連絡"}
];
const AM = 5, PM_R = 4;

// Helpers
const getWk = b => {
  const d = new Date(b), dy = d.getDay(), df = dy === 0 ? -6 : 1 - dy;
  const m = new Date(d); m.setDate(d.getDate() + df);
  return Array.from({length:7}, (_, i) => { const x = new Date(m); x.setDate(m.getDate() + i); return x; });
};
const fD = d => `${d.getMonth()+1}/${d.getDate()}`;
const dk = d => d.toISOString().split("T")[0];
const isTd = d => dk(d) === dk(new Date());
const tdL = () => fD(new Date());
const pMD = s => { if (!s) return null; const p = s.split("/"); return p.length === 2 ? new Date(2026, parseInt(p[0])-1, parseInt(p[1])) : null; };
const dB = (a, b) => { const s = pMD(a), d = pMD(b); return (s && d) ? Math.round((d - s) / 86400000) + 1 : null; };
const cCr = (age, wt, cr, f) => (!cr || cr <= 0 || !wt) ? null : Math.round(((140-age)*wt/(72*cr))*(f?0.85:1)*10)/10;
const bSp = (s, e, d) => { const a = pMD(s), b = pMD(e), c = pMD(d); return a && b && c && c >= a && c <= b; };
const addDw = s => {
  if (!s) return "";
  const pt = s.split("/");
  if (pt.length !== 2) return s;
  const dt = new Date(2026, parseInt(pt[0])-1, parseInt(pt[1]));
  return isNaN(dt.getTime()) ? s : s + DOW[dt.getDay()];
};

// Shared UI
const ck = (on, col, sz = 14) => ({
  width: sz, height: sz, borderRadius: 3, flexShrink: 0, cursor: "pointer",
  border: on ? "2px solid "+col : "2px solid #CBD5E1",
  background: on ? col : "white",
  display: "flex", alignItems: "center", justifyContent: "center"
});
const Tk = ({s = 8}) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ip = {border:"none",background:"transparent",outline:"none",fontSize:10,color:"#334155",padding:0,fontFamily:"inherit"};
const Ch = ({open}) => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
    style={{transform:open?"rotate(90deg)":"rotate(0)",transition:"0.15s"}}>
    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sample data
const iPats = [];
const iOrd = {};

function emptyCell() {
  return {presetId:null,icon:null,label:"",text:"",type:null,checked:false,priority:null,detail:{},auto:false};
}

function mkAutoTasks(today, orders, patients) {
  const t = {};
  patients.forEach(p => {
    const po = orders[p.id] || [], a = [];
    po.forEach(o => {
      if (o.type === "drip_main" && o.endDate === today)
        a.push({presetId:"drip_expire",icon:"💉",label:"点滴切れ: "+o.name,auto:true});
      if ((o.type === "med" || o.type === "abx") && o.endDate === today)
        a.push({presetId:"med_expire",icon:"💊",label:(o.type==="abx"?"抗菌薬":"内服")+"切れ: "+o.name,auto:true});
      if (o.type === "lab" && o.dates?.includes(today))
        a.push({presetId:"lab",icon:"🩸",label:"検査: "+o.name,type:"lab",auto:true});
    });
    t[p.id] = a;
  });
  return t;
}

const CARE_LEVELS = ["なし","要支援1","要支援2","要介護1","要介護2","要介護3","要介護4","要介護5","申請中"];
const FAMILY_OPTS = ["配偶者","子供","独居","施設入所","キーパーソン遠方"];

// Modals
function PatientModal({onSave, onDelete, onClose, edit, doctors, usedColors}) {
  const autoColor = () => { const used = usedColors||[]; return COLORS.find(c => !used.includes(c)) || COLORS[0]; };
  // Convert M/D string to YYYY-MM-DD for date input
  const toDateVal = s => { const d = pMD(s); if (!d) return ""; const m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0"); return `2026-${m}-${dd}`; };
  const fromDateVal = v => { if (!v) return ""; const [,m,d] = v.split("-"); return `${parseInt(m)}/${parseInt(d)}`; };
  const initAdmit = edit ? toDateVal(edit.admitDate) : toDateVal(tdL());
  const [f, setF] = useState(edit || {name:"",room:"",age:"",sex:"M",diagnosis:"",color:autoColor(),doctor:"",admitDate:tdL(),weight:"",cr:"",family:"",careLevel:"",dischargePlan:"",lastFamilyCall:""});
  const [admitDateVal, setAdmitDateVal] = useState(initAdmit);
  const [newDr, setNewDr] = useState("");
  const [showCare, setShowCare] = useState(!!(edit?.careLevel));
  const [showFamily, setShowFamily] = useState(!!(edit?.family));
  const sv = (k, v) => setF(p => ({...p, [k]: v}));
  const I = {fontSize:13,border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",width:"100%",outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const Lbl = ({children}) => <div style={{fontSize:11,color:"#64748B",fontWeight:700,marginBottom:4}}>{children}</div>;
  const Btn = ({active, onClick, children}) => (
    <button onClick={onClick} style={{border:active?"2px solid #3B82F6":"1px solid #E2E8F0",background:active?"#EFF6FF":"white",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:active?"#1D4ED8":"#475569"}}>{children}</button>
  );
  const ToggleHeader = ({label, open, onToggle, value}) => (
    <button onClick={onToggle} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #E2E8F0",background:open?"#F8FAFC":"white",borderRadius:8,padding:"8px 12px",cursor:"pointer",textAlign:"left"}}>
      <span style={{fontSize:11,color:"#64748B",fontWeight:700}}>{label}</span>
      <span style={{display:"flex",alignItems:"center",gap:6}}>
        {value && <span style={{fontSize:11,color:"#3B82F6",fontWeight:600,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</span>}
        <span style={{fontSize:12,color:"#94A3B8",transform:open?"rotate(90deg)":"rotate(0)",display:"inline-block",transition:"0.15s"}}>▶</span>
      </span>
    </button>
  );
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"white",borderRadius:16,boxShadow:"0 25px 60px rgba(0,0,0,0.25)",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:800}}>{edit ? "患者編集" : "新規患者"}</h3>
          <button onClick={onClose} style={{border:"none",background:"#F1F5F9",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          {/* 氏名 */}
          <div><Lbl>氏名 *</Lbl><input value={f.name} onChange={e => sv("name",e.target.value)} placeholder="例: 田中 太郎" style={I}/></div>
          {/* 病棟・年齢・性別 */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1.2}}>
              <Lbl>病棟 *</Lbl>
              <select value={f.room} onChange={e => sv("room",e.target.value)} style={{...I,padding:"8px 6px"}}>
                <option value="">選択</option>
                {WARDS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <Lbl>年齢</Lbl>
              <input value={f.age} onChange={e => sv("age",e.target.value)} placeholder="72" style={I} type="number"/>
            </div>
            <div style={{flex:1}}>
              <Lbl>性別</Lbl>
              <div style={{display:"flex",gap:4}}>
                <Btn active={f.sex==="M"} onClick={() => sv("sex","M")}>男</Btn>
                <Btn active={f.sex==="F"} onClick={() => sv("sex","F")}>女</Btn>
              </div>
            </div>
          </div>
          {/* 診断名・入院日 */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:2}}><Lbl>診断名</Lbl><input value={f.diagnosis} onChange={e => sv("diagnosis",e.target.value)} placeholder="肺炎" style={I}/></div>
            <div style={{flex:1}}>
              <Lbl>入院日</Lbl>
              <input type="date" value={admitDateVal} onChange={e => { setAdmitDateVal(e.target.value); sv("admitDate", fromDateVal(e.target.value)); }} style={{...I,padding:"7px 6px"}}/>
            </div>
          </div>
          {/* 主治医 */}
          <div>
            <Lbl>主治医</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
              {doctors.map(d => <Btn key={d} active={f.doctor===d} onClick={() => sv("doctor",d)}>{d} Dr</Btn>)}
              <div style={{border:"1px solid #E2E8F0",borderRadius:8,padding:"6px 12px",background:"white"}}>
                <input value={newDr} onChange={e => { setNewDr(e.target.value); sv("doctor",e.target.value); }} placeholder="新規入力..." style={{border:"none",outline:"none",fontSize:12,width:80,fontFamily:"inherit",background:"transparent"}}/>
              </div>
            </div>
          </div>
          {/* 体重・Cr */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><Lbl>体重 (kg)</Lbl><input value={f.weight} onChange={e => sv("weight",e.target.value)} placeholder="60" style={I} type="number"/></div>
            <div style={{flex:1}}><Lbl>Cr</Lbl><input value={f.cr} onChange={e => sv("cr",e.target.value)} placeholder="0.8" style={I} type="number" step="0.1"/></div>
          </div>
          {/* 介護度 トグル */}
          <div>
            <ToggleHeader label="介護度" open={showCare} onToggle={() => setShowCare(p => !p)} value={f.careLevel||undefined}/>
            {showCare && (
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                {CARE_LEVELS.map(c => <Btn key={c} active={f.careLevel===c} onClick={() => sv("careLevel",c)}>{c}</Btn>)}
              </div>
            )}
          </div>
          {/* 家族構成 トグル */}
          <div>
            <ToggleHeader label="家族構成" open={showFamily} onToggle={() => setShowFamily(p => !p)} value={f.family||undefined}/>
            {showFamily && (
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {FAMILY_OPTS.map(o => <Btn key={o} active={(f.family||"").includes(o)} onClick={() => sv("family", (f.family||"").includes(o) ? (f.family||"").replace(o,"").replace("・・","・").replace(/^・|・$/g,"") : [(f.family||""),o].filter(Boolean).join("・"))}>{o}</Btn>)}
                </div>
                <input value={f.family||""} onChange={e => sv("family",e.target.value)} placeholder="自由記入も可" style={I}/>
              </div>
            )}
          </div>
          {/* 編集時のみ: 退院予定・最終TEL */}
          {edit && (
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}><Lbl>退院予定</Lbl><input value={f.dischargePlan||""} onChange={e => sv("dischargePlan",e.target.value)} placeholder="4/15" style={I}/></div>
              <div style={{flex:1}}><Lbl>最終家族TEL</Lbl><input value={f.lastFamilyCall||""} onChange={e => sv("lastFamilyCall",e.target.value)} placeholder="4/1" style={I}/></div>
            </div>
          )}
        </div>
        <div style={{padding:"14px 20px",borderTop:"1px solid #E2E8F0",display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{flex:1,border:"1px solid #E2E8F0",background:"white",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer",fontWeight:600}}>キャンセル</button>
            <button onClick={() => { if (!f.name||!f.room) return; onSave({...f,id:edit?.id||"p_"+Date.now(),age:parseInt(f.age)||0,weight:parseFloat(f.weight)||0,cr:parseFloat(f.cr)||0}); onClose(); }}
              style={{flex:2,border:"none",background:"#3B82F6",color:"white",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {edit ? "更新" : "登録"}
            </button>
          </div>
          {edit && (
            <button onClick={() => { if (window.confirm(`「${edit.name}」を削除しますか？`)) { onDelete(edit.id); onClose(); } }}
              style={{width:"100%",border:"1px solid #FCA5A5",background:"#FFF5F5",color:"#DC2626",borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              この患者を削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddCatModal({onAdd, onClose}) {
  const [icon, setIcon] = useState("📋");
  const [label, setLabel] = useState("");
  const [isBar, setIsBar] = useState(false);
  const [showDay, setShowDay] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,0.3)",
      display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{width:280,background:"white",borderRadius:12,
        boxShadow:"0 15px 40px rgba(0,0,0,0.15)",padding:16}}>
        <h3 style={{margin:"0 0 10px",fontSize:13,fontWeight:700}}>大項目を追加</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:"#64748B",width:40}}>アイコン</span>
            <input value={icon} onChange={e => setIcon(e.target.value)}
              style={{...ip,fontSize:16,width:32,border:"1px solid #E2E8F0",borderRadius:4,padding:"2px 4px",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:"#64748B",width:40}}>名称</span>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="例: 多職種TEL"
              style={{...ip,fontSize:11,flex:1,border:"1px solid #E2E8F0",borderRadius:4,padding:"4px 6px",width:"auto"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <label style={{fontSize:9,display:"flex",alignItems:"center",gap:3}}>
              <input type="checkbox" checked={isBar} onChange={e => setIsBar(e.target.checked)}/>バー(期間)
            </label>
            <label style={{fontSize:9,display:"flex",alignItems:"center",gap:3}}>
              <input type="checkbox" checked={showDay} onChange={e => setShowDay(e.target.checked)}/>日数表示
            </label>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:12}}>
          <button onClick={onClose} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:6,padding:"4px 12px",fontSize:10,cursor:"pointer"}}>取消</button>
          <button onClick={() => { if (label) { onAdd({type:"custom_"+Date.now(),icon,label,isBar,showDay}); onClose(); }}}
            style={{border:"none",background:"#3B82F6",color:"white",borderRadius:6,padding:"4px 12px",fontSize:10,fontWeight:700,cursor:"pointer"}}>追加</button>
        </div>
      </div>
    </div>
  );
}

function PresetPicker({onSelect, onClose, pos}) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{position:"fixed",zIndex:200,top:pos?.y||100,
      left:pos?Math.min(pos.x,window.innerWidth-210):100,width:200,
      background:"white",borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,0.18)",
      border:"1px solid #E2E8F0",padding:6}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
        {PRESETS.map(p => (
          <div key={p.id} onClick={() => { onSelect(p); onClose(); }}
            style={{display:"flex",alignItems:"center",gap:3,padding:"4px 5px",borderRadius:5,
              cursor:"pointer",fontSize:9,color:"#334155"}}
            onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{fontSize:11}}>{p.icon}</span>{p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCell({cell, onUpdate, color, onComplete, onPriority, onCultureDone, onImgDone}) {
  const [pp, setPP] = useState(false);
  const [exp, setExp] = useState(false);
  const br = useRef(null);
  const [pos, setPos] = useState(null);
  const open = () => { if (br.current) { const r = br.current.getBoundingClientRect(); setPos({x:r.left,y:r.bottom+2}); } setPP(true); };
  const sel = p => { onUpdate({...emptyCell(),presetId:p.id,icon:p.icon,label:p.label,type:p.type}); if (["lab","culture","imaging"].includes(p.type)) setExp(true); };
  const hd = ["lab","culture","imaging"].includes(cell.type);

  if (!cell.presetId) return (
    <div style={{minHeight:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <button ref={br} onClick={open} style={{border:"1px dashed #D1D5DB",background:"transparent",borderRadius:4,padding:"1px 6px",fontSize:9,color:"#94A3B8",cursor:"pointer"}}>＋</button>
      {pp && <PresetPicker pos={pos} onSelect={sel} onClose={() => setPP(false)}/>}
    </div>
  );

  return (
    <div style={{background:cell.checked?"#F0FDF4":"transparent",padding:"1px 0"}}>
      <div style={{display:"flex",alignItems:"center",gap:2}}>
        <div onClick={onComplete} style={ck(cell.checked, color)}>{cell.checked && <Tk/>}</div>
        {hd && <div onClick={() => setExp(!exp)} style={{cursor:"pointer",color:"#94A3B8",display:"flex"}}><Ch open={exp}/></div>}
        <span style={{fontSize:10,flexShrink:0}}>{cell.icon}</span>
        {cell.type === "free" ? (
          <input value={cell.text||""} onChange={e => onUpdate({...cell,text:e.target.value})} placeholder="..."
            style={{...ip,flex:1,fontSize:9,textDecoration:cell.checked?"line-through":"none",opacity:cell.checked?0.4:1,width:"auto"}}/>
        ) : (
          <span style={{fontSize:9,fontWeight:600,color:"#334155",flex:1,overflow:"hidden",textOverflow:"ellipsis",
            whiteSpace:"nowrap",textDecoration:cell.checked?"line-through":"none",opacity:cell.checked?0.4:1}}>
            {cell.label}{cell.auto && <span style={{fontSize:7,color:"#94A3B8",marginLeft:2}}>自動</span>}
          </span>
        )}
        <input type="number" min="1" max="99" value={cell.priority||""} onChange={e => onPriority(e.target.value)}
          placeholder="·" style={{width:18,border:"none",background:cell.priority?"#FEF3C7":"#F8FAFC",borderRadius:3,
            fontSize:8,fontWeight:700,color:"#92400E",textAlign:"center",outline:"none",padding:"1px 0",fontFamily:"inherit"}}/>
        <button onClick={() => onUpdate(emptyCell())} style={{border:"none",background:"transparent",color:"#CBD5E1",cursor:"pointer",fontSize:8,padding:0}}>✕</button>
      </div>
      {exp && cell.type === "lab" && (
        <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:2}}>
          {LAB_F.map(f => {
            const v = (cell.detail && cell.detail[f]) || {checked:false,memo:""};
            return (
              <div key={f} style={{display:"flex",alignItems:"center",gap:2}}>
                <div onClick={() => onUpdate({...cell,detail:{...cell.detail,[f]:{...v,checked:!v.checked}}})} style={ck(v.checked,color,10)}>{v.checked && <Tk s={5}/>}</div>
                <span style={{fontSize:7,color:"#64748B",fontWeight:600,width:28}}>{f}</span>
                <input value={v.memo} onChange={e => onUpdate({...cell,detail:{...cell.detail,[f]:{...v,memo:e.target.value}}})} placeholder="—" style={{...ip,fontSize:7,flex:1,width:"auto"}}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== LOCAL STORAGE HELPERS =====
const loadLS = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const saveLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ===== MAIN APP =====
export default function App() {
  const [selDate, setSelDate] = useState(new Date());
  const wk = useMemo(() => getWk(selDate), [selDate]);
  const [patients, setPatients] = useState(() => loadLS("ward_patients_v2", iPats));
  const [discharged, setDischarged] = useState(() => loadLS("ward_discharged_v2", []));
  const wardOrder = r => { const i = WARDS.indexOf(r); return i >= 0 ? i : 99; };
  const sortedPats = useMemo(() => [...patients].sort((a,b) => wardOrder(a.room) - wardOrder(b.room)), [patients]);
  const doctors = useMemo(() => [...new Set(patients.map(p => p.doctor).filter(Boolean))].sort(), [patients]);
  const [orders, setOrders] = useState(() => loadLS("ward_orders_v2", {}));
  const [patCats, setPatCats] = useState(() => loadLS("ward_patCats_v2", {}));
  const [rLabs, setRLabs] = useState(() => loadLS("ward_rLabs_v2", {}));
  const [patModal, setPatModal] = useState(null);
  const [catModal, setCatModal] = useState(null);
  const [showCatMenu, setShowCatMenu] = useState({});
  const [expP, setExpP] = useState({});
  const [showCL, setShowCL] = useState({});
  const [aCL, setACL] = useState({});
  const [dCL, setDCL] = useState({});
  const [rlOpen, setRlOpen] = useState({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const [mobileTab, setMobileTab] = useState("todo");
  const [showAddAM, setShowAddAM] = useState({});
  const [showAddPM, setShowAddPM] = useState({});
  const [panel, setPanel] = useState("schedule");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [showDrFilter, setShowDrFilter] = useState(false);
  const filteredPats = useMemo(() => filterDoctor === "all" ? sortedPats : sortedPats.filter(p => p.doctor === filterDoctor), [sortedPats, filterDoctor]);
  useEffect(() => { saveLS("ward_patients_v2", patients); }, [patients]);
  useEffect(() => { saveLS("ward_discharged_v2", discharged); }, [discharged]);
  useEffect(() => { saveLS("ward_orders_v2", orders); }, [orders]);
  useEffect(() => { saveLS("ward_patCats_v2", patCats); }, [patCats]);
  useEffect(() => { saveLS("ward_rLabs_v2", rLabs); }, [rLabs]);
  // Migrate old drip_main/med bar orders (startDate/endDate) to dates[]
  useEffect(() => {
    setOrders(prev => {
      let changed = false;
      const next = {};
      Object.keys(prev).forEach(pid => {
        next[pid] = (prev[pid]||[]).map(o => {
          if ((o.type === "drip_main" || o.type === "med") && o.startDate && !(o.dates?.length)) {
            changed = true;
            const dates = [];
            let d = pMD(o.startDate), e = pMD(o.endDate || o.startDate);
            if (d && e) { while (d <= e) { dates.push(fD(d)); d = new Date(d); d.setDate(d.getDate()+1); } }
            return {...o, dates, startDate: null, endDate: null};
          }
          return o;
        });
      });
      return changed ? next : prev;
    });
  }, []); // run once on mount
  const today = tdL();

  const addOrUpdatePat = p => {
    const isNew = !patients.find(x => x.id === p.id);
    setPatients(pr => { const i = pr.findIndex(x => x.id === p.id); if (i >= 0) { const n = [...pr]; n[i] = p; return n; } return [...pr, p]; });
    if (isNew) {
      setOrders(pr => ({...pr, [p.id]: [
        {id:Date.now()+1, type:"drip_main", name:"", dates:[]},
        {id:Date.now()+2, type:"med", name:"", dates:[]},
        {id:Date.now()+3, type:"lab", name:"血液検査", dates:[]},
        {id:Date.now()+4, type:"family_call", name:"家族連絡", dates:[]},
      ]}));
      setPatCats(pr => ({...pr, [p.id]: [...DEFAULT_CATS]}));
      setRLabs(pr => ({...pr, [p.id]: {}}));
    } else {
      if (!orders[p.id]) setOrders(pr => ({...pr, [p.id]: []}));
      if (!rLabs[p.id]) setRLabs(pr => ({...pr, [p.id]: {}}));
      if (!patCats[p.id]) setPatCats(pr => ({...pr, [p.id]: [...DEFAULT_CATS]}));
    }
    setExpP(pr => ({...pr, [p.id]: true}));
  };
  const dischargePat = pid => {
    const p = patients.find(x => x.id === pid); if (!p) return;
    const fu = window.prompt("外来フォロー予定日（例: 4/15）。なければ空白のままEnter");
    setDischarged(pr => [...pr, {...p, dischargeDate: today, followUp: fu||""}]);
    setPatients(pr => pr.filter(x => x.id !== pid));
  };
  const deletePat = pid => {
    setPatients(pr => pr.filter(x => x.id !== pid));
    setOrders(pr => { const n = {...pr}; delete n[pid]; return n; });
    setPatCats(pr => { const n = {...pr}; delete n[pid]; return n; });
    setRLabs(pr => { const n = {...pr}; delete n[pid]; return n; });
    setTaskDB(pr => { const n = {}; Object.keys(pr).forEach(d => { const day = {...pr[d]}; delete day[pid]; n[d] = day; }); return n; });
  };
  const extBar = (pid, oid, ds) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => {
    if (o.id !== oid) return o;
    if (!o.startDate) return {...o, startDate: ds, endDate: ds}; // 未配置→クリック日に配置
    const s = pMD(o.startDate), d = pMD(ds);
    if (!s || !d) return {...o, startDate: ds, endDate: ds};
    if (d < s) return {...o, startDate: ds}; // 開始日より前→開始日を移動
    return {...o, endDate: ds}; // 開始日以降→終了日を延長/短縮
  })}));
  const togDot = (pid, oid, ds) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => { if (o.id !== oid) return o; const d = o.dates||[]; return {...o, dates: d.includes(ds) ? d.filter(x => x !== ds) : [...d, ds].sort()}; })}));
  const addOrd = (pid, type) => { const bar = ["drip_main","med","abx"].includes(type); setOrders(p => ({...p, [pid]: [...(p[pid]||[]), {id:Date.now(),type,name:"",dates:bar?undefined:[],startDate:bar?today:undefined,endDate:bar?today:undefined,...(type.startsWith("culture")?{resultDate:""}:{})}]})); };
  const rmOrd = (pid, oid) => setOrders(p => ({...p, [pid]: (p[pid]||[]).filter(o => o.id !== oid)}));
  const updNm = (pid, oid, n) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => o.id === oid ? {...o, name: n} : o)}));
  const markCulDone = (pid, oid) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => o.id === oid ? {...o, resultDate: today} : o)}));
  const markImgDone = (pid, oid) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => o.id === oid ? {...o, reportConfirmed: true} : o)}));
  const updGram = (pid, oid, val) => setOrders(p => ({...p, [pid]: (p[pid]||[]).map(o => o.id === oid ? {...o, gramResult: val} : o)}));
  const addCultureOrd = (pid, specimen) => setOrders(p => ({...p, [pid]: [...(p[pid]||[]), {id:Date.now(), type:"culture", specimen, gramResult:"", dates:[], resultDate:""}]}));

  // Sync TODO task → weekly schedule orders
  const syncTaskToOrder = (pid, newCell, oldCell) => {
    const orderTypeMap = { lab: "lab", imaging: "img", culture: "culture_blood" };
    const newOrdType = (newCell.presetId && !newCell.auto) ? orderTypeMap[newCell.type] : null;
    const oldOrdType = (oldCell?.presetId && !oldCell?.auto) ? orderTypeMap[oldCell.type] : null;
    if (newOrdType === oldOrdType) return;
    if (oldOrdType) {
      setOrders(prev => {
        const pOrds = prev[pid] || [];
        const ord = pOrds.find(o => o.type === oldOrdType && o.dates?.includes(selDateStr));
        if (!ord) return prev;
        return {...prev, [pid]: pOrds.map(o => o.id === ord.id ? {...o, dates: ord.dates.filter(d => d !== selDateStr)} : o)};
      });
    }
    if (newOrdType) {
      setOrders(prev => {
        const pOrds = prev[pid] || [];
        const ord = pOrds.find(o => o.type === newOrdType);
        if (ord) {
          if (ord.dates?.includes(selDateStr)) return prev;
          return {...prev, [pid]: pOrds.map(o => o.id === ord.id ? {...o, dates: [...(o.dates||[]), selDateStr].sort()} : o)};
        }
        const nameMap = { lab: "血液検査", img: "画像検査", culture_blood: "培養(血液)" };
        return {...prev, [pid]: [...pOrds, {id: Date.now(), type: newOrdType, name: nameMap[newOrdType]||"検査", dates: [selDateStr]}]};
      });
    }
  };

  // Date-keyed task storage
  const selDateStr = fD(selDate);
  const mkEmptyDay = (pats, dateStr) => {
    const am = {}, pm = {}, vt = {}, kt = {};
    for (let r = 0; r < AM; r++) pats.forEach(p => { am["am"+r+"_"+p.id] = emptyCell(); });
    for (let r = 0; r < PM_R; r++) pats.forEach(p => { pm["pm"+r+"_"+p.id] = emptyCell(); });
    pats.forEach(p => { vt[p.id] = {status:null,memo:""}; kt[p.id] = {checked:false,memo:""}; });
    return {am, pm, vitals: vt, karte: kt};
  };
  const [taskDB, setTaskDB] = useState(() => loadLS("ward_taskDB", (() => { const db = {}; db[today] = mkEmptyDay(iPats, today); return db; })()));
  useEffect(() => { saveLS("ward_taskDB", taskDB); }, [taskDB]);
  const ensureDay = dateStr => {
    setTaskDB(prev => {
      if (prev[dateStr]) return prev;
      const fresh = mkEmptyDay(patients, dateStr);
      const prevDate = new Date(selDate); prevDate.setDate(prevDate.getDate()-1);
      const prevStr = fD(prevDate);
      const prevDay = prev[prevStr];
      if (prevDay) {
        Object.entries(prevDay.am).forEach(([k,v]) => { if (v.presetId && !v.checked && !v.auto) fresh.am[k] = {...v, priority: null}; });
        Object.entries(prevDay.pm).forEach(([k,v]) => { if (v.presetId && !v.checked && !v.auto) fresh.pm[k] = {...v, priority: null}; });
      }
      return {...prev, [dateStr]: fresh};
    });
  };
  useEffect(() => { ensureDay(selDateStr); }, [selDateStr]);
  const dayData = taskDB[selDateStr] || mkEmptyDay(patients, selDateStr);
  const storedAm = dayData.am, pmC = dayData.pm, curVitals = dayData.vitals, curKarte = dayData.karte;

  // Reactive auto-tasks: recalculated whenever orders change, merged with stored AM
  const amC = useMemo(() => {
    const auto = mkAutoTasks(selDateStr, orders, sortedPats);
    const merged = {...storedAm};
    // Inject auto-tasks into empty AM slots (don't overwrite manually set tasks)
    sortedPats.forEach(p => {
      const autoItems = auto[p.id] || [];
      autoItems.forEach(a => {
        // Skip if already represented (auto or manual task of the same type)
        const alreadyPresent = Object.entries(merged).some(([k, v]) =>
          k.endsWith("_"+p.id) && v.presetId &&
          ((v.auto && v.presetId === a.presetId && v.label === a.label) ||
           (!v.auto && a.type && v.type === a.type))
        );
        if (alreadyPresent) return;
        // Inject into first empty slot
        for (let slot = 0; slot < AM; slot++) {
          const key = "am"+slot+"_"+p.id;
          if (!merged[key] || !merged[key].presetId) {
            merged[key] = {...emptyCell(), ...a};
            break;
          }
        }
      });
    });
    return merged;
  }, [storedAm, orders, sortedPats, selDateStr]);
  const setAmC = fn => setTaskDB(prev => { const d = prev[selDateStr] || mkEmptyDay(patients, selDateStr); return {...prev, [selDateStr]: {...d, am: typeof fn === "function" ? fn(d.am) : fn}}; });
  const setPmC = fn => setTaskDB(prev => { const d = prev[selDateStr] || mkEmptyDay(patients, selDateStr); return {...prev, [selDateStr]: {...d, pm: typeof fn === "function" ? fn(d.pm) : fn}}; });
  const setVitals = fn => setTaskDB(prev => { const d = prev[selDateStr] || mkEmptyDay(patients, selDateStr); return {...prev, [selDateStr]: {...d, vitals: typeof fn === "function" ? fn(d.vitals) : fn}}; });
  const setKarte = fn => setTaskDB(prev => { const d = prev[selDateStr] || mkEmptyDay(patients, selDateStr); return {...prev, [selDateStr]: {...d, karte: typeof fn === "function" ? fn(d.karte) : fn}}; });
  const isPast = pMD(selDateStr) < pMD(today);
  const isFuture = pMD(selDateStr) > pMD(today);

  const pendingConfirms = useMemo(() => {
    const pc = {};
    sortedPats.forEach(p => {
      const items = [];
      (orders[p.id]||[]).forEach(o => {
        if (o.type?.startsWith("culture") && o.dates?.[0] && (!o.resultDate || o.resultDate === "")) {
          const d = dB(o.dates[0], selDateStr);
          if (d && d >= 1) items.push({type:"culture",icon:"🧫",name:o.name,day:d,orderId:o.id});
        }
        if (o.type === "img" && o.dates?.length > 0 && !o.reportConfirmed)
          items.push({type:"img",icon:"📷",name:o.name,orderId:o.id});
      });
      pc[p.id] = items;
    });
    return pc;
  }, [orders, sortedPats, selDateStr]);

  const [consults, setConsults] = useState(() => loadLS("ward_consults_v2", {}));
  useEffect(() => { saveLS("ward_consults_v2", consults); }, [consults]);
  const [studyList, setStudyList] = useState([{id:1,text:"",checked:false},{id:2,text:"",checked:false}]);
  const allC = useMemo(() => ({...amC,...pmC}), [amC, pmC]);

  const setPri = (key, val) => {
    const nP = val ? parseInt(val) : null;
    const sh = (prev, own) => { const n = {...prev}; if (own) n[key] = {...n[key], priority: nP}; if (nP !== null) Object.keys(n).forEach(k => { if (k !== key && n[k].priority != null && n[k].priority >= nP && !n[k].checked) n[k] = {...n[k], priority: n[k].priority+1}; }); return n; };
    if (key.startsWith("am")) { setAmC(p => sh(p, true)); setPmC(p => sh(p, false)); } else { setPmC(p => sh(p, true)); setAmC(p => sh(p, false)); }
  };
  const compT = key => {
    const c = allC[key]; if (!c) return;
    const was = c.checked, pri = c.priority;
    const dn = (prev, own) => { const n = {...prev}; if (own) n[key] = {...n[key], checked: !was, priority: !was ? null : pri}; if (!was && pri) Object.keys(n).forEach(k => { if (k !== key && n[k].priority && n[k].priority > pri) n[k] = {...n[k], priority: n[k].priority-1}; }); return n; };
    if (key.startsWith("am")) { setAmC(p => dn(p, true)); setPmC(p => dn(p, false)); } else { setPmC(p => dn(p, true)); setAmC(p => dn(p, false)); }
  };
  const priList = useMemo(() => Object.entries(allC).filter(([,v]) => v.priority && !v.checked && v.presetId)
    .map(([key,v]) => ({key,...v,patient:sortedPats.find(p => key.endsWith("_"+p.id))}))
    .sort((a,b) => a.priority - b.priority), [allC, sortedPats]);
  const urgList = useMemo(() => { const r = []; patients.forEach(p => (consults[p.id]||[]).forEach(c => { if (c.urgent && !c.checked && c.text) r.push({...c, patient: p}); })); return r; }, [consults, patients]);

  // Render task rows
  const tdRows = (pfx, col, cells, setC, cnt) => {
    const rows = [];
    for (let ri = 0; ri < cnt; ri++) {
      rows.push(
        <tr key={pfx+ri} style={{background:ri%2===0?"#fff":"#FAFBFC"}}>
          {ri === 0 && (
            <td rowSpan={cnt} style={{padding:"3px 2px",textAlign:"center",verticalAlign:"middle",
              borderBottom:"2px solid #E2E8F0",borderRight:"1px solid #E2E8F0",background:col+"0A",writingMode:"vertical-rl"}}>
              <span style={{fontSize:10,fontWeight:800,color:col,letterSpacing:2}}>{pfx.toUpperCase()}</span>
            </td>
          )}
          {filteredPats.map(p => {
            const key = pfx+ri+"_"+p.id;
            const cell = cells[key] || emptyCell();
            const cl = COL[p.color];
            return (
              <td key={p.id} style={{padding:"2px 3px",borderBottom:ri===cnt-1?"2px solid #E2E8F0":"1px solid #F1F5F9",borderLeft:"1px solid #F1F5F9",verticalAlign:"top"}}>
                <TaskCell cell={cell} color={cl.dt}
                  onUpdate={v => { setC(prev => ({...prev,[key]:v})); syncTaskToOrder(p.id, v, cells[key]); }}
                  onComplete={() => compT(key)}
                  onPriority={v => setPri(key, v)}
                  onCultureDone={oid => markCulDone(p.id, oid)}
                  onImgDone={oid => markImgDone(p.id, oid)}/>
              </td>
            );
          })}
        </tr>
      );
    }
    return rows;
  };

  // Gantt row for a single patient
  const renderGanttPatient = p => {
    const c = COL[p.color], po = orders[p.id]||[], isE = expP[p.id];
    const cv = cCr(p.age, p.weight, p.cr, p.sex === "F");
    const rl = rLabs[p.id]||{};
    const fe = rl.fe?.value ? parseFloat(rl.fe.value) : null;
    const tibc = rl.tibc?.value ? parseFloat(rl.tibc.value) : null;
    const tsat = (fe && tibc && tibc > 0) ? Math.round(fe/tibc*100) : null;
    const ret = rl.retic?.value ? parseFloat(rl.retic.value) : null;
    const hct = rl.hct?.value ? parseFloat(rl.hct.value) : null;
    const rpi = (ret && hct) ? Math.round(ret*(hct/45)*10)/10 : null;
    const rows = [];

    // Patient header
    rows.push(
      <tr key={p.id+"_h"} style={{background:c.bg+"60"}}>
        <td style={{padding:"4px 6px",borderBottom:"1px solid "+c.bd+"40",borderRight:"1px solid #E2E8F0",verticalAlign:"top"}}>
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <div onClick={() => setExpP(pr => ({...pr,[p.id]:!pr[p.id]}))} style={{cursor:"pointer",color:c.dt,display:"flex"}}><Ch open={isE}/></div>
            <span style={{width:7,height:7,borderRadius:"50%",background:c.dt}}/>
            <span style={{fontSize:11,fontWeight:800}}>{p.name}</span>
            <button onClick={() => setPatModal({edit:p})} style={{border:"none",background:"transparent",color:"#94A3B8",fontSize:8,cursor:"pointer",padding:0}}>✎</button>
            <button onClick={() => { if (window.confirm(p.name+"さんを退院にしますか？")) dischargePat(p.id); }}
              style={{border:"none",background:"transparent",color:"#F87171",fontSize:7,cursor:"pointer",padding:0,marginLeft:"auto"}}>退院</button>
          </div>
          <div style={{paddingLeft:17,fontSize:8,color:"#64748B",lineHeight:1.5}}>
            {p.room}|{p.age}{p.sex==="F"?"♀":"♂"}|{p.diagnosis}<br/>
            CCr:<b style={{color:cv&&cv<30?"#DC2626":"#334155"}}>{cv||"—"}</b> Wt:{p.weight} Cr:{p.cr}<br/>
            家族:{p.family}|介護:{p.careLevel}|TEL:<b style={{color:"#0369A1"}}>{p.lastFamilyCall}</b>
          </div>
          {isE && (
            <div style={{paddingLeft:17,marginTop:2,display:"flex",gap:3}}>
              <button onClick={() => setShowCL(pr => ({...pr,[p.id+"_a"]:!pr[p.id+"_a"]}))}
                style={{border:"none",background:"#DBEAFE",color:"#1E40AF",borderRadius:3,fontSize:7,fontWeight:700,padding:"1px 4px",cursor:"pointer"}}>入院CL</button>
              <button onClick={() => setShowCL(pr => ({...pr,[p.id+"_d"]:!pr[p.id+"_d"]}))}
                style={{border:"none",background:"#FEF3C7",color:"#92400E",borderRadius:3,fontSize:7,fontWeight:700,padding:"1px 4px",cursor:"pointer"}}>退院CL</button>
              <div style={{position:"relative"}}>
                <button onClick={() => setShowCatMenu(pr => ({...pr,[p.id]:!pr[p.id]}))}
                  style={{border:"1px dashed #94A3B8",background:"transparent",borderRadius:3,fontSize:7,fontWeight:600,padding:"1px 4px",cursor:"pointer",color:"#64748B"}}>＋追加</button>
                {showCatMenu[p.id] && (
                  <div onClick={e => e.stopPropagation()} style={{position:"absolute",top:"110%",left:0,zIndex:300,background:"white",border:"1px solid #E2E8F0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",padding:6,minWidth:140}}>
                    {[
                      {type:"abx",icon:"🦠",label:"抗菌薬",isBar:true,showDay:true},
                      {type:"culture",icon:"🧫",label:"培養",showDay:true},
                      {type:"img",icon:"📷",label:"画像"},
                      {type:"meeting",icon:"👥",label:"面談"},
                      {type:"consult",icon:"📨",label:"他科依頼"},
                    ].map(cat => (
                      <button key={cat.type} onClick={() => {
                        setPatCats(pr => {
                          const cats = pr[p.id] || [...DEFAULT_CATS];
                          return cats.find(c => c.type === cat.type) ? pr : {...pr, [p.id]: [...cats, cat]};
                        });
                        addOrd(p.id, cat.type);
                        setShowCatMenu(pr => ({...pr, [p.id]: false}));
                      }} style={{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",borderRadius:6,padding:"6px 10px",fontSize:11,cursor:"pointer",color:"#334155"}}>
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                    <div style={{borderTop:"1px solid #F1F5F9",marginTop:3,paddingTop:3}}>
                      <button onClick={() => { setCatModal(p.id); setShowCatMenu(pr => ({...pr,[p.id]:false})); }}
                        style={{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",borderRadius:6,padding:"6px 10px",fontSize:11,cursor:"pointer",color:"#64748B"}}>
                        ✏️ カスタム追加
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </td>
        {wk.map((d, di) => {
          const ds = fD(d), t = isTd(d), m = [];
          if (p.admitDate === ds) m.push({l:"入院",bg:"#DBEAFE",co:"#1E40AF"});
          if (p.dischargePlan === ds) m.push({l:"退院",bg:"#FEF3C7",co:"#92400E"});
          if (p.surgery === ds) m.push({l:"手術",bg:"#FCE7F3",co:"#9D174D"});
          return (
            <td key={di} style={{padding:"2px 1px",borderBottom:"1px solid "+c.bd+"40",borderLeft:"1px solid #F1F5F9",background:t?"#EFF6FF30":"transparent",textAlign:"center",verticalAlign:"top"}}>
              {m.map((x, i) => <div key={i} style={{fontSize:7,background:x.bg,color:x.co,borderRadius:3,padding:"1px 2px",fontWeight:800,marginBottom:1}}>{x.l}</div>)}
            </td>
          );
        })}
      </tr>
    );

    // Checklists
    if (showCL[p.id+"_a"]) rows.push(
      <tr key={p.id+"_acl"}><td colSpan={8} style={{padding:"3px 8px 3px 24px",borderBottom:"1px solid #BAE6FD",background:"#EFF6FF"}}>
        <div style={{fontSize:8,fontWeight:700,color:"#1E40AF",marginBottom:2}}>入院チェックリスト</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {ADMIT_CL.map(x => {
            const k = p.id+"_a_"+x, on = aCL[k], memo = aCL[k+"_memo"]||"";
            return (
              <div key={x} style={{display:"flex",alignItems:"center",gap:2,padding:"1px 4px",borderRadius:3,background:on?"#DCFCE7":"white",border:"1px solid "+(on?"#86EFAC":"#E2E8F0")}}>
                <div onClick={() => setACL(pr => ({...pr,[k]:!pr[k]}))} style={{...ck(on,c.dt,9),cursor:"pointer"}}>{on && <Tk s={4}/>}</div>
                <span style={{fontSize:7,cursor:"pointer"}} onClick={() => setACL(pr => ({...pr,[k]:!pr[k]}))}>{x}</span>
                {x === "追加検査" && <input value={memo} onClick={e => e.stopPropagation()} onChange={e => setACL(pr => ({...pr,[k+"_memo"]:e.target.value}))} placeholder="メモ..." style={{...ip,fontSize:7,width:50,border:"1px solid #E2E8F0",borderRadius:2,padding:"0 3px",background:"white"}}/>}
              </div>
            );
          })}
        </div>
      </td></tr>
    );

    if (showCL[p.id+"_d"]) rows.push(
      <tr key={p.id+"_dcl"}><td colSpan={8} style={{padding:"3px 8px 3px 24px",borderBottom:"1px solid #FDE68A",background:"#FFFBEB"}}>
        <div style={{fontSize:8,fontWeight:700,color:"#92400E",marginBottom:2}}>退院チェックリスト</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {DISCH_CL.map(x => {
            const k = p.id+"_d_"+x, on = dCL[k], fuVal = dCL[k+"_val"]||"";
            return (
              <div key={x} style={{display:"flex",alignItems:"center",gap:2,padding:"1px 4px",borderRadius:3,background:on?"#DCFCE7":"white",border:"1px solid "+(on?"#86EFAC":"#E2E8F0")}}>
                <div onClick={() => setDCL(pr => ({...pr,[k]:!pr[k]}))} style={{...ck(on,c.dt,9),cursor:"pointer"}}>{on && <Tk s={4}/>}</div>
                <span style={{fontSize:7,cursor:"pointer"}} onClick={() => setDCL(pr => ({...pr,[k]:!pr[k]}))}>{x}</span>
                {x === "外来F/U" && on && (
                  <select value={fuVal} onClick={e => e.stopPropagation()} onChange={e => setDCL(pr => ({...pr,[k+"_val"]:e.target.value}))}
                    style={{fontSize:7,border:"1px solid #E2E8F0",borderRadius:2,padding:"0 2px",background:"white",outline:"none"}}>
                    <option value="">—</option><option value="あり">あり</option><option value="なし">なし</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </td></tr>
    );

    // Category rows — each category gets a header row; each order gets its own row
    const ALWAYS_SHOW_TYPES = ["drip_main","med","lab","family_call"];
    if (isE) {
      (patCats[p.id] || DEFAULT_CATS).forEach(cat => {
        const items = po.filter(o => o.type === cat.type);
        const isAlways = ALWAYS_SHOW_TYPES.includes(cat.type);
        if (items.length === 0 && !isAlways) return;

        // Category header row (label + add button)
        rows.push(
          <tr key={p.id+"_ch_"+cat.type} style={{background:"#F8FAFC"}}>
            <td style={{padding:"2px 4px 2px 22px",borderBottom:"1px solid #F1F5F9",borderRight:"1px solid #E2E8F0"}}>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <span style={{fontSize:9}}>{cat.icon}</span>
                <span style={{fontWeight:700,fontSize:8,color:"#475569"}}>{cat.label}</span>
                {cat.type === "culture" ? (
                  <div style={{display:"flex",gap:2,marginLeft:"auto"}}>
                    {["血液","尿","痰"].map(sp => (
                      <button key={sp} onClick={() => addCultureOrd(p.id, sp)}
                        style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,fontSize:7,padding:"0 4px",cursor:"pointer",color:c.dt,fontWeight:700}}>+{sp}</button>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => addOrd(p.id, cat.type)} style={{border:"none",background:"transparent",color:c.dt,fontSize:8,cursor:"pointer",padding:"0 2px",fontWeight:700,marginLeft:"auto"}}>＋</button>
                )}
                {!isAlways && (
                  <button onClick={() => setPatCats(pr => ({...pr,[p.id]:(pr[p.id]||DEFAULT_CATS).filter(x => x.type !== cat.type)}))}
                    style={{border:"none",background:"transparent",color:"#D1D5DB",fontSize:7,cursor:"pointer",padding:0}}>✕</button>
                )}
              </div>
            </td>
            {wk.map((_,di) => <td key={di} style={{padding:0,borderBottom:"1px solid #F1F5F9",borderLeft:"1px solid #F1F5F9",background:isTd(wk[di])?"#EFF6FF20":"transparent"}}/>)}
          </tr>
        );

        // One row per order item
        items.forEach(it => {
          const isCul = cat.type === "culture" || cat.type?.startsWith("culture_");
          const isNewCul = cat.type === "culture" && it.specimen;
          const isImg = cat.type === "img";
          const specimenLabel = it.specimen || (cat.type === "culture_blood" ? "血液" : cat.type === "culture_urine" ? "尿" : null);
          const hasGram = specimenLabel === "尿" || specimenLabel === "痰";
          rows.push(
            <tr key={p.id+"_ord_"+it.id} style={{background:"#fff"}}>
              <td style={{padding:"1px 2px 1px 30px",borderBottom:"1px solid #F1F5F9",borderRight:"1px solid #E2E8F0",verticalAlign:"middle"}}>
                <div style={{display:"flex",alignItems:"center",gap:2,flexWrap:"wrap"}}>
                  {isCul ? (
                    <>
                      <span style={{fontSize:7,fontWeight:700,color:"#475569",flexShrink:0}}>{specimenLabel||"培養"}</span>
                      {hasGram && (
                        <input value={it.gramResult||""} onChange={e => updGram(p.id, it.id, e.target.value)}
                          placeholder="G染色…" style={{...ip,fontSize:7,flex:1,width:"auto",minWidth:36,borderBottom:"1px solid #E2E8F0"}}/>
                      )}
                      {!it.resultDate && <button onClick={() => markCulDone(p.id, it.id)} style={{border:"none",background:"#FEF3C7",color:"#92400E",borderRadius:2,fontSize:6,fontWeight:700,padding:"0 3px",cursor:"pointer",flexShrink:0}}>未</button>}
                      {it.resultDate && <span style={{fontSize:6,color:"#22C55E",fontWeight:700,flexShrink:0}}>✓済</span>}
                    </>
                  ) : (
                    <input value={it.name} onChange={e => updNm(p.id, it.id, e.target.value)} placeholder="名称を入力" style={{...ip,fontSize:7,fontWeight:500,flex:1,width:"auto",minWidth:30}}/>
                  )}
                  {isImg && !it.reportConfirmed && <button onClick={() => markImgDone(p.id, it.id)} style={{border:"none",background:"#DBEAFE",color:"#1E40AF",borderRadius:2,fontSize:6,fontWeight:700,padding:"0 3px",cursor:"pointer"}}>レポ未</button>}
                  {isImg && it.reportConfirmed && <span style={{fontSize:6,color:"#22C55E",fontWeight:700}}>✓済</span>}
                  <button onClick={() => rmOrd(p.id, it.id)} style={{border:"none",background:"transparent",color:"#D1D5DB",cursor:"pointer",fontSize:7,padding:0}}>✕</button>
                </div>
              </td>
              {wk.map((d, di) => {
                const ds = fD(d), t = isTd(d);
                return (
                  <td key={di} style={{padding:"1px 0",borderBottom:"1px solid #F1F5F9",borderLeft:"1px solid #F1F5F9",background:t?"#EFF6FF20":"transparent",verticalAlign:"middle"}}>
                    {(cat.isBar && cat.type !== "drip_main" && cat.type !== "med") ? (() => {
                      if (!it.name) return <div style={{height:12}}/>;
                      const on = it.startDate && it.endDate && bSp(it.startDate, it.endDate, ds);
                      const iS = it.startDate === ds, iE = it.endDate === ds;
                      const dn = on && cat.showDay ? dB(it.startDate, ds) : null;
                      return (
                        <div onClick={() => extBar(p.id, it.id, ds)} style={{cursor:"pointer",height:cat.showDay?16:12}}>
                          {on ? (
                            <div style={{height:"100%",background:cat.type==="abx"?"#FDE68A":c.bar,margin:"0 -1px",
                              borderRadius:(iS?"5px ":"0 ")+(iE?"5px ":"0 ")+(iE?"5px ":"0 ")+(iS?"5px":"0"),
                              borderLeft:iS?"3px solid "+(cat.type==="abx"?"#D97706":c.dt):"none",
                              borderRight:iE?"3px solid "+(cat.type==="abx"?"#D97706":c.dt):"none",
                              display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:"0 2px"}}>
                              {dn && <span style={{fontSize:7,fontWeight:800,color:cat.type==="abx"?"#92400E":c.tx}}>{dn}</span>}
                            </div>
                          ) : <div style={{height:"100%",borderBottom:"1px dashed #E2E8F0"}}/>}
                        </div>
                      );
                    })() : (() => {
                      const hd2 = it.dates?.includes(ds);
                      let cd = null;
                      if (cat.showDay && it.dates?.[0]) {
                        const a = pMD(it.dates[0]), r = it.resultDate ? pMD(it.resultDate) : null, td = pMD(ds);
                        if (a && td && td >= a && (!r || td <= r)) cd = dB(it.dates[0], ds);
                      }
                      const isR = it.resultDate === ds;
                      const imgOk = cat.type === "img" && it.reportConfirmed;
                      return (
                        <div onClick={() => togDot(p.id, it.id, ds)}
                          style={{cursor:"pointer",height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {hd2 ? <div style={{width:12,height:12,borderRadius:"50%",background:imgOk?"#22C55E":c.dt,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {cd && <span style={{fontSize:5,color:"white",fontWeight:800}}>{cd}</span>}
                            {imgOk && <span style={{fontSize:5,color:"white",fontWeight:800}}>✓</span>}
                          </div>
                          : isR ? <div style={{width:12,height:12,borderRadius:"50%",background:"#22C55E",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,color:"white",fontWeight:800}}>✓</span></div>
                          : cd ? <div style={{width:10,height:10,borderRadius:"50%",border:"2px dotted "+c.bar,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:5,color:c.tx,fontWeight:700}}>{cd}</span></div>
                          : <div style={{width:8,height:8,borderRadius:"50%",border:"1px dashed #CBD5E1"}}/>}
                        </div>
                      );
                    })()}
                  </td>
                );
              })}
            </tr>
          );
        });
      });

      // Routine labs
      rows.push(
        <tr key={p.id+"_rl"} style={{background:"#F8FAFC"}}>
          <td colSpan={8} style={{padding:"3px 6px 4px 22px",borderBottom:"2px solid "+c.bd+"40"}}>
            <div onClick={() => setRlOpen(pr => ({...pr,[p.id]:!pr[p.id]}))}
              style={{fontSize:8,fontWeight:700,color:"#6D28D9",marginBottom:2,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
              <Ch open={rlOpen[p.id]}/><span>📋 ルーチン検査</span>
              {tsat != null && <span style={{fontWeight:400,color:"#64748B"}}> TSAT:<b style={{color:tsat<20?"#DC2626":"#334155"}}>{tsat}%</b></span>}
              {rpi != null && <span style={{fontWeight:400,color:"#64748B"}}> RPI:<b style={{color:rpi<2?"#DC2626":"#334155"}}>{rpi}</b></span>}
            </div>
            {rlOpen[p.id] && (
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {R_LABS.map(lb => {
                  const v = rl[lb.id] || {done:false,value:""};
                  return (
                    <div key={lb.id} style={{display:"flex",alignItems:"center",gap:2,padding:"1px 3px",borderRadius:3,background:v.done?"#DCFCE7":"white",border:"1px solid "+(v.done?"#86EFAC":"#E2E8F0")}}>
                      <div onClick={() => setRLabs(pr => ({...pr,[p.id]:{...pr[p.id],[lb.id]:{...v,done:!v.done}}}))} style={ck(v.done,c.dt,9)}>{v.done && <Tk s={4}/>}</div>
                      <span style={{fontSize:7,color:"#64748B",fontWeight:600}}>{lb.l}</span>
                      <input value={v.value||""} onChange={e => setRLabs(pr => ({...pr,[p.id]:{...pr[p.id],[lb.id]:{...v,value:e.target.value}}}))} placeholder="—" style={{...ip,fontSize:7,width:24,textAlign:"center"}}/>
                    </div>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      );
    }
    return rows;
  };

  // Mobile vitals toggle helpers
  const vStatus = pid => (curVitals[pid]||{}).status || null;
  const setVStatus = (pid, st) => setVitals(pr => ({...pr, [pid]: {...(pr[pid]||{}), status: st === vStatus(pid) ? null : st, memo: st === "flag" ? (pr[pid]?.memo||"") : ""}}));

  return (
    <div style={{width:"100%",height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif",background:"#F1F5F9",color:"#1E293B"}}>
      {/* Header */}
      <header style={{display:"flex",alignItems:"center",gap:10,padding:"0 14px",height:48,background:"white",borderBottom:"1px solid #E2E8F0",flexShrink:0}}>
        <span style={{fontSize:18,width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>🏥</span>
        <div style={{fontSize:15,fontWeight:800,flexShrink:0}}>病棟管理</div>
        <div style={{flex:1}}/>
        {/* Doctor filter toggle */}
        <div style={{position:"relative"}}>
          <button onClick={() => setShowDrFilter(v => !v)}
            style={{border:"1px solid "+(filterDoctor!=="all"?"#3B82F6":"#E2E8F0"),background:filterDoctor!=="all"?"#EFF6FF":"#F8FAFC",borderRadius:20,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",color:filterDoctor!=="all"?"#1D4ED8":"#64748B",display:"flex",alignItems:"center",gap:4}}>
            👨‍⚕️ {filterDoctor==="all"?"Dr▾":"Dr:"+filterDoctor+" ▾"}
          </button>
          {showDrFilter && (
            <div style={{position:"absolute",top:"110%",right:0,zIndex:200,background:"white",border:"1px solid #E2E8F0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",padding:6,minWidth:140}}>
              {["all",...doctors].map(d => (
                <button key={d} onClick={() => { setFilterDoctor(d); setShowDrFilter(false); }}
                  style={{display:"block",width:"100%",textAlign:"left",border:"none",background:filterDoctor===d?"#EFF6FF":"transparent",borderRadius:6,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",color:filterDoctor===d?"#1D4ED8":"#334155"}}>
                  {d==="all"?"👥 全員":d+" Dr"}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setPatModal({})} style={{border:"none",background:"#3B82F6",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",flexShrink:0}}>＋患者</button>
      </header>

      {/* Tab bar (desktop only) */}
      {!isMobile && <div style={{display:"flex",background:"white",borderBottom:"2px solid #E2E8F0",flexShrink:0}}>
        {[["schedule","📋","予定表"],["todo","✅","今日"]].map(([v,ic,l]) => (
          <button key={v} onClick={() => setPanel(v)}
            style={{flex:1,border:"none",borderBottom:panel===v?"3px solid #3B82F6":"3px solid transparent",background:"transparent",padding:"10px 0 8px",fontSize:12,fontWeight:700,cursor:"pointer",color:panel===v?"#3B82F6":"#94A3B8",display:"flex",flexDirection:"column",alignItems:"center",gap:1,transition:"color 0.15s"}}>
            <span style={{fontSize:18}}>{ic}</span>
            <span>{l}</span>
          </button>
        ))}
      </div>}

      {/* Main panels */}
      <div style={{flex:1,display:"flex",overflow:"hidden",gap:isMobile?0:8,padding:isMobile?0:8}}>

        {/* ===== MOBILE LAYOUT ===== */}
        {isMobile && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Mobile tab content */}
            <div style={{flex:1,overflow:"auto"}}>

              {/* Tab: 予定表 */}
              {mobileTab === "schedule" && (
                <div style={{background:"white",minHeight:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",borderBottom:"1px solid #E5E7EB"}}>
                    <h2 style={{margin:0,fontSize:13,fontWeight:700}}>📋 週間予定表</h2>
                    <span style={{fontSize:10,color:"#94A3B8"}}>{fD(wk[0])}〜{fD(wk[6])}</span>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",minWidth:480}}>
                      <colgroup><col style={{width:120}}/>{wk.map((_,i) => <col key={i} style={{width:44}}/>)}</colgroup>
                      <thead><tr>
                        <th style={{position:"sticky",top:0,zIndex:5,padding:"5px 6px",background:"#F8FAFC",borderBottom:"2px solid #E2E8F0",fontSize:9,color:"#64748B",fontWeight:600,textAlign:"left"}}>患者/オーダー</th>
                        {wk.map((d, i) => { const t = isTd(d); return (
                          <th key={i} onClick={() => { setSelDate(d); setMobileTab("todo"); }}
                            style={{position:"sticky",top:0,zIndex:5,padding:"3px 2px",background:t?"#EFF6FF":"#F8FAFC",borderBottom:t?"2px solid #3B82F6":"2px solid #E2E8F0",cursor:"pointer",textAlign:"center"}}>
                            <div style={{fontSize:8,color:t?"#3B82F6":"#94A3B8",fontWeight:600}}>{DOW[d.getDay()]}</div>
                            <div style={{fontSize:13,fontWeight:700,color:t?"#3B82F6":"#475569"}}>{d.getDate()}</div>
                          </th>
                        ); })}
                      </tr></thead>
                      <tbody>{filteredPats.map(p => renderGanttPatient(p))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: 今日のTODO (mobile patient cards) */}
              {mobileTab === "todo" && (
                <div style={{padding:10,paddingBottom:72}}>
                  {/* Date nav */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d); }}
                      style={{border:"1px solid #E2E8F0",background:"white",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
                    <div style={{flex:1,textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:800}}>{selDate.getMonth()+1}月{selDate.getDate()}日（{DOW[selDate.getDay()]}）</div>
                      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:2}}>
                        {isPast && <span style={{fontSize:10,background:"#FEE2E2",color:"#DC2626",padding:"1px 8px",borderRadius:4,fontWeight:700}}>過去</span>}
                        {isFuture && <span style={{fontSize:10,background:"#DBEAFE",color:"#1E40AF",padding:"1px 8px",borderRadius:4,fontWeight:700}}>予定</span>}
                        {!isPast && !isFuture && <span style={{fontSize:10,background:"#DCFCE7",color:"#166534",padding:"1px 8px",borderRadius:4,fontWeight:700}}>本日</span>}
                        <button onClick={() => setSelDate(new Date())} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,padding:"1px 8px",fontSize:10,color:"#64748B",cursor:"pointer"}}>今日</button>
                      </div>
                    </div>
                    <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()+1); setSelDate(d); }}
                      style={{border:"1px solid #E2E8F0",background:"white",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
                  </div>

                  {/* Priority bar */}
                  {priList.length > 0 && (
                    <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"8px 12px",marginBottom:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#D97706",marginBottom:4}}>🚨 優先順位</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {priList.map(it => { const cl = it.patient ? COL[it.patient.color] : null; return (
                          <div key={it.key} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:cl?.bg,color:cl?.tx,border:"1px solid "+(cl?.bd||"#E2E8F0")}}>
                            <span style={{width:16,height:16,borderRadius:4,background:"#D97706",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{it.priority}</span>
                            {it.icon} {it.patient?.name.split(" ")[0]}: {it.label||it.text}
                          </div>
                        ); })}
                      </div>
                    </div>
                  )}

                  {/* Patient cards */}
                  {filteredPats.map(p => {
                    const c = COL[p.color];
                    const v = curVitals[p.id] || {status:null,memo:""};
                    const k = curKarte[p.id] || {checked:false,memo:""};
                    const amTasks = Array.from({length:AM}, (_,ri) => ({key:"am"+ri+"_"+p.id, cell:amC["am"+ri+"_"+p.id]||emptyCell()})).filter(x => x.cell.presetId);
                    const pmTasks = Array.from({length:PM_R}, (_,ri) => ({key:"pm"+ri+"_"+p.id, cell:pmC["pm"+ri+"_"+p.id]||emptyCell()})).filter(x => x.cell.presetId);
                    const pc = pendingConfirms[p.id]||[];
                    const dayNum = p.admissionDate ? dB(p.admissionDate, selDateStr) : null;
                    return (
                      <div key={p.id} style={{background:"white",borderRadius:14,marginBottom:12,border:"2px solid "+c.bd,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                        {/* Card header */}
                        <div style={{background:c.hd,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div>
                            <span style={{fontSize:16,fontWeight:800,color:"white"}}>{p.name}</span>
                            <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",marginLeft:8}}>{p.room}{p.doctor?" · "+p.doctor+"Dr":""}</span>
                            {dayNum != null && <span style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginLeft:6}}>入院{dayNum}日目</span>}
                          </div>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.75)",maxWidth:100,textAlign:"right",lineHeight:1.3}}>{p.diagnosis}</span>
                        </div>

                        {/* Vitals */}
                        <div style={{padding:"10px 14px",borderBottom:"1px solid #F1F5F9"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:6}}>♡ バイタル</div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={() => setVStatus(p.id, "ok")}
                              style={{flex:1,padding:"9px 0",borderRadius:8,border:"2px solid "+(v.status==="ok"?"#22C55E":"#E2E8F0"),
                                background:v.status==="ok"?"#DCFCE7":"#F8FAFC",
                                color:v.status==="ok"?"#166534":"#94A3B8",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                              ✓ 異常なし
                            </button>
                            <button onClick={() => setVStatus(p.id, "flag")}
                              style={{flex:1,padding:"9px 0",borderRadius:8,border:"2px solid "+(v.status==="flag"?"#EF4444":"#E2E8F0"),
                                background:v.status==="flag"?"#FEE2E2":"#F8FAFC",
                                color:v.status==="flag"?"#DC2626":"#94A3B8",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                              ⚠ 所見あり
                            </button>
                          </div>
                          {v.status === "flag" && (
                            <textarea value={v.memo||""} onChange={e => setVitals(pr => ({...pr,[p.id]:{...pr[p.id],memo:e.target.value}}))}
                              placeholder="所見を記入..." rows={2}
                              style={{width:"100%",marginTop:8,fontSize:13,border:"1px solid #FCA5A5",borderRadius:8,padding:"8px 10px",resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                          )}
                        </div>

                        {/* AM tasks */}
                        <div style={{padding:"8px 14px",borderBottom:"1px solid #F1F5F9"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#3B82F6",marginBottom:4}}>AM</div>
                          {amTasks.map(({key, cell}) => (
                            <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",opacity:cell.checked?0.45:1}}>
                              <div onClick={() => compT(key)} style={ck(cell.checked,c.dt,22)}>{cell.checked && <Tk s={13}/>}</div>
                              {cell.type === "free"
                                ? <input value={cell.text||""} onChange={e => setAmC(prev => ({...prev,[key]:{...prev[key]||emptyCell(),text:e.target.value}}))}
                                    placeholder="メモ..." style={{fontSize:14,flex:1,border:"none",outline:"none",background:"transparent",fontFamily:"inherit",textDecoration:cell.checked?"line-through":"none"}}/>
                                : <span style={{fontSize:14,flex:1,textDecoration:cell.checked?"line-through":"none"}}>{cell.icon} {cell.label||cell.text}</span>
                              }
                              <button onClick={() => setAmC(prev => ({...prev,[key]:emptyCell()}))} style={{border:"none",background:"transparent",color:"#CBD5E1",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
                            </div>
                          ))}
                          {amTasks.length < AM && (
                            <div>
                              <button onClick={() => setShowAddAM(prev => ({...prev,[p.id]:!prev[p.id]}))}
                                style={{border:"1px dashed #CBD5E1",background:"transparent",borderRadius:16,padding:"4px 12px",fontSize:12,color:"#94A3B8",cursor:"pointer",marginTop:2}}>
                                {showAddAM[p.id] ? "▲ 閉じる" : "＋ 追加"}
                              </button>
                              {showAddAM[p.id] && (
                                <div style={{marginTop:4}}>
                                  {PRESETS.map((pr2) => (
                                    <button key={pr2.id} onClick={() => {
                                      const slot = Array.from({length:AM},(_,ri)=>ri).find(ri => !(amC["am"+ri+"_"+p.id]||{}).presetId);
                                      if (slot == null) return;
                                      const key2 = "am"+slot+"_"+p.id;
                                      const newCell = {...emptyCell(),presetId:pr2.id,icon:pr2.icon,label:pr2.label,type:pr2.type};
                                      setAmC(prev => ({...prev,[key2]:newCell}));
                                      syncTaskToOrder(p.id, newCell, emptyCell());
                                      setShowAddAM(prev => ({...prev,[p.id]:false}));
                                    }} style={{display:"inline-flex",alignItems:"center",gap:4,margin:"2px",padding:"5px 10px",borderRadius:16,border:"1px solid #E2E8F0",background:"#F8FAFC",fontSize:12,color:"#475569",cursor:"pointer"}}>
                                      {pr2.icon} {pr2.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* PM tasks */}
                        <div style={{padding:"8px 14px",borderBottom:"1px solid #F1F5F9"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#8B5CF6",marginBottom:4}}>PM</div>
                          {pmTasks.map(({key, cell}) => (
                            <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",opacity:cell.checked?0.45:1}}>
                              <div onClick={() => compT(key)} style={ck(cell.checked,c.dt,22)}>{cell.checked && <Tk s={13}/>}</div>
                              {cell.type === "free"
                                ? <input value={cell.text||""} onChange={e => setPmC(prev => ({...prev,[key]:{...prev[key]||emptyCell(),text:e.target.value}}))}
                                    placeholder="メモ..." style={{fontSize:14,flex:1,border:"none",outline:"none",background:"transparent",fontFamily:"inherit",textDecoration:cell.checked?"line-through":"none"}}/>
                                : <span style={{fontSize:14,flex:1,textDecoration:cell.checked?"line-through":"none"}}>{cell.icon} {cell.label||cell.text}</span>
                              }
                              <button onClick={() => setPmC(prev => ({...prev,[key]:emptyCell()}))} style={{border:"none",background:"transparent",color:"#CBD5E1",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
                            </div>
                          ))}
                          {pmTasks.length < PM_R && (
                            <div>
                              <button onClick={() => setShowAddPM(prev => ({...prev,[p.id]:!prev[p.id]}))}
                                style={{border:"1px dashed #CBD5E1",background:"transparent",borderRadius:16,padding:"4px 12px",fontSize:12,color:"#94A3B8",cursor:"pointer",marginTop:2}}>
                                {showAddPM[p.id] ? "▲ 閉じる" : "＋ 追加"}
                              </button>
                              {showAddPM[p.id] && <div style={{marginTop:4}}>
                              {PRESETS.map((pr2) => (
                                <button key={pr2.id} onClick={() => {
                                  const slot = Array.from({length:PM_R},(_,ri)=>ri).find(ri => !(pmC["pm"+ri+"_"+p.id]||{}).presetId);
                                  if (slot == null) return;
                                  const key2 = "pm"+slot+"_"+p.id;
                                  const newCell = {...emptyCell(),presetId:pr2.id,icon:pr2.icon,label:pr2.label,type:pr2.type};
                                  setPmC(prev => ({...prev,[key2]:newCell}));
                                  setShowAddPM(prev => ({...prev,[p.id]:false}));
                                }} style={{display:"inline-flex",alignItems:"center",gap:4,margin:"2px",padding:"5px 10px",borderRadius:16,border:"1px solid #E2E8F0",background:"#F8FAFC",fontSize:12,color:"#475569",cursor:"pointer"}}>
                                  {pr2.icon} {pr2.label}
                                </button>
                              ))}
                            </div>}
                            </div>
                          )}
                        </div>

                        {/* Pending confirms */}
                        {pc.length > 0 && (
                          <div style={{padding:"8px 14px",borderBottom:"1px solid #F1F5F9",background:"#FFF7ED"}}>
                            <div style={{fontSize:11,fontWeight:700,color:"#C2410C",marginBottom:4}}>🔍 結果確認</div>
                            {pc.map(cu => (
                              <div key={cu.orderId} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:14}}>{cu.icon}</span>
                                <span style={{fontSize:13,fontWeight:600,color:"#C2410C",flex:1}}>{cu.name}{cu.day?" Day"+cu.day:""}</span>
                                <button onClick={() => cu.type==="culture"?markCulDone(p.id,cu.orderId):markImgDone(p.id,cu.orderId)}
                                  style={{border:"1px solid #22C55E",background:"#F0FDF4",borderRadius:6,fontSize:12,color:"#166534",fontWeight:700,cursor:"pointer",padding:"4px 10px"}}>済み</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Order checklist */}
                        {(() => {
                          const po = orders[p.id]||[], sd = pMD(selDateStr);
                          const onToday2 = o => o.dates?.some(d => d === selDateStr);
                          const notExpAbx2 = o => { if (!o.endDate) return true; const ed = pMD(o.endDate); return ed && sd && ed >= sd; };
                          const drips = po.filter(o => o.type === "drip_main" && o.name && onToday2(o));
                          const meds = po.filter(o => o.type === "med" && o.name && onToday2(o));
                          const abxs = po.filter(o => o.type === "abx" && o.name && notExpAbx2(o));
                          const labs = po.filter(o => o.type === "lab" && o.dates?.some(d => { const dd = pMD(d); return dd && sd && dd >= sd; }));
                          if (drips.length === 0 && meds.length === 0 && abxs.length === 0 && labs.length === 0) return null;
                          return (
                            <div style={{padding:"8px 14px",borderBottom:"1px solid #F1F5F9",background:"#FFFBEB"}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:4}}>📋 オーダー確認</div>
                              {drips.map(o => <div key={o.id} style={{fontSize:13,color:"#334155",marginBottom:2}}>💉 {o.name}</div>)}
                              {meds.map(o => <div key={o.id} style={{fontSize:13,color:"#334155",marginBottom:2}}>💊 {o.name}</div>)}
                              {abxs.map(o => <div key={o.id} style={{fontSize:13,color:"#334155",marginBottom:2}}>🦠 {o.name} <span style={{color:"#C2410C",fontWeight:700}}>〜{addDw(o.endDate)}</span></div>)}
                              {labs.map(o => <div key={o.id} style={{fontSize:13,color:"#334155",marginBottom:2}}>🩸 {o.name} <span style={{color:"#0369A1",fontWeight:700}}>{(o.dates||[]).filter(d => { const dd = pMD(d); return dd && sd && dd >= sd; }).map(d => addDw(d)).join(", ")}</span></div>)}
                            </div>
                          );
                        })()}

                        {/* Karte */}
                        <div style={{padding:"10px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <div onClick={() => setKarte(pr => ({...pr,[p.id]:{...pr[p.id],checked:!k.checked}}))} style={ck(k.checked,c.dt,22)}>
                              {k.checked && <Tk s={13}/>}
                            </div>
                            <span style={{fontSize:13,fontWeight:700,color:k.checked?"#22C55E":"#0369A1"}}>📝 カルテ記録</span>
                          </div>
                          <textarea value={k.memo} onChange={e => setKarte(pr => ({...pr,[p.id]:{...pr[p.id],memo:e.target.value}}))}
                            placeholder="メモ..." rows={2}
                            style={{width:"100%",fontSize:13,border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",resize:"vertical",fontFamily:"inherit",outline:"none",background:"#FAFBFC",boxSizing:"border-box"}}/>
                        </div>
                      </div>
                    );
                  })}

                  {/* Consults (mobile) */}
                  <div style={{background:"white",borderRadius:14,marginBottom:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#FFF7ED",borderBottom:"1px solid #FED7AA"}}>
                      <span style={{fontSize:16}}>👨‍⚕️</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#C2410C"}}>上級医に相談</span>
                    </div>
                    {filteredPats.map(p => { const cl = COL[p.color]; const its = consults[p.id]||[]; return (
                      <div key={p.id} style={{padding:"8px 14px",borderBottom:"1px solid #F1F5F9"}}>
                        <div style={{fontSize:11,fontWeight:700,color:cl.tx,marginBottom:4}}>{p.name.split(" ")[0]}</div>
                        {its.map(it => (
                          <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <div onClick={() => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,checked:!x.checked}:x)}))} style={ck(it.checked,cl.dt,20)}>{it.checked && <Tk s={12}/>}</div>
                            <div onClick={() => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,urgent:!x.urgent}:x)}))}
                              style={{width:18,height:18,borderRadius:"50%",border:it.urgent?"2px solid #DC2626":"2px solid #E2E8F0",background:it.urgent?"#DC2626":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",fontWeight:800,flexShrink:0}}>
                              {it.urgent && "!"}
                            </div>
                            <input value={it.text} onChange={e => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,text:e.target.value}:x)}))}
                              placeholder="相談事項..." style={{...ip,fontSize:14,flex:1,width:"auto"}}/>
                          </div>
                        ))}
                        <button onClick={() => setConsults(pr => ({...pr,[p.id]:[...(pr[p.id]||[]),{id:Date.now(),text:"",checked:false,urgent:false}]}))}
                          style={{border:"none",background:"transparent",color:cl.dt,fontSize:12,cursor:"pointer",padding:0,fontWeight:700}}>＋追加</button>
                      </div>
                    ); })}
                  </div>
                </div>
              )}

              {/* Tab: 患者一覧 */}
              {mobileTab === "patients" && (
                <div style={{padding:10,paddingBottom:72}}>
                  {filteredPats.map(p => {
                    const c = COL[p.color], po = orders[p.id]||[], isE = expP[p.id];
                    const cv = cCr(p.age, p.weight, p.cr, p.sex === "F");
                    return (
                      <div key={p.id} style={{background:"white",borderRadius:14,marginBottom:10,border:"2px solid "+c.bd,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                        <div style={{display:"flex",alignItems:"center",padding:"10px 14px",background:c.bg+"80",cursor:"pointer"}} onClick={() => setExpP(pr => ({...pr,[p.id]:!pr[p.id]}))}>
                          <Ch open={isE}/>
                          <span style={{width:8,height:8,borderRadius:"50%",background:c.dt,margin:"0 8px"}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,fontWeight:800,color:c.tx}}>{p.name}</div>
                            <div style={{fontSize:11,color:"#64748B"}}>{p.room} {p.doctor && "· "+p.doctor+"Dr"} · {p.diagnosis}</div>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={e=>{e.stopPropagation();setPatModal({edit:p});}} style={{border:"none",background:"transparent",color:"#94A3B8",fontSize:14,cursor:"pointer",padding:4}}>✎</button>
                            <button onClick={e=>{e.stopPropagation();if(window.confirm(p.name+"さんを退院にしますか？"))dischargePat(p.id);}}
                              style={{border:"none",background:"transparent",color:"#F87171",fontSize:12,cursor:"pointer",padding:4}}>退院</button>
                          </div>
                        </div>
                        {isE && (
                          <div style={{padding:"10px 14px",fontSize:12,color:"#475569",display:"flex",flexDirection:"column",gap:4}}>
                            <div>年齢: {p.age}{p.sex==="F"?"♀":"♂"} | 入院: {p.admitDate}{p.dischargePlan && " → 退院予定: "+p.dischargePlan}</div>
                            <div>CCr: <b style={{color:cv&&cv<30?"#DC2626":"#334155"}}>{cv||"—"}</b> | Wt: {p.weight}kg | Cr: {p.cr}</div>
                            {p.family && <div>家族: {p.family} | 介護: {p.careLevel}</div>}
                            {p.lastFamilyCall && <div>最終TEL: <b style={{color:"#0369A1"}}>{p.lastFamilyCall}</b></div>}
                            {po.length > 0 && (
                              <div style={{marginTop:4,paddingTop:6,borderTop:"1px solid #E2E8F0"}}>
                                {po.filter(o => o.type==="abx"||o.type==="drip_main"||o.type==="med").filter(o=>{if(o.type==="abx"){const ed=pMD(o.endDate);return!ed||ed>=pMD(today);}return(o.dates||[]).length>0;}).map(o => (
                                  <div key={o.id} style={{fontSize:11}}>{o.type==="abx"?"🦠":o.type==="drip_main"?"💉":"💊"} {o.name} {o.type==="abx"&&o.endDate&&<b style={{color:"#C2410C"}}>〜{o.endDate}</b>}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Study list */}
                  <div style={{background:"white",borderRadius:14,padding:"10px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#6D28D9"}}>📚 勉強リスト</span>
                      <button onClick={() => setStudyList(pr => [...pr,{id:Date.now(),text:"",checked:false}])}
                        style={{border:"none",background:"#A78BFA",color:"white",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700,cursor:"pointer"}}>＋</button>
                    </div>
                    {studyList.map(it => (
                      <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                        <div onClick={() => setStudyList(pr => pr.map(x => x.id===it.id?{...x,checked:!x.checked}:x))} style={ck(it.checked,"#8B5CF6",20)}>{it.checked && <Tk s={12}/>}</div>
                        <input value={it.text} onChange={e => setStudyList(pr => pr.map(x => x.id===it.id?{...x,text:e.target.value}:x))}
                          placeholder="テーマ..." style={{...ip,fontSize:14,flex:1,textDecoration:it.checked?"line-through":"none",opacity:it.checked?0.4:1,width:"auto"}}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom navigation */}
            <div style={{height:60,flexShrink:0,background:"white",borderTop:"1px solid #E2E8F0",display:"flex",boxShadow:"0 -2px 10px rgba(0,0,0,0.06)"}}>
              {[["schedule","📋","予定表"],["todo","✅","今日"],["patients","👤","患者"]].map(([tab,icon,label]) => (
                <button key={tab} onClick={() => setMobileTab(tab)} style={{flex:1,border:"none",background:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,cursor:"pointer",
                  color:mobileTab===tab?"#3B82F6":"#94A3B8"}}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <span style={{fontSize:10,fontWeight:mobileTab===tab?700:400}}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== DESKTOP LAYOUT ===== */}
        {!isMobile && <>
        {/* LEFT: Schedule */}
        <div style={{flex:1,display:panel==="schedule"?"flex":"none",flexDirection:"column",background:"white",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #E5E7EB",flexShrink:0}}>
            <h2 style={{margin:0,fontSize:13,fontWeight:700}}>📋 週間予定表</h2>
            <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
              <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()-7); setSelDate(d); }} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
              <span style={{fontSize:10,color:"#64748B",fontWeight:600}}>{fD(wk[0])}〜{fD(wk[6])}</span>
              <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()+7); setSelDate(d); }} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
              <button onClick={() => setSelDate(new Date())} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,padding:"2px 6px",fontSize:9,color:"#64748B",cursor:"pointer"}}>今週</button>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
              <colgroup><col style={{width:148}}/>{wk.map((_,i) => <col key={i}/>)}</colgroup>
              <thead><tr>
                <th style={{position:"sticky",top:0,zIndex:5,padding:"5px 6px",background:"#F8FAFC",borderBottom:"2px solid #E2E8F0",fontSize:9,color:"#64748B",fontWeight:600,textAlign:"left"}}>患者/オーダー</th>
                {wk.map((d, i) => { const t = isTd(d); return (
                  <th key={i} onClick={() => setSelDate(d)} style={{position:"sticky",top:0,zIndex:5,padding:"3px 2px",background:t?"#EFF6FF":"#F8FAFC",borderBottom:t?"2px solid #3B82F6":"2px solid #E2E8F0",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:8,color:t?"#3B82F6":"#94A3B8",fontWeight:600}}>{DOW[d.getDay()]}</div>
                    <div style={{fontSize:13,fontWeight:700,color:t?"#3B82F6":"#475569"}}>{d.getDate()}</div>
                  </th>
                ); })}
              </tr></thead>
              <tbody>
                {filteredPats.map(p => renderGanttPatient(p))}
                {discharged.filter(p => p.followUp && wk.some(d => fD(d) === p.followUp)).map(p => (
                  <tr key={p.id+"_fu"} style={{background:"#F5F3FF"}}>
                    <td style={{padding:"4px 6px",borderBottom:"1px solid #DDD6FE",fontSize:9,color:"#6D28D9",fontWeight:700}}>
                      🏥 外来 {p.name.split(" ")[0]}（{p.diagnosis}）
                    </td>
                    {wk.map((d,i) => (
                      <td key={i} style={{padding:"2px 1px",borderBottom:"1px solid #DDD6FE",borderLeft:"1px solid #EDE9FE",textAlign:"center"}}>
                        {fD(d)===p.followUp && <div style={{fontSize:8,background:"#7C3AED",color:"white",borderRadius:3,padding:"1px 3px",fontWeight:700}}>外来</div>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Todo */}
        <div style={{flex:1,display:panel==="todo"?"flex":"none",flexDirection:"column",background:"white",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"8px 14px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={() => { const d = new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d); }}
                style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
              <h2 style={{margin:0,fontSize:13,fontWeight:700}}>{selDate.getMonth()+1}月{selDate.getDate()}日（{DOW[selDate.getDay()]}）</h2>
              <button onClick={() => { const d = new Date(selDate); d.setDate(d.getDate()+1); setSelDate(d); }}
                style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
              {isPast && <span style={{fontSize:8,background:"#FEE2E2",color:"#DC2626",padding:"1px 6px",borderRadius:4,fontWeight:700}}>過去</span>}
              {isFuture && <span style={{fontSize:8,background:"#DBEAFE",color:"#1E40AF",padding:"1px 6px",borderRadius:4,fontWeight:700}}>予定</span>}
              {!isPast && !isFuture && <span style={{fontSize:8,background:"#DCFCE7",color:"#166534",padding:"1px 6px",borderRadius:4,fontWeight:700}}>本日</span>}
            </div>
            <button onClick={() => setSelDate(new Date())} style={{border:"1px solid #E2E8F0",background:"white",borderRadius:4,padding:"2px 8px",fontSize:8,color:"#64748B",cursor:"pointer",fontWeight:600}}>今日に戻る</button>
          </div>

          {/* Follow-up alert */}
          {discharged.filter(p => p.followUp === selDateStr).map(p => (
            <div key={p.id} style={{padding:"5px 12px",background:"#F5F3FF",borderBottom:"1px solid #DDD6FE",fontSize:10,color:"#6D28D9",fontWeight:700,flexShrink:0}}>
              🏥 外来フォロー: {p.name}（{p.diagnosis}）
            </div>
          ))}

          {/* Priority bar */}
          {priList.length > 0 && (
            <div style={{padding:"4px 12px 5px",background:"#FFFBEB",borderBottom:"1px solid #FDE68A",flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:"#D97706",marginBottom:2}}>🚨 優先順位</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {priList.map(it => { const cl = it.patient ? COL[it.patient.color] : null; return (
                  <div key={it.key} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 5px",borderRadius:4,fontSize:9,fontWeight:600,background:cl?.bg,color:cl?.tx,border:"1px solid "+(cl?.bd||"#E2E8F0")}}>
                    <span style={{width:13,height:13,borderRadius:3,background:"#D97706",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800}}>{it.priority}</span>
                    {it.icon} {it.patient?.name.split(" ")[0]}: {it.label||it.text}
                  </div>
                ); })}
              </div>
            </div>
          )}

          {/* Urgent bar */}
          {urgList.length > 0 && (
            <div style={{padding:"4px 12px 5px",background:"#FEE2E2",borderBottom:"1px solid #FECACA",flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:"#DC2626",marginBottom:2}}>🔴 緊急相談</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {urgList.map((it, i) => <div key={i} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 5px",borderRadius:4,fontSize:9,fontWeight:600,background:"#FEE2E2",color:"#991B1B",border:"1px solid #FECACA"}}>{it.patient.name.split(" ")[0]}: {it.text}</div>)}
              </div>
            </div>
          )}

          <div style={{flex:1,overflow:"auto"}}>
            <table style={{borderCollapse:"collapse",tableLayout:"fixed",minWidth:28 + filteredPats.length * 80}}>
              <colgroup><col style={{width:28}}/>{filteredPats.map(p => <col key={p.id} style={{width:80}}/>)}</colgroup>
              <thead><tr>
                <th style={{position:"sticky",top:0,zIndex:3,background:"#F8FAFC",borderBottom:"2px solid #E2E8F0"}}/>
                {filteredPats.map(p => { const cl = COL[p.color]; return (
                  <th key={p.id} style={{position:"sticky",top:0,zIndex:3,padding:"4px 3px",background:cl.hd,borderBottom:"2px solid "+cl.hd,textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"white"}}>{p.name.split(" ")[0]}</div>
                    <div style={{fontSize:7,color:"rgba(255,255,255,0.7)"}}>{p.room}{p.doctor?" "+p.doctor[0]+"Dr":""}</div>
                  </th>
                ); })}
              </tr></thead>
              <tbody>
                {/* Vitals */}
                <tr style={{background:"#FFFDF7"}}>
                  <td style={{padding:"3px 2px",textAlign:"center",borderBottom:"2px solid #FDE68A",borderRight:"1px solid #E2E8F0",background:"#FFFBEB"}}><span style={{fontSize:11}}>♡</span></td>
                  {filteredPats.map(p => { const cl = COL[p.color]; const v = curVitals[p.id]||{status:null,memo:""}; return (
                    <td key={p.id} style={{padding:"3px 3px",borderBottom:"2px solid #FDE68A",borderLeft:"1px solid #F1F5F9",
                      background:v.status==="ok"?"#F0FDF4":v.status==="flag"?"#FEF2F2":"transparent",verticalAlign:"top"}}>
                      <div style={{display:"flex",gap:2,marginBottom:1}}>
                        <button onClick={() => setVStatus(p.id,"ok")}
                          style={{flex:1,border:"1px solid "+(v.status==="ok"?"#22C55E":"#E2E8F0"),borderRadius:3,background:v.status==="ok"?"#DCFCE7":"white",
                            color:v.status==="ok"?"#166534":"#94A3B8",fontSize:7,fontWeight:700,padding:"1px 0",cursor:"pointer"}}>✓ 正常</button>
                        <button onClick={() => setVStatus(p.id,"flag")}
                          style={{flex:1,border:"1px solid "+(v.status==="flag"?"#EF4444":"#E2E8F0"),borderRadius:3,background:v.status==="flag"?"#FEE2E2":"white",
                            color:v.status==="flag"?"#DC2626":"#94A3B8",fontSize:7,fontWeight:700,padding:"1px 0",cursor:"pointer"}}>⚠ 所見</button>
                      </div>
                      {v.status === "flag" && <input value={v.memo||""} onChange={e => setVitals(pr => ({...pr,[p.id]:{...pr[p.id],memo:e.target.value}}))}
                        placeholder="所見..." style={{...ip,fontSize:7,width:"100%",color:"#DC2626",fontWeight:600}}/>}
                    </td>
                  ); })}
                </tr>
                {tdRows("am", "#3B82F6", amC, setAmC, AM)}
                {tdRows("pm", "#8B5CF6", pmC, setPmC, PM_R)}

                {/* Pending culture/image */}
                {sortedPats.some(p => (pendingConfirms[p.id]||[]).length > 0) && (
                  <tr style={{background:"#FFF7ED"}}>
                    <td style={{padding:"2px",textAlign:"center",borderTop:"1px solid #FED7AA",borderBottom:"1px solid #FED7AA",borderRight:"1px solid #E2E8F0",background:"#FFF7ED"}}><span style={{fontSize:9}}>🔍</span></td>
                    {filteredPats.map(p => {
                      const pc = pendingConfirms[p.id]||[];
                      return (
                        <td key={p.id} style={{padding:"2px 3px",borderTop:"1px solid #FED7AA",borderBottom:"1px solid #FED7AA",borderLeft:"1px solid #F1F5F9",verticalAlign:"top",fontSize:8}}>
                          {pc.length === 0 ? <span style={{color:"#E2E8F0"}}>—</span> : pc.map(cu => (
                            <div key={cu.orderId} style={{display:"flex",alignItems:"center",gap:2,marginBottom:1}}>
                              <span style={{fontSize:9}}>{cu.icon}</span>
                              <span style={{fontWeight:600,color:"#C2410C",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cu.name}{cu.day?" Day"+cu.day:""}</span>
                              <button onClick={() => cu.type==="culture"?markCulDone(p.id,cu.orderId):markImgDone(p.id,cu.orderId)}
                                style={{border:"1px solid #22C55E",background:"#F0FDF4",borderRadius:3,fontSize:6,color:"#166534",fontWeight:700,cursor:"pointer",padding:"0 3px"}}>済み</button>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                )}

                {/* Order checklist */}
                <tr style={{background:"#FFF7ED"}}>
                  <td style={{padding:"2px",textAlign:"center",borderTop:"2px solid #FED7AA",borderBottom:"2px solid #FED7AA",borderRight:"1px solid #E2E8F0",background:"#FFF7ED"}}><span style={{fontSize:9}}>📋</span></td>
                  {filteredPats.map(p => {
                    const po = orders[p.id]||[], sd = pMD(selDateStr);
                    const onToday = o => o.dates?.some(d => d === selDateStr);
                    const notExpAbx = o => { if (!o.endDate) return true; const ed = pMD(o.endDate); return ed && sd && ed >= sd; };
                    const drips = po.filter(o => o.type === "drip_main" && o.name && onToday(o));
                    const meds = po.filter(o => o.type === "med" && o.name && onToday(o));
                    const abxs = po.filter(o => o.type === "abx" && o.name && notExpAbx(o));
                    const labs = po.filter(o => o.type === "lab" && o.dates?.some(d => { const dd = pMD(d); return dd && sd && dd >= sd; }));
                    return (
                      <td key={p.id} style={{padding:"2px 3px",borderTop:"2px solid #FED7AA",borderBottom:"2px solid #FED7AA",borderLeft:"1px solid #F1F5F9",verticalAlign:"top",fontSize:7,color:"#64748B"}}>
                        {drips.map(o => <div key={o.id}>💉{o.name}</div>)}
                        {meds.map(o => <div key={o.id}>💊{o.name}</div>)}
                        {abxs.map(o => <div key={o.id}>🦠{o.name} <b style={{color:"#C2410C"}}>〜{addDw(o.endDate)}</b></div>)}
                        {labs.map(o => <div key={o.id}>🩸{o.name} <b style={{color:"#0369A1"}}>{(o.dates||[]).filter(d => { const dd = pMD(d); return dd && sd && dd >= sd; }).map(d => addDw(d)).join(",")}</b></div>)}
                        {drips.length === 0 && meds.length === 0 && labs.length === 0 && <span style={{color:"#E2E8F0"}}>—</span>}
                      </td>
                    );
                  })}
                </tr>

                {/* Karte */}
                <tr style={{background:"#F0F9FF"}}>
                  <td style={{padding:"3px 2px",textAlign:"center",borderTop:"2px solid #BAE6FD",borderBottom:"2px solid #BAE6FD",borderRight:"1px solid #E2E8F0",background:"#E0F2FE"}}><span style={{fontSize:11}}>📝</span></td>
                  {filteredPats.map(p => { const k = curKarte[p.id]||{checked:false,memo:""}; const cl = COL[p.color]; return (
                    <td key={p.id} style={{padding:"3px 3px",borderTop:"2px solid #BAE6FD",borderBottom:"2px solid #BAE6FD",borderLeft:"1px solid #F1F5F9",background:k.checked?"#F0FDF4":"transparent",verticalAlign:"top"}}>
                      <div style={{display:"flex",alignItems:"center",gap:2,marginBottom:2}}>
                        <div onClick={() => setKarte(pr => ({...pr,[p.id]:{...pr[p.id],checked:!k.checked}}))} style={ck(k.checked,cl.dt)}>{k.checked && <Tk/>}</div>
                        <span style={{fontSize:8,fontWeight:600,color:k.checked?"#86EFAC":"#0369A1"}}>カルテ</span>
                      </div>
                      <textarea value={k.memo} onChange={e => setKarte(pr => ({...pr,[p.id]:{...pr[p.id],memo:e.target.value}}))} placeholder="メモ..." rows={2}
                        style={{...ip,fontSize:8,width:"100%",resize:"vertical",border:"1px solid #E2E8F0",borderRadius:3,padding:"2px 3px",background:"#FAFBFC",minHeight:24}}/>
                    </td>
                  ); })}
                </tr>
              </tbody>
            </table>

            {/* Consults */}
            <div style={{borderTop:"2px solid #E2E8F0"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",background:"#FFF7ED",borderBottom:"1px solid #FED7AA"}}>
                <span style={{fontSize:12}}>👨‍⚕</span>
                <span style={{fontSize:11,fontWeight:700,color:"#C2410C"}}>上級医に相談</span>
                <span style={{fontSize:8,color:"#94A3B8",marginLeft:"auto"}}>🔴=緊急</span>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}><tbody>
                {filteredPats.map(p => { const cl = COL[p.color]; const its = consults[p.id]||[]; return (
                  <tr key={p.id} style={{borderBottom:"1px solid #F1F5F9"}}>
                    <td style={{width:28,padding:3,verticalAlign:"top",borderRight:"1px solid #E2E8F0",background:cl.bg,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:cl.tx}}>{p.name.split(" ")[0]}</div></td>
                    <td style={{padding:"3px 6px",verticalAlign:"top"}}>
                      {its.map(it => (
                        <div key={it.id} style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
                          <div onClick={() => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,checked:!x.checked}:x)}))} style={ck(it.checked,cl.dt)}>{it.checked && <Tk/>}</div>
                          <div onClick={() => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,urgent:!x.urgent}:x)}))}
                            style={{width:13,height:13,borderRadius:"50%",border:it.urgent?"2px solid #DC2626":"2px solid #E2E8F0",background:it.urgent?"#DC2626":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:"white",fontWeight:800}}>
                            {it.urgent && "!"}
                          </div>
                          <input value={it.text} onChange={e => setConsults(pr => ({...pr,[p.id]:(pr[p.id]||[]).map(x => x.id===it.id?{...x,text:e.target.value}:x)}))} placeholder="相談事項..."
                            style={{...ip,fontSize:10,flex:1,textDecoration:it.checked?"line-through":"none",opacity:it.checked?0.4:1,width:"auto"}}/>
                        </div>
                      ))}
                      <button onClick={() => setConsults(pr => ({...pr,[p.id]:[...(pr[p.id]||[]),{id:Date.now(),text:"",checked:false,urgent:false}]}))}
                        style={{border:"none",background:"transparent",color:cl.dt,fontSize:8,cursor:"pointer",padding:0,fontWeight:600}}>＋</button>
                    </td>
                  </tr>
                ); })}
              </tbody></table>
            </div>

            {/* Study */}
            <div style={{borderTop:"2px solid #E2E8F0"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 14px",background:"#F5F3FF",borderBottom:"1px solid #DDD6FE"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12}}>📚</span>
                  <span style={{fontSize:11,fontWeight:700,color:"#6D28D9"}}>勉強リスト</span>
                </div>
                <button onClick={() => setStudyList(pr => [...pr, {id:Date.now(),text:"",checked:false}])}
                  style={{border:"none",background:"#A78BFA",color:"white",borderRadius:4,fontSize:10,fontWeight:700,width:16,height:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
              <div style={{padding:"5px 14px 8px"}}>
                {studyList.map((it, i) => (
                  <div key={it.id} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",borderBottom:i<studyList.length-1?"1px solid #EDE9FE":"none"}}>
                    <div onClick={() => setStudyList(pr => pr.map(x => x.id===it.id?{...x,checked:!x.checked}:x))} style={ck(it.checked,"#8B5CF6")}>{it.checked && <Tk/>}</div>
                    <input value={it.text} onChange={e => setStudyList(pr => pr.map(x => x.id===it.id?{...x,text:e.target.value}:x))} placeholder="テーマ..."
                      style={{...ip,fontSize:10,flex:1,textDecoration:it.checked?"line-through":"none",opacity:it.checked?0.4:1,width:"auto"}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{height:16}}/>
          </div>
        </div>
        </>}
      </div>
      {/* Modals */}
      {patModal !== null && <PatientModal edit={patModal.edit} onSave={addOrUpdatePat} onDelete={deletePat} onClose={() => setPatModal(null)} doctors={doctors} usedColors={patients.map(p=>p.color)}/>}
      {catModal && <AddCatModal onAdd={c => setPatCats(pr => ({...pr,[catModal]:[...(pr[catModal]||DEFAULT_CATS),c]}))} onClose={() => setCatModal(null)}/>}
    </div>
  );
}
