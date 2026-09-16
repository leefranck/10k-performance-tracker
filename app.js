const STORAGE_KEY = "tenk-hybrid-performance-v2";
const LEGACY_KEY = "tenk-performance-tracker-v1";
const TARGET_10K = 39 * 60 + 59;
const BASELINE_10K = 44 * 60;

const STRENGTH = {
  upperA: {
    title: "Upper A · Force + masse",
    exercises: [
      ["Développé couché", 4, "5–6", "RIR 1–2"],
      ["Tractions lestées / tirage", 4, "5–6", "RIR 1–2"],
      ["Développé incliné haltères", 3, "8–10", "RIR 1–2"],
      ["Rowing poitrine supportée", 3, "8–10", "RIR 1–2"],
      ["Élévations latérales", 3, "12–20", "RIR 1–2"],
      ["Curl biceps", 3, "8–12", "RIR 1–2"],
      ["Triceps poulie", 3, "8–12", "RIR 1–2"]
    ]
  },
  lower: {
    title: "Lower · Force utile au running",
    exercises: [
      ["Squat / Hack squat", 4, "4–6", "RIR 2"],
      ["Romanian deadlift", 3, "5–8", "RIR 2"],
      ["Bulgarian split squat", 3, "6–8 / jambe", "RIR 2"],
      ["Leg curl", 3, "8–12", "RIR 1–2"],
      ["Mollets debout", 4, "8–12", "RIR 1–2"],
      ["Abdos lestés", 3, "8–15", "RIR 1–2"]
    ]
  },
  upperB: {
    title: "Upper B · Hypertrophie",
    exercises: [
      ["Développé incliné / machine", 3, "6–10", "RIR 1–2"],
      ["Tirage vertical", 3, "6–10", "RIR 1–2"],
      ["Développé épaules", 3, "8–10", "RIR 1–2"],
      ["Rowing poulie", 3, "8–12", "RIR 1–2"],
      ["Élévations latérales", 4, "12–20", "RIR 1–2"],
      ["Pec fly", 2, "12–15", "RIR 1–2"],
      ["Curl", 3, "10–15", "RIR 1–2"],
      ["Extension triceps", 3, "10–15", "RIR 1–2"]
    ]
  }
};

const PROGRAM = {
  base: {
    name: "Bloc 1 · Base hybride",
    description: "Construire le moteur aérobie, consolider le seuil et garder une vraie progression musculaire.",
    weeks: [
      { quality: qTime("3 × 8 min seuil", 3, 8*60, 120, "4:30–4:35/km"), easy: [40,0], long: 65, recovery: 25 },
      { quality: qTime("3 × 10 min seuil", 3, 10*60, 120, "4:28–4:32/km"), easy: [45,0], long: 70, recovery: 25 },
      { quality: qTime("2 × 15 min seuil", 2, 15*60, 150, "4:25–4:30/km"), easy: [45,4], long: 75, recovery: 30 },
      { quality: qTime("Deload · 2 × 8 min seuil", 2, 8*60, 120, "4:28–4:32/km", true), easy: [35,0], long: 60, recovery: 20, deload: true },
      { quality: qTime("20 min tempo continu", 1, 20*60, 0, "4:24–4:28/km"), easy: [45,4], long: 75, recovery: 30 },
      { quality: qTime("3 × 10 min seuil", 3, 10*60, 120, "4:22–4:26/km"), easy: [45,6], long: 80, recovery: 30 },
      { quality: qTime("25 min tempo continu", 1, 25*60, 0, "4:20–4:23/km"), easy: [50,6], long: 85, recovery: 30 },
      { quality: qTime("Deload · 2 × 10 min", 2, 10*60, 120, "4:20–4:25/km", true), easy: [35,4], long: 65, recovery: 20, deload: true }
    ]
  },
  build: {
    name: "Bloc 2 · Build",
    description: "Faire monter vitesse et seuil tout en conservant le volume facile et la force.",
    weeks: [
      { quality: qDistance("5 × 1 km", 5, 1, 90, "4:08/km"), easy: [45,4], long: 80, recovery: 30 },
      { quality: qTime("3 × 10 min seuil", 3, 10*60, 120, "4:20–4:23/km"), easy: [45,6], long: 85, recovery: 30 },
      { quality: qDistance("6 × 1 km", 6, 1, 90, "4:05/km"), easy: [50,4], long: 85, recovery: 30 },
      { quality: qDistance("Deload · 4 × 800 m", 4, .8, 90, "4:05/km", true), easy: [35,0], long: 65, recovery: 20, deload: true },
      { quality: qDistance("4 × 1,5 km", 4, 1.5, 120, "4:05–4:08/km"), easy: [45,6], long: 85, recovery: 30 },
      { quality: qTime("2 × 15 min seuil", 2, 15*60, 150, "4:15–4:20/km"), easy: [50,6], long: 90, recovery: 30 },
      { quality: qDistance("5 × 1 km", 5, 1, 90, "4:02–4:05/km"), easy: [45,6], long: 85, recovery: 30 },
      { quality: qDistance("Deload · 3 × 1 km", 3, 1, 120, "4:00–4:05/km", true), easy: [35,4], long: 70, recovery: 20, deload: true }
    ]
  },
  specific: {
    name: "Bloc 3 · Spécifique sub‑40",
    description: "Rendre 4:00/km familier, puis augmenter progressivement la durée tenue à allure cible.",
    weeks: [
      { quality: qDistance("6 × 1 km @ allure 10K", 6, 1, 90, "4:00/km"), easy: [45,6], long: 80, recovery: 30 },
      { quality: qDistance("4 × 1,5 km @ allure 10K", 4, 1.5, 120, "4:00/km"), easy: [45,6], long: 85, recovery: 30 },
      { quality: qDistance("3 × 2 km @ allure 10K", 3, 2, 120, "4:00/km"), easy: [50,6], long: 85, recovery: 30 },
      { quality: qDistance("Deload · 4 × 1 km", 4, 1, 120, "3:58–4:00/km", true), easy: [35,4], long: 65, recovery: 20, deload: true },
      { quality: qDistance("2 × 3 km @ allure 10K", 2, 3, 180, "4:00/km"), easy: [45,6], long: 80, recovery: 30 },
      { quality: qDistance("6–7 km continu spécifique", 1, 6.5, 0, "4:00–4:05/km"), easy: [40,4], long: 75, recovery: 25 }
    ]
  }
};

function qTime(title,reps,workSec,recoverySec,pace,deload=false){ return {type:"quality",title,reps,workSec,recoverySec,pace,deload}; }
function qDistance(title,reps,distanceKm,recoverySec,pace,deload=false){ return {type:"quality",title,reps,distanceKm,recoverySec,pace,deload}; }

const store = loadStore();
let selectedDay = chooseDefaultDay();
let timer = createTimerState();
let rolloverDismissed = false;

function defaultStore() {
  const nowKey = isoWeekKey(new Date());
  return {
    version: 2,
    settings: { pbSeconds: BASELINE_10K, treadmillDefault: false, autoAdvance: true },
    activeWeekKey: nowKey,
    weeks: {
      [nowKey]: createWeek(nowKey, {block:"base", week:1})
    }
  };
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.version === 2 && parsed.weeks) return parsed;
  } catch {}
  const fresh = defaultStore();
  if (localStorage.getItem(LEGACY_KEY)) fresh.migratedLegacy = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}
function saveStore(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
function createWeek(key, program){ return { key, status:"active", startedAt:new Date().toISOString(), completedAt:null, program:{...program}, data:{}, recovery:{}, pbSnapshot:store?.settings?.pbSeconds ?? BASELINE_10K }; }
function currentWeek(){ return store.weeks[store.activeWeekKey]; }
function weekData(){ return currentWeek().data; }
function stateGet(k,fallback=false){ return weekData()[k] ?? fallback; }
function stateSet(k,v){ weekData()[k]=v; saveStore(); updateGlobal(); }
function key(...parts){ return parts.join("-"); }

function isoWeekKey(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const week = Math.ceil((((d-yearStart)/86400000)+1)/7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2,"0")}`;
}
function chooseDefaultDay(){ const d=new Date().getDay(); return [0,1,2,3,4,5,6].includes(d)?d:1; }
function programWeek(){ const p=currentWeek().program; return PROGRAM[p.block].weeks[p.week-1]; }
function blockMeta(){ return PROGRAM[currentWeek().program.block]; }
function nextBlockName(block){ return block === "base" ? "build" : block === "build" ? "specific" : null; }
function nextProgramPosition(){
  const p=currentWeek().program; const max=PROGRAM[p.block].weeks.length;
  if(p.week < max) return {block:p.block, week:p.week+1};
  return {block:p.block, week:p.week};
}

function formatTime(sec){ sec=Math.max(0,Math.round(sec)); return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`; }
function parseTime(value){
  const m=String(value).trim().match(/^(\d{1,2}):([0-5]\d)$/); if(!m) return null;
  return Number(m[1])*60+Number(m[2]);
}
function paceSeconds(pace){ const m=String(pace).match(/(\d):(\d{2})/); return m ? Number(m[1])*60+Number(m[2]) : null; }
function treadmillSpeed(pace){ const sec=paceSeconds(pace); return sec ? (3600/sec).toFixed(1) : "—"; }
function repTargetSeconds(q){
  if(q.workSec) return q.workSec;
  const sec=paceSeconds(q.pace); return sec ? Math.round(sec*q.distanceKm) : 0;
}
function repDistanceLabel(q){ if(!q.distanceKm) return `${Math.round(q.workSec/60)} min`; return q.distanceKm < 1 ? `${Math.round(q.distanceKm*1000)} m` : `${String(q.distanceKm).replace(".",",")} km`; }

function getDay(dayId){
  const w=programWeek();
  const common={
    1:{short:"Lun",name:"Lundi",icon:"⚽",type:"Football",title:"Football",kind:"simple",tip:"Le foot compte comme ta séance haute intensité : sprints, accélérations et changements de direction."},
    2:{short:"Mar",name:"Mardi",icon:"🏋️",type:"Upper + récup",title:STRENGTH.upperA.title,kind:"strength-run",strength:"upperA",run:{title:"Footing récupération",minutes:w.recovery,pace:"5:45–6:15/km"},tip:"Le footing est optionnel si les jambes sont encore lourdes du foot. L'objectif est de récupérer, pas d'ajouter de fatigue."},
    3:{short:"Mer",name:"Mercredi",icon:"🏃",type:"Running clé",title:w.quality.title,kind:"quality",run:w.quality,tip:"La qualité vient de la régularité. Sur tapis, règle d'abord la vitesse puis démarre le chrono manuellement."},
    4:{short:"Jeu",name:"Jeudi",icon:"🏋️",type:"Lower",title:STRENGTH.lower.title,kind:"strength",strength:"lower",tip:"Pas d'échec sur squat/RDL. Garde de la marge pour absorber le running et le foot."},
    5:{short:"Ven",name:"Vendredi",icon:"🏋️‍♂️",type:"Upper + easy",title:STRENGTH.upperB.title,kind:"strength-run",strength:"upperB",run:{title:"Endurance facile",minutes:w.easy[0],pace:"5:20–5:55/km",strides:w.easy[1]},tip:"La course reste facile. Les strides sont rapides mais relâchées, jamais à bloc."},
    6:{short:"Sam",name:"Samedi",icon:"💤",type:"Repos",title:"Repos complet",kind:"rest",tip:"Marche tranquille possible, mais protège ce jour : il rend les autres séances meilleures."},
    0:{short:"Dim",name:"Dimanche",icon:"🏃",type:"Sortie longue",title:`Endurance · ${w.long} min`,kind:"endurance",run:{minutes:w.long,pace:"5:20–5:55/km"},tip:"Reste en aisance respiratoire. Le but est d'augmenter le moteur aérobie, pas de transformer la sortie longue en tempo."}
  };
  return common[dayId];
}

function checkboxRow(id,label){
  const row=document.createElement("label"); row.className="check-row";
  const input=document.createElement("input"); input.type="checkbox"; input.checked=Boolean(stateGet(id));
  input.addEventListener("change",()=>{ stateSet(id,input.checked); renderDayNav(); });
  const box=document.createElement("span"); box.className="checkmark";
  const text=document.createElement("span"); text.className="check-label"; text.textContent=label;
  row.append(input,box,text); return row;
}

function renderDayNav(){
  const nav=document.getElementById("dayNav"); nav.innerHTML="";
  [1,2,3,4,5,6,0].forEach(id=>{
    const d=getDay(id), b=document.createElement("button"); b.type="button";
    b.className=`day-btn${selectedDay===id?" active":""}${dayCompletion(id)>=.99?" done":""}`; b.textContent=d.short;
    b.addEventListener("click",()=>{ selectedDay=id; resetTimer(); render(); }); nav.appendChild(b);
  });
}
function renderDayHero(){
  const d=getDay(selectedDay), w=programWeek();
  document.getElementById("dayHero").innerHTML=`<div class="day-hero-main"><div class="day-icon">${d.icon}</div><div><div class="day-title">${d.name}</div><div class="day-type">${d.type}${w.deload?" · semaine allégée":""}</div></div></div><span class="pill">${d.kind==="rest"?"OFF":d.kind.includes("strength")?"RIR piloté":"progressif"}</span>`;
}

function renderModeSwitch(container,prefix,onChange){
  const current=stateGet(`${prefix}-mode`, store.settings.treadmillDefault?"treadmill":"outdoor");
  const wrap=document.createElement("div"); wrap.className="mode-switch";
  [["outdoor","Dehors"],["treadmill","Tapis"]].forEach(([value,label])=>{
    const b=document.createElement("button"); b.type="button"; b.textContent=label; b.classList.toggle("active",current===value);
    b.addEventListener("click",()=>{ stateSet(`${prefix}-mode`,value); onChange(); }); wrap.appendChild(b);
  });
  container.appendChild(wrap); return current;
}

function renderRunCard(run,prefix,{quality=false}={}){
  const box=document.createElement("div"); box.className="stack";
  const rerender=()=>renderTraining();
  const mode=renderModeSwitch(box,prefix,rerender);
  const specs=document.createElement("div"); specs.className="run-specs";
  const pace=run.pace;
  const speed=treadmillSpeed(pace);
  if(quality){
    specs.innerHTML=`<div class="run-spec"><span>Répétition</span><strong>${repDistanceLabel(run)}</strong></div><div class="run-spec"><span>${mode==="treadmill"?"Vitesse tapis":"Allure"}</span><strong>${mode==="treadmill"?`${speed} km/h`:pace}</strong></div><div class="run-spec"><span>Récupération</span><strong>${run.recoverySec?formatTime(run.recoverySec):"—"}</strong></div>`;
    box.appendChild(specs);
    const helper=document.createElement("div"); helper.className="soft-card"; helper.innerHTML=`Échauffement : <strong>15 min facile + 4 accélérations</strong> · Retour au calme : <strong>10 min</strong>${run.deload?" · Volume réduit cette semaine.":""}`; box.appendChild(helper);
    for(let i=1;i<=run.reps;i++) box.appendChild(checkboxRow(`${prefix}-rep-${i}`,`Répétition ${i} · ${repDistanceLabel(run)} · cible ${formatTime(repTargetSeconds(run))}`));
    const actions=document.createElement("div"); actions.className="session-actions";
    const timerBtn=document.createElement("button"); timerBtn.className="primary-button"; timerBtn.type="button"; timerBtn.textContent="Lancer le chrono guidé";
    timerBtn.addEventListener("click",()=>openGuidedTimer(run));
    const doneBtn=document.createElement("button"); doneBtn.className="secondary-button"; doneBtn.type="button"; doneBtn.textContent="Séance terminée";
    doneBtn.addEventListener("click",()=>{ stateSet(`${prefix}-session-done`,true); render(); });
    actions.append(timerBtn,doneBtn); box.appendChild(actions);
  } else {
    specs.innerHTML=`<div class="run-spec"><span>Durée</span><strong>${run.minutes} min</strong></div><div class="run-spec"><span>${mode==="treadmill"?"Vitesse tapis":"Allure"}</span><strong>${mode==="treadmill"?`${speed} km/h`:pace}</strong></div><div class="run-spec"><span>Intensité</span><strong>facile</strong></div>`;
    box.appendChild(specs);
    if(run.strides){ const h=document.createElement("div"); h.className="soft-card"; h.textContent=`Finir par ${run.strides} × 15 s de strides, récupération complète.`; box.appendChild(h); }
    box.appendChild(checkboxRow(`${prefix}-run-done`,`Course terminée · ${run.minutes} min`));
    const timerBtn=document.createElement("button"); timerBtn.className="secondary-button"; timerBtn.type="button"; timerBtn.textContent=`Chrono ${run.minutes} min`; timerBtn.addEventListener("click",()=>openSimpleTimer(run.minutes*60,run.title||"Running")); box.appendChild(timerBtn);
  }
  return box;
}

function previousWeekForCurrentProgram(){
  const entries=Object.values(store.weeks).filter(w=>w.key!==store.activeWeekKey && w.status==="archived").sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)));
  return entries[0] || null;
}
function renderStrength(name,prefix){
  const cfg=STRENGTH[name], wrap=document.createElement("div"); wrap.className="stack";
  const helper=document.createElement("div"); helper.className="soft-card"; helper.textContent="Progression : complète la fourchette de reps avec la même charge avant d'augmenter. Garde le RIR indiqué."; wrap.appendChild(helper);
  const prev=previousWeekForCurrentProgram();
  cfg.exercises.forEach(([exercise,sets,reps,rir],ei)=>{
    const details=document.createElement("details"); details.className="exercise"; if(ei===0) details.open=true;
    const summary=document.createElement("summary"); summary.innerHTML=`<span>${exercise}<span class="exercise-sub">${sets} × ${reps} · ${rir}</span></span>`;
    const body=document.createElement("div"); body.className="exercise-body";
    if(prev){
      const vals=[]; for(let s=1;s<=sets;s++){ const w=prev.data[`${prefix}-ex-${ei}-set-${s}-weight`], r=prev.data[`${prefix}-ex-${ei}-set-${s}-reps`]; if(w||r) vals.push(`${w||"—"} kg × ${r||"—"}`); }
      if(vals.length){ const p=document.createElement("div"); p.className="previous-set"; p.textContent=`Semaine précédente : ${vals.join(" · ")}`; body.appendChild(p); }
    }
    for(let s=1;s<=sets;s++){
      const row=document.createElement("div"); row.className="set-row";
      const n=document.createElement("span"); n.className="set-number"; n.textContent=`S${s}`;
      const weightLabel=document.createElement("label"); weightLabel.className="mini-field"; weightLabel.textContent="kg";
      const weight=document.createElement("input"); weight.type="number"; weight.inputMode="decimal"; weight.step="0.5"; weight.min="0"; weight.value=stateGet(`${prefix}-ex-${ei}-set-${s}-weight`,""); weight.addEventListener("change",()=>stateSet(`${prefix}-ex-${ei}-set-${s}-weight`,weight.value)); weightLabel.appendChild(weight);
      const repsLabel=document.createElement("label"); repsLabel.className="mini-field"; repsLabel.textContent="reps";
      const rep=document.createElement("input"); rep.type="number"; rep.inputMode="numeric"; rep.min="0"; rep.value=stateGet(`${prefix}-ex-${ei}-set-${s}-reps`,""); rep.addEventListener("change",()=>stateSet(`${prefix}-ex-${ei}-set-${s}-reps`,rep.value)); repsLabel.appendChild(rep);
      const done=document.createElement("button"); done.type="button"; const dk=`${prefix}-ex-${ei}-set-${s}-done`; const isDone=Boolean(stateGet(dk)); done.className=`done-btn${isDone?" is-done":""}`; done.textContent=isDone?"✓":"OK"; done.addEventListener("click",()=>{ stateSet(dk,!stateGet(dk)); renderTraining(); });
      row.append(n,weightLabel,repsLabel,done); body.appendChild(row);
    }
    details.append(summary,body); wrap.appendChild(details);
  });
  return wrap;
}

function renderTraining(){
  const d=getDay(selectedDay), content=document.getElementById("trainingContent"), prefix=`d${selectedDay}`;
  document.getElementById("trainingTitle").textContent=d.title; document.getElementById("trainingBadge").textContent=d.type; content.innerHTML="";
  if(d.kind==="simple"){
    ["Échauffement / mobilité","Séance de foot terminée","Retour au calme / hydratation"].forEach((x,i)=>content.appendChild(checkboxRow(`${prefix}-step-${i}`,x))); return;
  }
  if(d.kind==="rest"){
    ["Repos respecté","Hydratation correcte","7–9 h de sommeil visées"].forEach((x,i)=>content.appendChild(checkboxRow(`${prefix}-step-${i}`,x))); return;
  }
  if(d.kind==="quality"){ content.appendChild(renderRunCard(d.run,prefix,{quality:true})); return; }
  if(d.kind==="endurance"){ content.appendChild(renderRunCard(d.run,prefix)); return; }
  if(d.kind==="strength"){ content.appendChild(renderStrength(d.strength,prefix)); return; }
  if(d.kind==="strength-run"){
    content.appendChild(renderStrength(d.strength,`${prefix}-strength`));
    const title=document.createElement("h3"); title.textContent=d.run.title; title.style.marginTop="7px"; content.appendChild(title);
    content.appendChild(renderRunCard(d.run,`${prefix}-run`));
  }
}

function trackableKeysForDay(dayId){
  const d=getDay(dayId), p=`d${dayId}`, keys=[];
  if(d.kind==="simple"||d.kind==="rest") for(let i=0;i<3;i++) keys.push(`${p}-step-${i}`);
  if(d.kind==="quality"){ for(let i=1;i<=d.run.reps;i++) keys.push(`${p}-rep-${i}`); keys.push(`${p}-session-done`); }
  if(d.kind==="endurance") keys.push(`${p}-run-done`);
  const addStrength=(name,prefix)=>STRENGTH[name].exercises.forEach((e,ei)=>{ for(let s=1;s<=e[1];s++) keys.push(`${prefix}-ex-${ei}-set-${s}-done`); });
  if(d.kind==="strength") addStrength(d.strength,p);
  if(d.kind==="strength-run"){ addStrength(d.strength,`${p}-strength`); keys.push(`${p}-run-run-done`); }
  return keys;
}
function dayCompletion(dayId){ const ks=trackableKeysForDay(dayId); if(!ks.length) return 0; return ks.filter(k=>Boolean(stateGet(k))).length/ks.length; }
function updateGlobal(){
  const keys=[1,2,3,4,5,6,0].flatMap(trackableKeysForDay), done=keys.filter(k=>Boolean(stateGet(k))).length, pct=keys.length?Math.round(done/keys.length*100):0;
  document.getElementById("globalPercent").textContent=`${pct}%`; document.getElementById("globalCount").textContent=`${done} / ${keys.length}`; renderGoal();
}

function renderProgramHeader(){
  const p=currentWeek().program, meta=PROGRAM[p.block];
  document.getElementById("blockName").textContent=meta.name; document.getElementById("blockWeek").textContent=`· Semaine ${p.week}/${meta.weeks.length}`; document.getElementById("blockDescription").textContent=meta.description;
  const btn=document.getElementById("completeWeekButton"); btn.textContent=currentWeek().validated?"Semaine validée ✓":"Valider la semaine"; btn.disabled=Boolean(currentWeek().validated);
}
function renderGoal(){
  const pb=store.settings.pbSeconds || BASELINE_10K; document.getElementById("current10k").textContent=formatTime(pb);
  const progress=Math.max(0,Math.min(100,Math.round((BASELINE_10K-pb)/(BASELINE_10K-TARGET_10K)*100)));
  document.getElementById("goalProgress").textContent=`${progress}%`; document.getElementById("goalBar").style.width=`${progress}%`;
}

function loadRecovery(){
  const r=currentWeek().recovery;
  document.getElementById("sleepInput").value=r.sleep??""; document.getElementById("energyInput").value=r.energy??""; document.getElementById("legsInput").value=r.legs??""; renderRecoveryAdvice();
}
function renderRecoveryAdvice(){
  const {sleep,energy,legs}=currentWeek().recovery, el=document.getElementById("recoveryAdvice");
  if(sleep==null||energy==null||legs==null||sleep===""||energy===""||legs===""){ el.className="microcopy"; el.textContent="Renseigne ton état : l'app t'aide à éviter d'empiler la fatigue."; return; }
  const risky=Number(sleep)<6.5 || Number(energy)<=2 || Number(legs)>=4;
  el.className=`microcopy ${risky?"status-warn":"status-good"}`;
  el.textContent=risky?"Fatigue élevée détectée : garde les allures faciles, évite l'échec en muscu et réduis le volume si nécessaire.":"Récupération cohérente : tu peux suivre la séance prévue sans ajouter de volume bonus.";
}

function createTimerState(){ return {open:false,segments:[],index:0,remaining:0,running:false,lastTick:0,interval:null,label:""}; }
function timerSegmentLabel(seg){ return seg.type==="work"?`Effort · ${seg.label}`:seg.type==="recovery"?"Récupération":"Chrono"; }
function openGuidedTimer(q){
  resetTimer(); timer.open=true; timer.label=q.title; const work=repTargetSeconds(q);
  for(let i=1;i<=q.reps;i++){ timer.segments.push({type:"work",seconds:work,label:`Rép ${i}/${q.reps}`}); if(i<q.reps && q.recoverySec) timer.segments.push({type:"recovery",seconds:q.recoverySec,label:`Après rép ${i}`}); }
  timer.index=0; timer.remaining=timer.segments[0]?.seconds||0; renderTimer(); document.getElementById("timerPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
function openSimpleTimer(seconds,label){ resetTimer(); timer.open=true; timer.label=label; timer.segments=[{type:"simple",seconds,label}]; timer.remaining=seconds; renderTimer(); document.getElementById("timerPanel").scrollIntoView({behavior:"smooth",block:"center"}); }
function startPauseTimer(){
  if(!timer.open)return; timer.running=!timer.running; timer.lastTick=Date.now();
  if(timer.running){ clearInterval(timer.interval); timer.interval=setInterval(tickTimer,250); } else clearInterval(timer.interval); renderTimer();
}
function tickTimer(){
  if(!timer.running)return; const now=Date.now(), diff=(now-timer.lastTick)/1000; timer.lastTick=now; timer.remaining-=diff;
  if(timer.remaining<=0){ timer.remaining=0; ping(); const auto=document.getElementById("autoAdvance").checked; if(auto && timer.index<timer.segments.length-1){ nextTimerSegment(true); } else { timer.running=false; clearInterval(timer.interval); } }
  renderTimer();
}
function nextTimerSegment(keepRunning=false){
  if(timer.index>=timer.segments.length-1){ timer.running=false; clearInterval(timer.interval); renderTimer(); return; }
  timer.index++; timer.remaining=timer.segments[timer.index].seconds; timer.lastTick=Date.now(); if(!keepRunning) timer.running=false; renderTimer();
}
function resetTimer(){ clearInterval(timer.interval); timer=createTimerState(); renderTimer(); }
function ping(){ if(navigator.vibrate) navigator.vibrate(120); }
function renderTimer(){
  const panel=document.getElementById("timerPanel"); if(!timer.open){ panel.classList.add("hidden"); return; } panel.classList.remove("hidden");
  const seg=timer.segments[timer.index]||{type:"simple",label:"Prêt"}; document.getElementById("timerPhase").textContent=timerSegmentLabel(seg); document.getElementById("timerRep").textContent=seg.label||timer.label||"—"; document.getElementById("timerDisplay").textContent=formatTime(timer.remaining); document.getElementById("timerStart").textContent=timer.running?"Pause":timer.remaining===seg.seconds?"Démarrer":"Reprendre"; document.getElementById("timerHint").textContent=timer.running?"Reste concentré : l'app te prévient au changement.":"Démarrage manuel pour éviter les départs accidentels.";
}

function archiveAndCreateNewWeek(forceCurrentKey=null){
  const old=currentWeek(); old.status="archived"; old.completedAt=new Date().toISOString(); old.pbSnapshot=store.settings.pbSeconds;
  const newKey=forceCurrentKey || isoWeekKey(new Date()); const position=nextProgramPosition();
  let keyCandidate=newKey, suffix=2; while(store.weeks[keyCandidate]) keyCandidate=`${newKey}-${suffix++}`;
  store.weeks[keyCandidate]=createWeek(keyCandidate,position); store.activeWeekKey=keyCandidate; saveStore(); rolloverDismissed=false; render();
  const p=old.program; if(p.week>=PROGRAM[p.block].weeks.length && nextBlockName(p.block)) showBlockDialog(p.block);
}
function showRolloverIfNeeded(){
  const calendar=isoWeekKey(new Date()); if(calendar!==store.activeWeekKey && !rolloverDismissed) document.getElementById("rolloverDialog").showModal();
}
function showBlockDialog(block){
  const next=nextBlockName(block); if(!next)return; document.getElementById("blockDialogTitle").textContent=`${PROGRAM[next].name} ?`; document.getElementById("blockDialogText").textContent=`Tu as terminé ${PROGRAM[block].name}. Le passage de bloc reste volontaire : valide uniquement si tu récupères bien et que les séances clés sont maîtrisées.`; document.getElementById("blockDialog").dataset.next=next; document.getElementById("blockDialog").showModal();
}
function advanceToNextBlock(){ const dialog=document.getElementById("blockDialog"), next=dialog.dataset.next; if(!next)return; currentWeek().program={block:next,week:1}; saveStore(); dialog.close(); render(); }

function renderHistory(){
  const list=document.getElementById("historyList"); list.innerHTML="";
  const weeks=Object.values(store.weeks).sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)));
  weeks.forEach(w=>{
    const item=document.createElement("div"); item.className="history-item";
    const program=PROGRAM[w.program.block], allKeys=Object.keys(w.data).filter(k=>k.endsWith("-done")||k.includes("-rep-")||k.includes("-step-")), done=allKeys.filter(k=>Boolean(w.data[k])).length, pct=allKeys.length?Math.round(done/allKeys.length*100):0;
    const strengthEntries=Object.keys(w.data).filter(k=>k.endsWith("-weight")&&w.data[k]).length;
    item.innerHTML=`<div class="history-head"><strong>${w.key}</strong><span class="pill">${w.status==="active"?"active":"archivée"}</span></div><small>${program.name} · Semaine ${w.program.week} · progression enregistrée ${pct}% · ${strengthEntries} charges saisies · PB snapshot ${formatTime(w.pbSnapshot||store.settings.pbSeconds)}</small>`;
    list.appendChild(item);
  });
}
function exportData(){
  const blob=new Blob([JSON.stringify(store,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download=`10k-hybrid-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function bindStaticEvents(){
  document.getElementById("settingsButton").addEventListener("click",()=>{ document.getElementById("pbInput").value=formatTime(store.settings.pbSeconds); document.getElementById("treadmillDefault").checked=store.settings.treadmillDefault; document.getElementById("settingsAutoAdvance").checked=store.settings.autoAdvance; document.getElementById("settingsDialog").showModal(); });
  document.getElementById("saveSettings").addEventListener("click",e=>{ e.preventDefault(); const pb=parseTime(document.getElementById("pbInput").value); if(pb) store.settings.pbSeconds=pb; store.settings.treadmillDefault=document.getElementById("treadmillDefault").checked; store.settings.autoAdvance=document.getElementById("settingsAutoAdvance").checked; saveStore(); document.getElementById("settingsDialog").close(); render(); });
  document.getElementById("exportButton").addEventListener("click",exportData);
  document.getElementById("historyButton").addEventListener("click",()=>{ renderHistory(); document.getElementById("historyDialog").showModal(); }); document.getElementById("closeHistory").addEventListener("click",()=>document.getElementById("historyDialog").close());
  document.getElementById("completeWeekButton").addEventListener("click",()=>{ currentWeek().validated=true; currentWeek().validatedAt=new Date().toISOString(); saveStore(); renderProgramHeader(); });
  document.getElementById("continueOldWeek").addEventListener("click",()=>{ rolloverDismissed=true; document.getElementById("rolloverDialog").close(); });
  document.getElementById("startNewWeek").addEventListener("click",()=>{ document.getElementById("rolloverDialog").close(); archiveAndCreateNewWeek(isoWeekKey(new Date())); });
  document.getElementById("stayBlock").addEventListener("click",()=>document.getElementById("blockDialog").close()); document.getElementById("advanceBlock").addEventListener("click",advanceToNextBlock);
  document.getElementById("timerStart").addEventListener("click",startPauseTimer); document.getElementById("timerNext").addEventListener("click",()=>nextTimerSegment(false)); document.getElementById("timerReset").addEventListener("click",resetTimer);
  document.getElementById("autoAdvance").checked=store.settings.autoAdvance; document.getElementById("autoAdvance").addEventListener("change",e=>{ store.settings.autoAdvance=e.target.checked; saveStore(); });
  ["sleepInput","energyInput","legsInput"].forEach(id=>document.getElementById(id).addEventListener("change",e=>{ const map={sleepInput:"sleep",energyInput:"energy",legsInput:"legs"}; currentWeek().recovery[map[id]]=e.target.value; saveStore(); renderRecoveryAdvice(); }));
}

function render(){
  renderProgramHeader(); renderGoal(); renderDayNav(); renderDayHero(); renderTraining(); loadRecovery(); updateGlobal(); renderTimer();
  const d=getDay(selectedDay); document.getElementById("dailyTip").innerHTML=`<strong>Conseil du jour :</strong> ${d.tip}`;
}

bindStaticEvents(); render(); showRolloverIfNeeded();
