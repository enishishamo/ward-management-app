import test from 'node:test';
import assert from 'node:assert/strict';
import {tsatValue,rpiValue,patientCCr,number} from '../src/clinical.js';
import {matchingDoses} from '../src/renalDosing.js';
import {dateKey,parseDate,migrateDates,occurrenceDone} from '../src/dates.js';
import {carryTasks,taskSlots} from '../src/taskCarry.js';
import {validateBackup} from '../src/backup.js';
test('TSAT valid examples, zero, blanks and invalid denominator',()=>{
 assert.equal(tsatValue(60,300),20);assert.equal(tsatValue(0,300),0);
 for(const [a,b] of [['',300],[30,''],[-1,100],[30,0],[400,300],['abc',300]])assert.equal(tsatValue(a,b),null);
});
test('RPI % and per-mille yield the same result; factor must be explicit',()=>{
 assert.equal(rpiValue(6,30,'%',2),2);assert.equal(rpiValue(60,30,'‰',2),2);
 assert.equal(rpiValue(0,30,'%',2),0);assert.equal(rpiValue(6,30,'%',null),null);
 for(const args of [[-1,30,'%',2],[3,0,'%',2],[3,101,'%',2],[3,30,'%',0],[3,30,'unknown',2]])assert.equal(rpiValue(...args),null);
});
test('Cockcroft-Gault adult formula, sex and missing data',()=>{
 const p={age:68,weight:72,cr:1,sex:'M'};assert.equal(patientCCr(p).value,72);
 assert.equal(patientCCr({...p,sex:'F'}).value,61.199999999999996);
 for(const change of [{sex:''},{age:17},{weight:''},{cr:0}])assert.equal(patientCCr({...p,...change}).value,null);
});
test('ABPC renal intervals, source boundary ambiguity and AKI exclusion',()=>{
 assert.equal(matchingDoses('iv-ABPC','standard',45.6,'stable')[0].dose,'1回2g・1日3回');
 assert.equal(matchingDoses('iv-ABPC','standard',50,'stable').length,2);
 assert.equal(matchingDoses('iv-ABPC','standard',50.01,'stable').length,1);
 assert.equal(matchingDoses('iv-ABPC','standard',null,'stable').length,0);
 assert.equal(matchingDoses('iv-ABPC','standard',45.6,'aki').length,0);
 assert.equal(matchingDoses('iv-ABPC','standard',null,'hd')[0].dose,'1回2g・1日1回（透析後）');
});
test('Drug-specific condition, loading dose and blocked CEX typo',()=>{
 assert.equal(matchingDoses('iv-MEPM','cns',20,'stable')[0].dose,'1回1g・1日2回');
 assert.equal(matchingDoses('iv-CMZ','cut80',70,'stable')[0].dose,'1回1g・1日3回、または1回2g・1日2回');
 assert.equal(matchingDoses('iv-CMZ','cut60',70,'stable')[0].dose,'1回1g・1日4回、または1回2g・1日3回');
 assert.match(matchingDoses('oral-LVFX','standard',10,'stable')[0].dose,/初回500mg.*250mg・2日に1回/);
 assert.equal(matchingDoses('oral-CEX','cystitis',60,'stable').length,0);
 assert.equal(matchingDoses('iv-VCM','standard',60,'stable').length,0);
});
test('Dates preserve years, local timezone and legacy 2026 meaning',()=>{
 assert.equal(dateKey(new Date(2027,0,1)), '2027-01-01');
 assert.equal(parseDate('2/30'),null);assert.equal(parseDate('2027-02-29'),null);
 assert.equal(dateKey(parseDate('12/31')),'2026-12-31');
 const migrated=migrateDates({'12/31':{am:{}},admitDate:'12/31',text:'12/31',dates:['1/1','2027-01-01']});
 assert.ok(migrated['2026-12-31']);assert.equal(migrated.text,'12/31');assert.equal(migrated.admitDate,'2026-12-31');assert.deepEqual(migrated.dates,['2026-01-01','2027-01-01']);
 assert.deepEqual(migrateDates(migrated),migrated);
});
test('Old confirmed imaging dates migrate without confirming future added dates',()=>{
 const o=migrateDates({type:'img',dates:['10/1'],reportConfirmed:true});o.dates.push('2026-10-05');
 assert.equal(occurrenceDone(o,'2026-10-01'),true);assert.equal(occurrenceDone(migrateDates(o),'2026-10-05'),false);
});
test('Skipped days carry manual and auto tasks once, retaining existing checked tasks',()=>{
 const fresh={am:{am0_p:{}},pm:{pm0_p:{}},vitals:{},karte:{}};
 const db={'2026-09-30':{am:{am0_p:{presetId:'lab',checked:false,auto:true},am1_p:{presetId:'free',text:'carry',checked:false},am2_p:{presetId:'free',checked:true}},pm:{}}};
 const next=carryTasks(db,'2026-10-03',fresh);assert.equal(Object.values(next.am).filter(v=>v.presetId).length,2);
 const twice=carryTasks({...db,'2026-10-03':next},'2026-10-03',fresh);assert.deepEqual(twice,next);
 next.am.am0_p.checked=true;assert.equal(carryTasks({...db,'2026-10-03':next},'2026-10-03',fresh).am.am0_p.checked,true);
 assert.equal(taskSlots({am8_p:{presetId:'free'}},'am',5),10);
});
test('Invalid backup rejected before applying',()=>{
 const keys=['ward_patients_v2','ward_orders_v2'];
 assert.throws(()=>validateBackup({},keys));
 assert.throws(()=>validateBackup({ward_patients_v2:[null]},keys));
 assert.throws(()=>validateBackup({ward_patients_v2:[],ward_orders_v2:{p:{}}},keys));
 assert.deepEqual(validateBackup({ward_patients_v2:[],ward_orders_v2:{}},keys),{ward_patients_v2:'[]',ward_orders_v2:'{}'});
});

test('A future day does not revive a task completed after it was previewed',()=>{
 const fresh={am:{am0_p:{}},pm:{pm0_p:{}}};
 const before={am:{am0_p:{presetId:'free',carryId:'t',modifiedAt:10}},pm:{}};
 const preview=carryTasks({'2026-10-01':before},'2026-10-05',fresh);
 const done={am:{am0_p:{...before.am.am0_p,checked:true,modifiedAt:20}},pm:{}};
 const next=carryTasks({'2026-10-01':done,'2026-10-05':preview},'2026-10-05',fresh);
 assert.equal(next.am.am0_p.checked,true);
});
test('All catalog items have a dosing table or documented exception',async()=>{
 const {readFile}=await import('node:fs/promises');const {DOSING}=await import('../src/renalDosing.js');
 const catalog=JSON.parse(await readFile(new URL('../src/antibioticCatalog.json',import.meta.url),'utf8'));
 for(const d of catalog)assert.ok(DOSING[d.id]?.length||d.id==='iv-VCM',d.id);
 assert.deepEqual(catalog.slice(0,11).map(d=>d.id),['iv-ABPC','iv-SBT/ABPC','iv-TAZ/PIPC','iv-CTRX','iv-CMZ','iv-MEPM','iv-VCM','oral-AMPC','oral-CVA/AMPC','oral-CEX','oral-LVFX']);
});
test('Do not substitute CCr for the eGFR-only drug table',()=>{
 assert.equal(matchingDoses('oral-ニルマトレルビル/リトナビル','egfr',60,'stable').length,0);
 assert.equal(matchingDoses('oral-STFX','standard',5,'stable').length,0);
 assert.equal(matchingDoses('oral-SBTPC','standard',30,'stable').length,1);
});
