const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');const data={};const ctx=vm.createContext({localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v},document:{getElementById:()=>({addEventListener(){}})},console,Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').replace('bindStaticEvents(); render(); showRolloverIfNeeded();',''),ctx);vm.runInContext(fs.readFileSync(path.join(root,'adaptive-plan.js'),'utf8'),ctx);
vm.runInContext(`
let total=0;
for(const block of Object.keys(PROGRAM))for(let week=1;week<=PROGRAM[block].weeks.length;week++)for(const mon of ['pending','yes','wod','strength','no','rest'])for(const fri of ['pending','yes','wod','strength','no','rest']){
const w=currentWeek();w.program={block,week};w.data={};w.recovery={};w.adaptive.locked={};w.football={1:mon,5:fri};rebuildAdaptivePlan();
let high=0;
for(const id of PLAN_DAYS){const d=getDay(id);if(d.kind==='strength-run')throw Error('Mixed day');if(['quality','wod','simple'].includes(d.kind))high++;const keys=trackableKeysForDay(id);if(keys.length!==new Set(keys).size)throw Error('Duplicate keys');if(d.kind==='wod'){const t=d.wod.warmup+d.wod.cooldown+d.wod.reps*(d.wod.work+d.wod.rest);if(Math.abs(t/60-d.wod.minutes)>1)throw Error('Timer duration');}}
if(high>2)throw Error('More than two hard cardio sessions');
for(const [id,choice] of [[1,mon],[5,fri]])if(getDay(id).kind!==({pending:'pending',yes:'simple',wod:'wod',strength:'strength',no:'endurance',rest:'rest'})[choice])throw Error('Wrong optional activity');
const strength=PLAN_DAYS.map(id=>getDay(id));for(let i=1;i<strength.length;i++)if(strength[i].kind==='strength'&&strength[i-1].kind==='strength'&&(strength[i].strength==='lower')===(strength[i-1].strength==='lower'))throw Error('Adjacent same muscles');
total++;
}
for(const name of Object.keys(EXERCISE_ROTATIONS))for(let i=0;i<EXERCISE_ROTATIONS[name].length;i++){if(new Set([0,1,2,3].map(r=>buildStrengthVariation(name,r).exercises[i][0])).size!==4)throw Error('Rotation repeats early');if(buildStrengthVariation(name,0).exercises[i][0]!==buildStrengthVariation(name,4).exercises[i][0])throw Error('Rotation fails to return');}
const w=currentWeek();w.program={block:'base',week:1};w.football={1:'rest',5:'rest'};w.adaptive.locked={};w.data={};rebuildAdaptivePlan();const old=JSON.stringify(getDay(2));w.data[trainingPrefix(2)+'-ex-0-set-1-weight']='80';w.football[1]='strength';rebuildAdaptivePlan();if(JSON.stringify(getDay(2))!==old)throw Error('Started session changed');

let switches=0;
const choices=['pending','yes','wod','strength','no','rest'];
for(const mon of choices)for(const fri of choices)for(const logged of [2,3,4])for(const nextMon of choices)for(const nextFri of choices){
const w=currentWeek();w.program={block:'base',week:1};w.data={};w.recovery={};w.adaptive.locked={};w.football={1:mon,5:fri};rebuildAdaptivePlan();
const before=JSON.stringify(getDay(logged));w.data[trackableKeysForDay(logged)[0]]=true;w.football={1:nextMon,5:nextFri};rebuildAdaptivePlan();
if(JSON.stringify(getDay(logged))!==before)throw Error('Logged session mutated during switch');
if(PLAN_DAYS.filter(id=>getDay(id).kind==='quality').length>1)throw Error('Duplicate quality session after switch');
const ds=PLAN_DAYS.map(id=>getDay(id));for(let i=1;i<ds.length;i++)if(ds[i].kind==='strength'&&ds[i-1].kind==='strength'&&(ds[i].strength==='lower')===(ds[i-1].strength==='lower'))throw Error('Consecutive same muscle after switch '+JSON.stringify({mon,fri,logged,nextMon,nextFri}));
switches++;
}
console.log('PASS',switches,'midweek changes with logged sessions preserved and no duplicated quality or consecutive same-muscle sessions');
console.log('PASS',total,'activity/week combinations, 4-week exercise rotations, single-activity days, cardio cap, complementary muscles, WOD timer sums, locked sessions');
`,ctx);
