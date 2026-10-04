import test from 'node:test';
import assert from 'node:assert/strict';
import {manualCCr,admissionTime,selectPatients,patientFloor} from '../src/patientView.js';
const pats=[{id:'a',room:'3A',doctor:'X',urgency:'',admitDate:'9/30'},{id:'b',room:'5A',doctor:'X',urgency:'high',admitDate:'10/2'},{id:'c',room:'5B',doctor:'Y',urgency:'low',admitDate:'10/3'},{id:'d',room:'HCU',urgency:'medium',admitDate:''}];
test('floor and doctor filters combine without modifying input',()=>{assert.deepEqual(selectPatients(pats,{floor:'5',doctor:'X'}).map(p=>p.id),['b']);assert.deepEqual(pats.map(p=>p.id),['a','b','c','d']);assert.equal(patientFloor('10A'),'10');assert.equal(patientFloor('HCU'),'other');});
test('explicit urgency ranks unknown last',()=>assert.deepEqual(selectPatients(pats,{sort:'urgency'}).map(p=>p.id),['b','d','c','a']));
test('admission sorting handles month boundaries and missing values',()=>assert.deepEqual(selectPatients(pats,{sort:'admission'}).map(p=>p.id),['c','b','a','d']));
test('full admission dates sort across years and reject invalid dates',()=>{assert.ok(admissionTime({admitDateISO:'2027-01-01'})>admissionTime({admitDate:'12/31'}));assert.equal(admissionTime({admitDate:'2/30'}),null);assert.equal(admissionTime({admitDateISO:'bad'}),null);});
test('manual CCr keeps zero and decimals, distinguishes absent and invalid values',()=>{assert.equal(manualCCr(0),0);assert.equal(manualCCr('45.6'),45.6);for(const v of ['',null,undefined,-1,'bad',Infinity]) assert.equal(manualCCr(v),null);});
