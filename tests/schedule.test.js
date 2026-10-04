import test from 'node:test';
import assert from 'node:assert/strict';
import {imageCellStatus,changeScheduleDate,groupSchedule,sortSchedule,abxCumDay,pendingOccurrences,elapsedDay} from '../src/scheduleLogic.js';
test('固定順と同分類内の順番を保ち、元データを変更しない',()=>{
 const rows=[{type:'abx'},{type:'med',id:1},{type:'lab'},{type:'family_call'},{type:'drip_main'},{type:'med',id:2}];
 assert.deepEqual(sortSchedule(rows).map(o=>o.type),['abx','drip_main','med','med','lab','family_call']);assert.equal(rows[0].type,'abx');assert.deepEqual(sortSchedule(rows).filter(o=>o.type==='med').map(o=>o.id),[1,2]);
});
test('前週の培養・画像も未確認の間は毎日追跡、未来の実施は出さない',()=>{
 for(const type of ['culture','img']){const o={type,dates:['2026-09-28','2026-10-02','2026-10-05'],confirmations:{'2026-09-28':true}};assert.deepEqual(pendingOccurrences(o,'2026-10-03'),['2026-10-02']);assert.equal(elapsedDay('2026-10-02','2026-10-03'),2);assert.deepEqual(pendingOccurrences({...o,confirmations:{'2026-09-28':true,'2026-10-02':true}},'2026-10-03'),[]);}
});
test('抗菌薬の変更・連続投与は通算し、中断後は1日目に戻る',()=>{
 const a={type:'abx',startDate:'2026-09-28',endDate:'2026-10-01'},b={type:'abx',startDate:'2026-10-02',endDate:'2026-10-05'},c={type:'abx',startDate:'2026-10-07',endDate:'2026-10-10'};
 assert.equal(abxCumDay([a,b,c],b,'2026-10-03'),6);assert.equal(abxCumDay([a,b,c],c,'2026-10-07'),1);
});

test('分類は元の順番で1見出しにまとめ、複数の薬剤や家族連絡を失わない',()=>{
 const items=[{id:1,type:'family_call'},{id:2,type:'abx'},{id:3,type:'abx'},{id:4,type:'family_call'},{id:5,type:'img'},{id:6,type:'custom'}];
 const groups=groupSchedule(items,[{type:'custom',label:'処置',icon:'🩹'},{type:'abx',label:'抗菌薬'}]);
 assert.deepEqual(groups.map(c=>c.type),['abx','drip_main','med','lab','img','family_call','custom']);
 assert.deepEqual(groups.find(c=>c.type==='abx').items.map(o=>o.id),[2,3]);
 assert.deepEqual(groups.find(c=>c.type==='family_call').items.map(o=>o.id),[1,4]);
 assert.equal(groups.find(c=>c.type==='custom').label,'処置');
 assert.equal(groups.reduce((n,c)=>n+c.items.length,0),items.length);
});

test('表の日付操作は選択日のみ付け外し、他日の確認状態を保つ',()=>{
 const o={dates:['2026-10-03'],confirmations:{'2026-10-03':true}};
 const added=changeScheduleDate(o,'2026-10-05');assert.deepEqual(added.dates,['2026-10-03','2026-10-05']);assert.equal(added.confirmations['2026-10-03'],true);
 assert.deepEqual(changeScheduleDate(added,'2026-10-03').confirmations,{});assert.deepEqual(o.dates,['2026-10-03']);
});
test('期間の開始・終了・延長・短縮を表から設定できる',()=>{
 const start=changeScheduleDate({type:'abx'},'2026-10-05',true);assert.equal(start.startDate,start.endDate);
 const end=changeScheduleDate(start,'2026-10-09',true);assert.equal(end.endDate,'2026-10-09');
 const earlier=changeScheduleDate(end,'2026-10-04',true);assert.equal(earlier.startDate,'2026-10-04');assert.equal(earlier.endDate,'2026-10-09');
 assert.equal(changeScheduleDate(earlier,'2026-10-06',true).endDate,'2026-10-06');
});

test('画像は実施日のみ確認まで強調し、1回の確認で終了。他の検査日は独立',()=>{
 const o={type:'img',dates:['2026-10-03','2026-10-05','2026-10-07'],confirmations:{}};
 assert.equal(imageCellStatus(o,'2026-10-03','2026-10-06'),'pending');
 assert.equal(imageCellStatus(o,'2026-10-04','2026-10-06'),'');
 assert.equal(imageCellStatus(o,'2026-10-07','2026-10-06'),'planned');
 const done={...o,confirmations:{'2026-10-03':true}};
 assert.equal(imageCellStatus(done,'2026-10-03','2026-10-10'),'confirmed');
 assert.equal(imageCellStatus(done,'2026-10-05','2026-10-06'),'pending');
 assert.deepEqual(pendingOccurrences(done,'2026-10-06'),['2026-10-05']);
});
