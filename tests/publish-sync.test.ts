/*
 * Publish → student synchronisation regression tests.
 *
 * The bug these lock down: a save/publish whose database write affected zero
 * rows (RLS filtered it) used to fall back to in-memory state and return TRUE,
 * so the teacher was told the module was published while students kept reading
 * the previous version. Every check below fails if that silent success returns.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stubs — the publish path only needs localStorage.
const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear()};
globalThis.window={localStorage:globalThis.localStorage};
const { supabase } = await import('../frontend/resources/js/lib/supabaseClient.js');
const { MentorService } = await import('../frontend/lib/mentor/mentorService.ts');
const { contentFingerprint } = await import('../frontend/lib/mentor/mentorService.ts');

let _pass=0,_fail=0;const failures=[];const t=(n,c,x)=>{if(c){_pass++;}else{_fail++;failures.push(`${n}${x?' — '+x:''}`);}};

/* ── tiny fake DB with RLS-ish behaviour ──────────────────────────────── */
const MENTOR='d1e00000-0000-4000-a000-000000000101';
let db, rpcBehavior, denyWrites;
function reset(){
  db={curriculum_proposals:new Map(), courses:new Map()};
  rpcBehavior='noop';   // 'noop' | 'refresh-children'
  denyWrites=false;     // simulate RLS filtering every write
}
const rows=()=>[...db.curriculum_proposals.values()];
function builder(table){
  let op=null, patch=null, filters=[], cols='*';
  const api={
    select(c){cols=c||'*'; if(!op)op='select'; return api;},
    update(p){op='update'; patch=p; return api;},
    eq(c,v){filters.push([c,v]); return api;},
    in(){return api;},
    or(){return api;},
    order(){return api;},
    limit(){return api;},
    maybeSingle(){return Promise.resolve(exec(true));},
    single(){return Promise.resolve(exec(true));},
    then(res,rej){return Promise.resolve(exec(false)).then(res,rej);},
  };
  function matches(r){return filters.every(([c,v])=>{ if(c==='created_by'&&denyWrites)return false; return String(r[c])===String(v); });}
  function exec(single){
    let list;
    if(table==='courses'){
      list=[...db.courses.values()].filter(matches).map(c=>({...c,
        curriculum_proposals: rows().filter(p=>p.course_id===c.id)}));
    } else if(op==='update'){
      if(denyWrites){ list=[]; }                            // RLS: no error, no rows
      else {
        const hit=rows().filter(matches);
        hit.forEach(r=>Object.assign(r,patch));
        list=hit.map(r=>({...r}));
      }
    } else {
      list=rows().filter(matches).map(r=>({...r}));
    }
    if(single){
      if(list.length!==1) return {data:null,error:{code:'PGRST116',message:'0 rows'}};
      return {data:list[0],error:null};
    }
    return {data:list,error:null};
  }
  return api;
}
supabase.from=(t)=>builder(t);
supabase.rpc=async(name,args)=>{
  if(rpcBehavior==='refresh-children'){
    const payloads=args.p_modules||[];
    for(const c of db.courses.values()){
      if(c.source_proposal_id!==args.p_proposal_id) continue;
      const m=payloads.find(p=>p.title===c.title);
      const row=rows().find(p=>p.course_id===c.id);
      if(m&&row) row.proposal_data=m.proposal_data;
    }
  }
  return {data:{success:true},error:null};
};

const node=(lesson)=>({id:'n1',title:'Lesson One',type:'concept',topic_group:'Group A',
  node_content:{core_lesson:lesson},blocks:[{id:'b1',type:'text',content:lesson}]});
const propData=(lesson,extra={})=>({title:'Course X',publishing_format:'separate_modules',
  organization_mode:'separate_modules',learning_nodes:[node(lesson)],modules:[],...extra});

/* 1. fingerprint sanity */
t('1a fingerprint stable under key order',
  contentFingerprint({a:1,b:{c:2,d:3}})===contentFingerprint({b:{d:3,c:2},a:1}));
t('1b fingerprint changes with content',
  contentFingerprint({x:'<p>old</p>'}!==contentFingerprint({x:'<p>new</p>'})));
t('1c fingerprint detects content change',
  contentFingerprint({x:'<p>old</p>'})!==contentFingerprint({x:'<p>new</p>'}));

/* 2. SAVE on a published proposal: policy-filtered write must NOT report success */
reset();
const pid='11111111-1111-4111-8111-111111111111';
db.curriculum_proposals.set(pid,{id:pid,course_id:'c1',created_by:MENTOR,status:'published',
  proposal_data:propData('<p>Old</p>')});
denyWrites=true;
const saveRes=await MentorService.updateCurriculumProposal(pid, propData('<p>New</p>'));
t('2 RLS-filtered save returns false (was silently true)', saveRes===false, String(saveRes));
t('2b live row untouched', db.curriculum_proposals.get(pid).proposal_data.learning_nodes[0].blocks[0].content==='<p>Old</p>');

/* 3. PUBLISH of a child module: filtered write must NOT report success */
reset();
denyWrites=true;
const childData=propData('<p>New</p>',{source_proposal_id:'parent-1'});
const pubRes=await MentorService.publishCurriculumProposal(pid, MENTOR, childData);
t('3 RLS-filtered publish returns false (was silently true)', pubRes===false, String(pubRes));

/* 4. PUBLISH child module allowed: row is updated and students read new content */
reset();
db.curriculum_proposals.set(pid,{id:pid,course_id:'c1',created_by:MENTOR,status:'published',
  proposal_data:propData('<p>Old</p>')});
const okPub=await MentorService.publishCurriculumProposal(pid, MENTOR, propData('<p>New</p>',{source_proposal_id:'parent-1'}));
t('4 publish succeeds when the row is writable', okPub===true, String(okPub));
t('4b STUDENT-FACING row holds the new lesson',
  db.curriculum_proposals.get(pid).proposal_data.learning_nodes[0].blocks[0].content==='<p>New</p>',
  JSON.stringify(db.curriculum_proposals.get(pid).proposal_data.learning_nodes[0].blocks[0]));
t('4c staging wrapper removed',
  db.curriculum_proposals.get(pid).proposal_data.unpublished_draft===undefined);

/* 5. SEPARATE MODULES: RPC leaves a child stale -> reconcile repairs it */
reset();
rpcBehavior='noop';
const parentId='22222222-2222-4222-8222-222222222222';
db.curriculum_proposals.set(parentId,{id:parentId,course_id:'cParent',created_by:MENTOR,
  status:'published',proposal_data:propData('<p>Old</p>')});
db.courses.set('cChild',{id:'cChild',title:'Group A',source_proposal_id:parentId});
db.curriculum_proposals.set('childProp',{id:'childProp',course_id:'cChild',created_by:MENTOR,
  status:'published',proposal_data:{title:'Group A',learning_nodes:[node('<p>Old</p>')],
    modules:[{id:'mod-Group A',checkpoints:[node('<p>Old</p>')]}]}});
const sepOk=await MentorService.publishCurriculumProposal(parentId, MENTOR, propData('<p>New</p>'));
t('5 separate-modules publish succeeds', sepOk===true, String(sepOk));
t('5b stale child module repaired with the published lesson',
  db.curriculum_proposals.get('childProp').proposal_data.learning_nodes[0].blocks[0].content==='<p>New</p>',
  JSON.stringify(db.curriculum_proposals.get('childProp').proposal_data.learning_nodes?.[0]?.blocks?.[0]));

/* 6. SEPARATE MODULES: child cannot be repaired -> publish must fail loudly */
reset();
rpcBehavior='noop';
db.curriculum_proposals.set(parentId,{id:parentId,course_id:'cParent',created_by:MENTOR,
  status:'published',proposal_data:propData('<p>Old</p>')});
db.courses.set('cChild',{id:'cChild',title:'Group A',source_proposal_id:parentId});
db.curriculum_proposals.set('childProp',{id:'childProp',course_id:'cChild',created_by:MENTOR,
  status:'published',proposal_data:{title:'Group A',learning_nodes:[node('<p>Old</p>')],
    modules:[{id:'mod-Group A',checkpoints:[node('<p>Old</p>')]}]}});
denyWrites=true;
const sepFail=await MentorService.publishCurriculumProposal(parentId, MENTOR, propData('<p>New</p>'));
t('6 unreconcilable publish returns false (no silent success)', sepFail===false, String(sepFail));

test('published content reaches the student-facing rows and failures are never silent', () => {
  assert.equal(_fail, 0, `failed checks:\n - ${failures.join('\n - ')}`);
  assert.ok(_pass > 0, 'checks must actually run');
});
