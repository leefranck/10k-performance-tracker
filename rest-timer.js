(() => {
  const KEY="tenk-rest-timer-v1";
  let interval=null, audioContext=null;
  const defaultSeconds=()=>Math.max(15,Math.min(600,Number(store.settings.restSeconds)||90));
  let state={duration:defaultSeconds(),remaining:defaultSeconds(),deadline:null,status:"ready",exercise:"",week:store.activeWeekKey};
  try {
    const saved=JSON.parse(sessionStorage.getItem(KEY));
    if(saved?.week===store.activeWeekKey && Number.isFinite(saved.duration) && saved.duration>=15 && saved.duration<=600 && Number.isFinite(saved.remaining) && saved.remaining>=0 && saved.remaining<=600 && ["ready","running","paused","done"].includes(saved.status) && (saved.status!=="running"||Number.isFinite(saved.deadline)))state={...state,...saved};
  } catch {}
  function persist(){sessionStorage.setItem(KEY,JSON.stringify(state));}
  function remaining(){return state.status==="running"?Math.max(0,(state.deadline-Date.now())/1000):state.remaining;}
  function stopInterval(){clearInterval(interval);interval=null;}
  function signal(){
    if(navigator.vibrate)navigator.vibrate([150,80,150]);
    if(audioContext?.state==="running"){
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.frequency.value=660;
      gain.gain.setValueAtTime(.15,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.35);
      oscillator.start();oscillator.stop(audioContext.currentTime+.35);
    }
  }
  function tick(){
    if(state.week!==store.activeWeekKey){stopInterval();state={duration:defaultSeconds(),remaining:defaultSeconds(),deadline:null,status:"ready",exercise:"",week:store.activeWeekKey};persist();sync();return;}
    if(state.status==="running"&&remaining()<=0){state.remaining=0;state.deadline=null;state.status="done";stopInterval();persist();signal();}
    sync();
  }
  function enableSound(){
    try {const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audioContext??=new Audio();audioContext.resume().catch(()=>{});}}catch{}
  }
  function startPause(){
    if(state.status==="running"){
      state.remaining=remaining();state.deadline=null;state.status="paused";stopInterval();
    }else{
      if(state.status==="done"||state.remaining<=0)state.remaining=state.duration;
      state.deadline=Date.now()+state.remaining*1000;state.status="running";enableSound();stopInterval();interval=setInterval(tick,200);
    }
    persist();sync();
  }
  function reset(){stopInterval();state.remaining=state.duration;state.deadline=null;state.status="ready";persist();sync();}
  function duration(seconds,fresh=false){
    const next=Math.max(15,Math.min(600,seconds)),delta=next-state.duration;
    const nextRemaining=fresh?next:Math.max(0,Math.min(600,remaining()+delta));
    state.duration=next;store.settings.restSeconds=next;saveStore();
    if(state.status==="running"){state.remaining=nextRemaining;state.deadline=Date.now()+nextRemaining*1000;}
    else if(state.status==="paused")state.remaining=nextRemaining;
    else {state.remaining=next;state.status="ready";}
    persist();tick();
  }
  function sync(){
    const el=document.getElementById("restTimer");if(!el)return;
    const display=el.querySelector(".rest-clock");display.textContent=formatTime(Math.ceil(remaining()));
    el.querySelector(".rest-toggle").textContent=state.status==="running"?"Pause":state.status==="paused"?"Reprendre":state.status==="done"?"Relancer":"Démarrer";
    const status=el.querySelector(".rest-status");
    const text=state.status==="done"?"Repos terminé · prochaine série":state.status==="running"?"Repos en cours":state.status==="paused"?"Chrono en pause":"Démarrage manuel après ta série";
    if(status.textContent!==text)status.textContent=text;
    el.classList.toggle("rest-finished",state.status==="done");
    el.querySelector(".rest-exercise").textContent=state.exercise?`Après : ${state.exercise}`:"Entre tes séries";
    el.querySelectorAll("[data-rest]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.rest)===state.duration)));
    el.querySelector(".rest-duration").textContent=`Repos réglé : ${formatTime(state.duration)}`;
  }
  window.notifyRestSet=function(exercise){state.exercise=exercise;persist();sync();};
  window.renderRestTimer=function(){
    if(state.week!==store.activeWeekKey){stopInterval();state={duration:defaultSeconds(),remaining:defaultSeconds(),deadline:null,status:"ready",exercise:"",week:store.activeWeekKey};persist();}
    const el=document.createElement("section");el.id="restTimer";el.className="rest-timer";el.setAttribute("aria-label","Chrono de repos entre les séries");
    el.innerHTML=`<div class="rest-heading"><div><strong>Temps de repos</strong><small class="rest-exercise"></small></div><output class="rest-clock" aria-label="Temps de repos restant">00:00</output></div><div class="rest-presets" role="group" aria-label="Durée du repos">${[60,90,120,180].map(n=>`<button type="button" data-rest="${n}">${formatTime(n)}</button>`).join("")}</div><div class="rest-actions"><button type="button" class="secondary-button rest-minus" aria-label="Retirer 15 secondes de repos">−15 s</button><button type="button" class="primary-button rest-toggle">Démarrer</button><button type="button" class="secondary-button rest-plus" aria-label="Ajouter 15 secondes de repos">+15 s</button><button type="button" class="ghost-button rest-reset" aria-label="Réinitialiser le chrono de repos">↺</button></div><div class="rest-caption"><small class="rest-status" role="status"></small><small class="rest-duration"></small></div>`;
    el.querySelector(".rest-toggle").addEventListener("click",startPause);
    el.querySelector(".rest-reset").addEventListener("click",reset);
    el.querySelector(".rest-minus").addEventListener("click",()=>duration(state.duration-15));
    el.querySelector(".rest-plus").addEventListener("click",()=>duration(state.duration+15));
    el.querySelectorAll("[data-rest]").forEach(b=>b.addEventListener("click",()=>duration(Number(b.dataset.rest),true)));
    // The parent renderer attaches this element before the next animation frame.
    requestAnimationFrame(sync);return el;
  };
  document.addEventListener("visibilitychange",tick);
  if(state.status==="running")interval=setInterval(tick,200);
})();
