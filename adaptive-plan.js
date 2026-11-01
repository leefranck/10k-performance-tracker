// Per-week session snapshots keep exercise identity and logged data stable.
const EXERCISE_ROTATIONS = {
  upperA: [
    ["Développé couché", "Développé haltères à plat", "Chest press convergente", "Développé couché haltères prise neutre"],
    ["Tirage vertical prise neutre", "Tractions assistées pronation", "Tirage vertical supination", "Tirage vertical unilatéral"],
    ["Développé incliné haltères", "Développé incliné machine", "Développé incliné barre", "Presse pectorale inclinée prise neutre"],
    ["Rowing poitrine supportée", "Rowing haltère unilatéral", "Rowing poulie prise neutre", "Rowing machine prise large"],
    ["Élévations latérales haltères", "Élévations latérales poulie", "Élévations latérales machine", "Élévations latérales assis"],
    ["Curl biceps haltères", "Curl pupitre", "Curl poulie basse", "Curl incliné"]
  ],
  lower: [
    ["Hack squat", "Presse à cuisses", "Goblet squat", "Squat guidé"],
    ["Romanian deadlift haltères", "Hip thrust machine", "Pull-through poulie", "Hip thrust barre"],
    ["Fentes arrière", "Step-up bas", "Split squat statique", "Fentes marchées"],
    ["Leg curl assis", "Leg curl couché", "Leg curl unilatéral", "Leg curl debout"],
    ["Mollets debout", "Mollets assis", "Mollets à la presse", "Mollets unilatéraux"],
    ["Dead bug", "Pallof press", "Gainage latéral", "Bird dog"]
  ],
  upperB: [
    ["Chest press horizontale", "Pompes sur poignées", "Développé haltères prise serrée", "Presse pectorale unilatérale"],
    ["Rowing poulie basse", "Rowing machine unilatéral", "Rowing T-bar poitrine supportée", "Rowing poulie haute"],
    ["Développé épaules haltères", "Développé épaules machine", "Landmine press", "Développé épaules prise neutre"],
    ["Oiseau machine", "Oiseau poulie", "Face pull", "Oiseau haltères poitrine supportée"],
    ["Curl marteau", "Curl corde poulie", "Curl barre EZ", "Curl pupitre unilatéral"],
    ["Triceps poulie corde", "Extension triceps unilatérale", "Triceps barre poulie", "Extension triceps au-dessus de la tête"]
  ]
};
const PLAN_DAYS = [1,2,3,4,5,6,0];
const PLAN_NAMES = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
let adaptivePlanJustChanged=false;
const baseGetDay = getDay;
const baseTrainingPrefix = trainingPrefix;
const baseTrackableKeys = trackableKeysForDay;

function copySession(value){ return JSON.parse(JSON.stringify(value)); }
function hasSessionData(week,dayId){
  const session=week.adaptive?.plan?.[dayId];
  const prefix=session?.prefix;
  return Object.entries(week.data||{}).some(([k,v])=>(prefix ? k.startsWith(prefix+"-") || k===`d${dayId}-day-validated` || k===`d${dayId}-feeling` : k.startsWith(`d${dayId}-`)) && !k.endsWith("-mode") && !k.endsWith("-feeling") && v!==false && v!=="" && v!=null);
}
function buildStrengthVariation(name,rotation,light=false){
  const labels={upperA:"Haut du corps A",upperB:"Haut du corps B",lower:"Bas du corps"};
  const exercises=EXERCISE_ROTATIONS[name].map((variants,i)=>[
    variants[rotation%4],light?2:3,
    name==="lower" && i===5 ? (rotation%4===2?"20–30 s / côté":"8–12 / côté") : i<3?"8–12":"12–15",
    "RIR 2–3"
  ]);
  return {title:`${labels[name]} · Variation ${"ABCD"[rotation%4]}`,exercises,rotation:rotation%4};
}
function ensureAdaptiveWeek(week=currentWeek()){
  if(week.key!==store.activeWeekKey) return;
  if(week.adaptive){
    if(week.adaptive.programSignature!==JSON.stringify(week.program)){rebuildAdaptivePlan(week);saveStore();}
    return;
  }
  const locked={};
  PLAN_DAYS.forEach(id=>{
    if(!hasSessionData(week,id)) return;
    const d=copySession(baseGetDay(id)); if(d.kind==="pending")return;
    d.prefix=d.kind==="strength-run"?"d"+id:id===2&&d.kind==="strength"?"d2-strength":id===5&&d.kind==="endurance"?"d5-run":week.scheduleVersion===2&&d.kind==="rest"&&(id===1||id===5)?"d"+id+"-rest":week.scheduleVersion===2&&id===5&&d.kind==="simple"?"d5-foot":"d"+id;
    if(d.strength) d.strengthConfig=copySession(STRENGTH[d.strength]);
    locked[id]=d;
  });
  const previous=Object.values(store.weeks).filter(w=>w.key!==week.key && w.adaptive);
  const rotation=previous.length?Math.max(...previous.map(w=>w.adaptive.rotation))+1:0;
  week.adaptive={rotation,plan:{},locked,notes:[]}; week.scheduleVersion=3;
  rebuildAdaptivePlan(week); saveStore();
}
function recoveryIsLow(week){
  const r=week.recovery||{};
  return (r.sleep!=="" && r.sleep!=null && Number(r.sleep)<6.5) || (r.energy!=="" && r.energy!=null && Number(r.energy)<=2) || (r.legs!=="" && r.legs!=null && Number(r.legs)>=4);
}
function makeWod(week,dayId,forceLow=false){
  const rotation=(week.adaptive.rotation+(dayId===5?1:0))%4;
  const profiles=[{name:"Intervalles moteurs",reps:10,work:180,rest:60},{name:"Blocs soutenus",reps:8,work:240,rest:60},{name:"Vagues cardio",reps:5,work:360,rest:120},{name:"Relances contrôlées",reps:20,work:90,rest:30}];
  const cfg={...profiles[rotation]}, low=forceLow||recoveryIsLow(week)||Boolean(PROGRAM[week.program.block].weeks[week.program.week-1].deload), reference=week.wodReference||{minutes:60,rpe:7};
  const total=Math.max(30,Math.min(90,Number(reference.minutes)||60));
  const warmup=600,cooldown=600, available=(total*60-warmup-cooldown)*(low?.7:1);
  const ratio=available/(cfg.reps*(cfg.work+cfg.rest));
  cfg.work=Math.max(30,Math.round(cfg.work*ratio)); cfg.rest=Math.max(15,Math.round(cfg.rest*ratio));
  cfg.warmup=warmup; cfg.cooldown=cooldown; cfg.minutes=Math.round((warmup+cooldown+cfg.reps*(cfg.work+cfg.rest))/60);
  cfg.rpe=low?6:Math.min(8,Math.max(6,Number(reference.rpe)||7));cfg.low=low;cfg.rotation=rotation;
  cfg.equipment=["Vélo / air bike","Rameur","SkiErg / vélo","Vélo ou rameur"][rotation];
  return cfg;
}
function rebuildAdaptivePlan(week=currentWeek(),changedDay=null){
  const a=week.adaptive;if(!a)return;
  const p=PROGRAM[week.program.block].weeks[week.program.week-1], choices=week.football||{}, mon=choices[1]||"pending",fri=choices[5]||"pending";
  const hard=x=>x==="yes"||x==="wod", light=recoveryIsLow(week)||Boolean(p.deload), notes=[];
  const make=(id,value)=>({...value,short:["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][id],name:PLAN_NAMES[id]});
  const rest=id=>make(id,{icon:"💤",kind:"rest",type:"Repos",title:"Repos",tip:"Récupère : aucune séance à rattraper."});
  const easy=(id,minutes)=>make(id,{icon:"🏃",kind:"endurance",type:"Course facile",title:`Endurance facile · ${minutes} min`,run:{minutes,pace:"5:45–6:15/km"},tip:"Reste en aisance respiratoire. Une seule séance aujourd’hui."});
  const strength=(id,name)=>{const cfg=buildStrengthVariation(name,a.rotation,light);return make(id,{icon:"🏋️",kind:"strength",type:name==="lower"?"Bas du corps":"Haut du corps",title:cfg.title,strength:name,strengthConfig:cfg,tip:"Garde 2–3 répétitions en réserve. Les exercices changent chaque semaine ; une variante revient après quatre cycles."});};
  const quality=id=>light?easy(id,Math.min(30,p.easy[0])):make(id,{icon:"🏃",kind:"quality",type:"Course clé",title:p.quality.title,run:copySession(p.quality),tip:"Échauffement progressif puis séance clé. Pas de musculation ajoutée."});
  const optional=(id,choice)=>{
    if(choice==="strength")return strength(id,id===1?"upperA":"upperB");
    if(choice==="yes")return make(id,{icon:"⚽",kind:"simple",type:"Football",title:"Football",tip:"Le foot est ta seule activité du jour ; le reste du planning en tient compte."});
    if(choice==="wod"){const wod=makeWod(week,id);return make(id,{icon:"⚡",kind:"wod",type:wod.low?"WOD allégé":"WOD cardio",title:`${wod.name} · ${wod.minutes} min`,wod,tip:wod.low?"Récupération basse : WOD allégé, sans chercher l’intensité du foot aujourd’hui.":"Vise un effort global comparable à ton foot habituel, sans aller à l’échec. Renseigne ton ressenti après la séance."});}
    if(choice==="rest")return rest(id);
    if(choice==="no")return easy(id,id===1?p.recovery:p.easy[0]);
    return make(id,{icon:"📅",kind:"pending",type:"À choisir",title:"Foot, WOD, muscu ou course ?",tip:"Choisis ton activité pour adapter la semaine. Une seule séance par jour."});
  };
  let plan={1:optional(1,mon),2:strength(2,"upperA"),3:quality(3),4:strength(4,"lower"),5:optional(5,fri),6:rest(6),0:easy(0,p.long)};
  plan[0].type="Sortie longue";
  if(mon==="strength"){
    plan[2]=easy(2,p.recovery);
    notes.push("Muscu lundi : les séances encore disponibles sont réorganisées pour éviter les doublons.");
  }
  if(hard(fri)){
    plan[3]=strength(3,"lower");plan[4]=rest(4);
    if(hard(mon)){
      plan[2]=strength(2,"upperA");
      notes.push("Deux foot / WOD : aucune nouvelle course clé ajoutée cette semaine.");
    }else{
      plan[2]=quality(2);
      if(mon!=="strength")plan[4]=strength(4,"upperA");
      notes.push("Foot ou WOD vendredi : la course clé et les jambes sont replacées selon les séances déjà commencées.");
    }
    plan[0]=easy(0,Math.min(p.long,60));plan[0].type="Sortie longue adaptée";

  }
  if(fri==="strength")notes.push("Muscu vendredi : groupe musculaire choisi en complément des autres séances.");
  if(light)notes.push("Récupération basse ou semaine allégée : volume muscu réduit et course clé remplacée par du facile.");
  // A logged session never changes exercise names, targets or storage namespace.
  PLAN_DAYS.forEach(id=>{if(a.plan[id]&&hasSessionData(week,id))a.locked[id]=copySession(a.plan[id]);});
  for(const [id,d] of Object.entries(a.locked)){
    if(plan[id].kind!==d.kind || plan[id].strength!==d.strength)notes.push(`${PLAN_NAMES[id]} conservé : séance déjà commencée. Les ajustements portent sur les séances encore disponibles.`);
    plan[id]=copySession(d);
  }
  // Reconcile the new template with sessions that were already logged elsewhere.
  const qualityIds=PLAN_DAYS.filter(id=>plan[id].kind==="quality");
  const loggedQuality=qualityIds.find(id=>a.locked[id]);
  if(loggedQuality!==undefined){
    qualityIds.filter(id=>id!==loggedQuality&&!a.locked[id]).forEach(id=>{
      plan[id]=easy(id,p.recovery);
      notes.push(`${PLAN_NAMES[id]} : course facile, car la séance clé a déjà été commencée un autre jour.`);
    });
  }
  if(hard(fri) && plan[2].kind==="strength" && !a.locked[4])plan[4]=rest(4);
  for(const group of ["upper","lower"]){
    const covers=d=>d.kind==="strength" && (group==="lower"?d.strength==="lower":d.strength!=="lower");
    if(PLAN_DAYS.some(id=>covers(plan[id])))continue;
    const slots=[2,4,3].filter(id=>!a.locked[id] && plan[id].kind!=="strength");
    slots.sort((x,y)=>(plan[x].kind==="quality"?1:0)-(plan[y].kind==="quality"?1:0));
    if(slots.length){
      const id=slots[0];plan[id]=strength(id,group==="lower"?"lower":"upperA");
      notes.push(`${PLAN_NAMES[id]} : muscu réaffectée pour conserver un travail du haut et du bas du corps.`);
    }else notes.push(`Aucun créneau libre pour le ${group==="lower"?"bas":"haut"} du corps sans modifier une séance commencée ou ton choix : pas de séance bonus imposée.`);
  }
  // Choose a complementary strength session if the previous day already trained it.
  PLAN_DAYS.forEach((id,index)=>{
    const d=plan[id];if(d.kind!=="strength"||a.locked[id])return;
    const nextId=PLAN_DAYS[index+1],next=plan[nextId];
    if(a.locked[nextId] && next?.kind==="strength" && (next.strength==="lower")===(d.strength==="lower")){
      plan[id]=(id===1||id===5)?strength(id,next.strength==="lower"?"upperB":"lower"):rest(id);
      notes.push(`${PLAN_NAMES[id]} : ajusté pour ne pas répéter le groupe musculaire de la séance suivante déjà commencée.`);
      return;
    }
    const prev=plan[PLAN_DAYS[index-1]];
    if(prev?.kind==="strength" && (prev.strength==="lower")===(d.strength==="lower")){
      if(id===1||id===5){
        plan[id]=strength(id,prev.strength==="lower"?"upperB":"lower");
        notes.push(`${PLAN_NAMES[id]} : groupe musculaire complémentaire à la séance précédente.`);
      }else{
        plan[id]=easy(id,p.recovery);
        notes.push(`${PLAN_NAMES[id]} : récupération facile pour éviter deux séances du même groupe à la suite.`);
      }
    }
  });
  const hardDays=PLAN_DAYS.filter(id=>["simple","wod","quality"].includes(plan[id].kind));
  if(hardDays.length>2 && plan[5].kind==="simple" && !a.locked[0]){
    plan[0]=rest(0);
    notes.push("La course clé déjà commencée est conservée en plus des deux foot : dimanche passe au repos.");
  }
  if(hardDays.length>2 && plan[5].kind==="wod" && !hasSessionData(week,5)){
    plan[5].wod=makeWod(week,5,true);plan[5].type="WOD allégé";
    plan[5].title=plan[5].wod.name+" · "+plan[5].wod.minutes+" min";
    plan[5].tip="Deux efforts intenses sont déjà conservés : WOD allégé pour ne pas en ajouter un troisième.";
    notes.push("WOD vendredi allégé car deux efforts cardio intenses sont déjà conservés cette semaine.");
  }
  PLAN_DAYS.forEach(id=>{
    const d=plan[id];
    if(!d.prefix)d.prefix=`d${id}-v3-${d.kind}-${d.strength||"cardio"}-${a.rotation%4}`;
  });
  if(hard(fri) && plan[0].kind==="endurance" && plan[0].run.minutes<=60)notes.push("Dimanche limité à 60 min faciles après l’effort intense du vendredi.");
  a.plan=plan;a.notes=[...new Set(notes)];a.programSignature=JSON.stringify(week.program);
}
getDay=function adaptiveDay(dayId){
  const week=currentWeek();ensureAdaptiveWeek(week);
  return week.adaptive?.plan?.[dayId]||baseGetDay(dayId);
};
trainingPrefix=function adaptivePrefix(dayId){return getDay(dayId).prefix||baseTrainingPrefix(dayId);};
function getStrengthConfig(name,week=currentWeek(),dayId=selectedDay){
  const d=week.adaptive?.plan?.[dayId];
  return d?.strength===name && d.strengthConfig ? d.strengthConfig : STRENGTH[name];
}
function previousExerciseSets(exercise){
  const weeks=Object.values(store.weeks).filter(w=>w.key!==currentWeek().key && String(w.startedAt)<=String(currentWeek().startedAt)).sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)));
  for(const week of weeks){
    const sessions=week.adaptive ? Object.values(week.adaptive.plan).filter(d=>d.strength).map(d=>({cfg:d.strengthConfig||STRENGTH[d.strength],prefix:d.kind==="strength-run"?d.prefix+"-strength":d.prefix})) : [{cfg:STRENGTH.upperA,prefix:"d2-strength"},{cfg:STRENGTH.lower,prefix:"d4"},{cfg:STRENGTH.upperB,prefix:"d5-strength"}];
    for(const {cfg,prefix} of sessions){
      const i=cfg.exercises.findIndex(e=>e[0]===exercise);if(i<0)continue;
      const vals=[];for(let n=1;n<=cfg.exercises[i][1];n++){const w=week.data[`${prefix}-ex-${i}-set-${n}-weight`],r=week.data[`${prefix}-ex-${i}-set-${n}-reps`];if(w||r)vals.push(`${w||"—"} kg × ${r||"—"}`);}
      if(vals.length)return vals;
    }
  }
  return [];
}
trackableKeysForDay=function adaptiveTrackable(dayId){
  const d=getDay(dayId),p=trainingPrefix(dayId),keys=[];
  if(!currentWeek().adaptive)return baseTrackableKeys(dayId);
  if(d.kind==="simple"||d.kind==="rest")for(let i=0;i<3;i++)keys.push(`${p}-step-${i}`);
  if(d.kind==="quality"){for(let i=1;i<=d.run.reps;i++)keys.push(`${p}-rep-${i}`);keys.push(`${p}-session-done`);}
  if(d.kind==="endurance")keys.push(`${p}-run-done`);
  if(d.kind==="wod")keys.push(`${p}-wod-done`);
  if(d.strength){const prefix=d.kind==="strength-run"?p+"-strength":p;getStrengthConfig(d.strength,currentWeek(),dayId).exercises.forEach((e,i)=>{for(let n=1;n<=e[1];n++)keys.push(`${prefix}-ex-${i}-set-${n}-done`);});}
  if(d.kind==="strength-run")keys.push(`${p}-run-run-done`);
  return keys;
};
renderFootballChoice=function adaptiveChoice(content,dayId){
  const wrap=document.createElement("div");wrap.className="stack";
  const label=document.createElement("strong");label.textContent=`${PLAN_NAMES[dayId]} : tu veux faire quoi ?`;
  const select=document.createElement("select");select.className="activity-choice-select";select.setAttribute("aria-label",label.textContent);
  [["pending","Choisir une activité"],["yes","Foot"],["wod","WOD à la place du foot"],["strength","Musculation"],["no","Course facile"],["rest","Repos"]].forEach(([value,text])=>{const o=document.createElement("option");o.value=value;o.textContent=text;select.appendChild(o);});
  select.value=currentWeek().football?.[dayId]||"pending";
  select.disabled=currentWeek().key!==store.activeWeekKey||hasSessionData(currentWeek(),dayId);
  const help=document.createElement("small");help.className="microcopy";help.textContent=select.disabled?"Séance commencée ou archivée : planning conservé.":"Ton choix réorganise les séances encore disponibles, sans changer celles déjà commencées.";
  select.addEventListener("change",()=>{const w=currentWeek();if(w.key!==store.activeWeekKey||hasSessionData(w,dayId))return;w.football??={};w.football[dayId]=select.value;delete w.adaptive.locked[dayId];adaptivePlanJustChanged=true;rebuildAdaptivePlan(w,dayId);saveStore();resetTimer();render();});
  wrap.append(label,select,help);content.appendChild(wrap);
};
function renderAdaptiveOverview(){
  let el=document.getElementById("adaptiveOverview");if(!el){el=document.createElement("details");el.id="adaptiveOverview";el.className="panel adaptive-overview";document.getElementById("activityCard").before(el);}
  const week=currentWeek();el.hidden=!week.adaptive;if(!week.adaptive)return;
  const open=el.open;
  el.innerHTML=`<summary>Ta semaine adaptée <span>Variation ${"ABCD"[week.adaptive.rotation%4]}</span></summary><div class="adaptive-plan-rows">${PLAN_DAYS.map(id=>{const d=getDay(id);return `<div class="adaptive-plan-row${id===selectedDay?" selected":""}"><strong>${d.short}</strong><span>${d.title}</span></div>`;}).join("")}</div><div class="adaptive-notes">${week.adaptive.notes.map(n=>`<p>${n}</p>`).join("")}<p>Exercices renouvelés chaque semaine ; même variation après quatre cycles. Séances commencées conservées.</p></div>`;
  el.open=open||adaptivePlanJustChanged;adaptivePlanJustChanged=false;
}
function renderWodSession(day,prefix){
  const box=document.createElement("div");box.className="stack";const w=day.wod;
  const info=document.createElement("div");info.className="soft-card";
  info.innerHTML=`<strong>${w.equipment} · effort global visé ${w.rpe}/10</strong><p>10 min progressives · ${w.reps} × (${formatTime(w.work)} soutenues + ${formatTime(w.rest)} faciles) · 10 min de retour au calme.</p><p>Blocs soutenus à ${w.low?"6–7":"7–8"}/10, récupérations à 3–4/10. L’effort reste contrôlé.</p>`;box.appendChild(info);
  if(currentWeek().key===store.activeWeekKey&&!hasSessionData(currentWeek(),selectedDay)){
    const label=document.createElement("label");label.className="stack";label.textContent="Durée de ton foot habituel";
    const select=document.createElement("select");select.className="activity-choice-select";select.setAttribute("aria-label",label.textContent);
    [30,45,60,75,90].forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n+" min";select.appendChild(o);});select.value=currentWeek().wodReference?.minutes||60;
    select.addEventListener("change",()=>{currentWeek().wodReference={minutes:Number(select.value),rpe:currentWeek().wodReference?.rpe||7};rebuildAdaptivePlan(currentWeek(),selectedDay);saveStore();resetTimer();render();});label.appendChild(select);box.appendChild(label);
    const effortLabel=document.createElement("label");effortLabel.className="stack";effortLabel.textContent="Effort global habituel au foot / 10";
    const effort=document.createElement("select");effort.className="activity-choice-select";effort.setAttribute("aria-label",effortLabel.textContent);
    [6,7,8].forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n+"/10";effort.appendChild(o);});effort.value=currentWeek().wodReference?.rpe||7;
    effort.addEventListener("change",()=>{currentWeek().wodReference={minutes:currentWeek().wodReference?.minutes||60,rpe:Number(effort.value)};rebuildAdaptivePlan(currentWeek(),selectedDay);saveStore();resetTimer();render();});effortLabel.appendChild(effort);box.appendChild(effortLabel);
  }
  const note=document.createElement("p");note.className="microcopy";note.textContent="Repère de comparaison : durée × effort ressenti. Le WOD vise une intensité proche du foot, avec des sollicitations différentes.";box.appendChild(note);
  const timerButton=document.createElement("button");timerButton.type="button";timerButton.className="primary-button";timerButton.textContent="Lancer le WOD guidé";
  timerButton.addEventListener("click",()=>{
    resetTimer();timer.open=true;timer.label=day.title;timer.segments=[{type:"warmup",seconds:w.warmup,label:"Échauffement progressif"}];
    for(let i=1;i<=w.reps;i++){timer.segments.push({type:"work",seconds:w.work,label:`Bloc ${i}/${w.reps} · ${w.equipment}`},{type:"recovery",seconds:w.rest,label:"Récupération facile"});}
    timer.segments.push({type:"cooldown",seconds:w.cooldown,label:"Retour au calme"});timer.remaining=timer.segments[0].seconds;renderTimer();document.getElementById("timerPanel").scrollIntoView({behavior:"smooth",block:"center"});
  });box.appendChild(timerButton);
  box.appendChild(checkboxRow(`${prefix}-wod-done`,"WOD terminé"));
  const durationLabel=document.createElement("label");durationLabel.className="stack";durationLabel.textContent="Durée réellement effectuée (min)";
  const duration=document.createElement("input");duration.type="number";duration.min="1";duration.max="180";duration.inputMode="numeric";duration.setAttribute("aria-label",durationLabel.textContent);duration.value=stateGet(`${prefix}-actual-minutes`,w.minutes);durationLabel.appendChild(duration);box.appendChild(durationLabel);
  const label=document.createElement("label");label.className="stack";label.textContent="Effort global ressenti après le WOD / 10";
  const input=document.createElement("select");input.className="activity-choice-select";input.setAttribute("aria-label",label.textContent);input.innerHTML='<option value="">À renseigner après la séance</option>'+Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}/10</option>`).join("");input.value=stateGet(`${prefix}-rpe`,"");
  const result=document.createElement("small");result.className="microcopy";
  const show=()=>result.textContent=input.value?`Charge ressentie estimée : ${Number(duration.value)*Number(input.value)} unités · repère foot : ${(currentWeek().wodReference?.minutes||60)*(currentWeek().wodReference?.rpe||7)} unités.`:"";
  duration.addEventListener("change",()=>{const n=Number(duration.value);if(n>=1&&n<=180)stateSet(`${prefix}-actual-minutes`,n);show();});
  input.addEventListener("change",()=>{stateSet(`${prefix}-rpe`,input.value);show();});show();label.append(input,result);box.appendChild(label);return box;
}
["sleepInput","energyInput","legsInput"].forEach(id=>{
  document.getElementById(id).addEventListener("change",()=>{
    if(currentWeek().key!==store.activeWeekKey)return;
    ensureAdaptiveWeek();rebuildAdaptivePlan(currentWeek(),selectedDay);saveStore();render();
  });
});
ensureAdaptiveWeek();
