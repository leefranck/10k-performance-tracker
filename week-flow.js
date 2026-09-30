(() => {
  let viewedWeekKey = store.activeWeekKey;
  let pendingWeekDecision = "advance";

  // The training cycle is now advanced only through explicit user validation.
  // Calendar rollovers are intentionally ignored so a missed week never skips training.
  try {
    rolloverDismissed = true;
    showRolloverIfNeeded = () => {};
    const rollover = document.getElementById("rolloverDialog");
    if (rollover?.open) rollover.close();
  } catch {}

  // Older V2 builds could mark the active week as validated without advancing it.
  // Convert that state back to an actionable active week once.
  const activeAtBoot = store.weeks[store.activeWeekKey];
  if (activeAtBoot?.status === "active" && activeAtBoot.validated) {
    activeAtBoot.legacyValidatedAt = activeAtBoot.validatedAt || null;
    activeAtBoot.validated = false;
    activeAtBoot.validatedAt = null;
  }

  normalizeCycleNumbers();
  saveStore();

  // All existing rendering helpers now operate on the week currently being viewed.
  currentWeek = function currentViewedWeek() {
    return store.weeks[viewedWeekKey] || store.weeks[store.activeWeekKey];
  };

  injectWeekViewBanner();
  injectRecapDialog();

  const originalRender = render;
  render = function renderWithWeekNavigation() {
    originalRender();
    syncWeekNavigationUI();
  };

  // History becomes actionable: any saved week can be reopened.
  renderHistory = renderInteractiveHistory;

  // Keep legacy entry points safe, but use the new manual progression logic.
  archiveAndCreateNewWeek = function archiveAndAdvance() {
    advanceToNextTrainingWeek();
  };

  bindWeekFlowEvents();
  render();

  function normalizeCycleNumbers() {
    const weeks = Object.values(store.weeks).sort((a, b) => {
      const aDate = new Date(a.startedAt || a.completedAt || 0).getTime();
      const bDate = new Date(b.startedAt || b.completedAt || 0).getTime();
      return aDate - bDate;
    });
    weeks.forEach((week, index) => {
      if (!Number.isFinite(Number(week.cycleNumber))) week.cycleNumber = index + 1;
    });
  }

  function nextTrainingPosition(program) {
    const currentBlock = PROGRAM[program.block];
    if (program.week < currentBlock.weeks.length) {
      return { block: program.block, week: program.week + 1 };
    }

    const nextBlock = nextBlockName(program.block);
    if (nextBlock) return { block: nextBlock, week: 1 };

    // After the final specific week, keep the final specific template available
    // rather than silently inventing a fourth block.
    return { block: program.block, week: currentBlock.weeks.length };
  }

  function nextCycleNumber() {
    return Math.max(0, ...Object.values(store.weeks).map((w) => Number(w.cycleNumber) || 0)) + 1;
  }

  function uniqueWeekKey() {
    let key = `cycle-${Date.now()}`;
    let suffix = 2;
    while (store.weeks[key]) key = `cycle-${Date.now()}-${suffix++}`;
    return key;
  }

  function withViewedWeek(key, fn) {
    const previous = viewedWeekKey;
    viewedWeekKey = key;
    try {
      return fn();
    } finally {
      viewedWeekKey = previous;
    }
  }

  function completionForWeek(key) {
    return withViewedWeek(key, () => {
      const allKeys = [1, 2, 3, 4, 5, 6, 0].flatMap(trackableKeysForDay);
      const done = allKeys.filter((k) => Boolean(stateGet(k))).length;
      const completedDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => dayCompletion(day) >= 0.99).length;
      const startedDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => dayCompletion(day) > 0).length;
      const strengthKeys = allKeys.filter((k) => k.includes("-ex-") && k.endsWith("-done"));
      const strengthDone = strengthKeys.filter((k) => Boolean(stateGet(k))).length;
      const runKeys = allKeys.filter((k) => k.includes("-rep-") || k.endsWith("-run-done") || k.endsWith("-session-done"));
      const runDone = runKeys.filter((k) => Boolean(stateGet(k))).length;
      return {
        total: allKeys.length,
        done,
        percent: allKeys.length ? Math.round((done / allKeys.length) * 100) : 0,
        completedDays,
        startedDays,
        strengthDone,
        strengthTotal: strengthKeys.length,
        runDone,
        runTotal: runKeys.length
      };
    });
  }

  function weeklyRecommendation(week, stats) {
    return withViewedWeek(week.key, () => {
      const recovery = week.recovery || {};
      const feelings = [1,2,3,4,5,6,0]
        .map((day) => Number(stateGet(`d${day}-feeling`, 0)))
        .filter((value) => value >= 1 && value <= 5);
      const avgFeeling = feelings.length ? feelings.reduce((sum, value) => sum + value, 0) / feelings.length : null;
      const runRate = stats.runTotal ? stats.runDone / stats.runTotal : 1;
      const strengthRate = stats.strengthTotal ? stats.strengthDone / stats.strengthTotal : 1;
      const energy = Number(recovery.energy) || null;
      const legs = Number(recovery.legs) || null;
      const sleep = Number(recovery.sleep) || null;

      let score = 0;
      const reasons = [];
      if (stats.percent >= 85) { score += 2; reasons.push(`${stats.percent}% du plan validé`); }
      else if (stats.percent >= 70) { score += 1; reasons.push(`${stats.percent}% du plan validé`); }
      else { score -= 2; reasons.push(`seulement ${stats.percent}% du plan validé`); }

      if (runRate >= .9) { score += 3; reasons.push("running clé bien réalisé"); }
      else if (runRate >= .7) { score += 1; reasons.push("running majoritairement réalisé"); }
      else { score -= 3; reasons.push("trop d’objectifs running manquants"); }

      if (strengthRate >= .75) score += 1;
      else if (strengthRate < .5) score -= 1;

      if (avgFeeling !== null) {
        if (avgFeeling >= 3.5) { score += 1; reasons.push(`ressenti moyen ${avgFeeling.toFixed(1)}/5`); }
        else if (avgFeeling < 2.5) { score -= 2; reasons.push(`ressenti difficile (${avgFeeling.toFixed(1)}/5)`); }
      }
      if (energy !== null && energy <= 2) { score -= 1; reasons.push(`énergie basse (${energy}/5)`); }
      if (legs !== null && legs <= 2) { score -= 2; reasons.push(`jambes fatiguées (${legs}/5)`); }
      if (sleep !== null && sleep < 6) { score -= 1; reasons.push(`sommeil faible (${sleep} h)`); }

      const hardStop = runRate < .6 || stats.percent < 60 || (legs !== null && legs <= 1) || (avgFeeling !== null && avgFeeling < 2);
      const action = !hardStop && score >= 2 ? "advance" : "repeat";
      const runPercent = Math.round(runRate * 100);
      const strengthPercent = Math.round(strengthRate * 100);
      const blockers = [];
      if (runRate < .7) blockers.push({ priority: 100, text: `Tu n’as validé que ${runPercent}% des objectifs running. Passer à une semaine plus exigeante maintenant augmenterait la charge alors que la charge actuelle n’est pas encore maîtrisée.` });
      if (stats.percent < 70) blockers.push({ priority: 90, text: `Tu as validé ${stats.percent}% du programme total. Il manque encore une part importante de la semaine pour considérer cette charge comme assimilée.` });
      if (avgFeeling !== null && avgFeeling < 2.5) blockers.push({ priority: 80, text: `Ton ressenti moyen est de ${avgFeeling.toFixed(1)}/5. Même si certaines séances sont passées, elles t’ont coûté trop cher pour augmenter la difficulté tout de suite.` });
      if (legs !== null && legs <= 2) blockers.push({ priority: 75, text: `Tes jambes sont à ${legs}/5 en récupération. Le frein vient ici surtout de la fatigue résiduelle, pas forcément de ton niveau.` });
      if (energy !== null && energy <= 2) blockers.push({ priority: 65, text: `Ton énergie est à ${energy}/5, ce qui indique que tu n’as pas encore complètement absorbé la semaine.` });
      if (sleep !== null && sleep < 6) blockers.push({ priority: 55, text: `Tu déclares ${sleep} h de sommeil. Une récupération aussi courte rend la progression moins fiable cette semaine.` });
      if (strengthRate < .5) blockers.push({ priority: 35, text: `Seulement ${strengthPercent}% du travail de musculation a été validé. C’est un signal secondaire, mais il réduit la qualité globale de la semaine hybride.` });
      blockers.sort((a, b) => b.priority - a.priority);

      let diagnosis;
      let target;
      if (action === "repeat") {
        diagnosis = blockers[0]?.text || `Ton score global de progression reste insuffisant malgré certains bons indicateurs. Refaire la semaine permet de vérifier que tu peux maîtriser cette charge de façon reproductible.`;
        const targets = [];
        if (runRate < .9) targets.push("valider au moins 90% des objectifs running");
        if (stats.percent < 85) targets.push("atteindre au moins 85% du programme");
        if (avgFeeling !== null && avgFeeling < 3.5) targets.push("retrouver un ressenti moyen d’au moins 3,5/5");
        if (legs !== null && legs < 3) targets.push("retrouver des jambes à au moins 3/5");
        if (energy !== null && energy < 3) targets.push("retrouver une énergie à au moins 3/5");
        target = targets.length
          ? `Pour débloquer la progression : ${targets.slice(0, 3).join(", ")}.`
          : "Objectif : refaire la charge actuelle avec plus de maîtrise et une récupération stable.";
      } else {
        diagnosis = `Tu as suffisamment maîtrisé la charge actuelle : ${runPercent}% du running prévu est validé et tes autres indicateurs ne montrent pas de frein majeur.`;
        target = "Tu peux augmenter progressivement la charge tout en continuant à surveiller ton ressenti et ta récupération.";
      }
      return { action, score, runRate, strengthRate, avgFeeling, energy, legs, sleep, reasons: reasons.slice(0, 4), diagnosis, target, blockers: blockers.map((item) => item.text) };
    });
  }

  function weekLabel(week) {
    const block = PROGRAM[week.program.block];
    return `${block.name} · Semaine ${week.program.week}/${block.weeks.length}`;
  }

  function formatWeekDate(week) {
    const raw = week.completedAt || week.startedAt;
    if (!raw) return "";
    try {
      return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(raw));
    } catch {
      return "";
    }
  }

  function injectWeekViewBanner() {
    if (document.getElementById("weekViewBanner")) return;
    const banner = document.createElement("section");
    banner.id = "weekViewBanner";
    banner.className = "week-view-banner hidden";
    banner.innerHTML = `
      <div class="week-view-copy">
        <span class="week-view-kicker">SEMAINE PRÉCÉDENTE</span>
        <strong id="weekViewTitle"></strong>
      </div>
      <div class="week-view-actions">
        <button id="previousSavedWeek" class="week-nav-button" type="button" aria-label="Semaine précédente">←</button>
        <button id="nextSavedWeek" class="week-nav-button" type="button" aria-label="Semaine suivante">→</button>
        <button id="returnCurrentWeek" class="secondary-button" type="button">Semaine actuelle</button>
      </div>`;
    const accordion = document.getElementById("programAccordion");
    accordion.insertAdjacentElement("afterend", banner);
  }

  function injectRecapDialog() {
    if (document.getElementById("weekRecapDialog")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="weekRecapDialog" class="week-recap-dialog">
        <div class="settings-card recap-card">
          <div class="panel-head recap-sticky-head">
            <div>
              <p class="eyebrow">RÉCAP DE LA SEMAINE</p>
              <h2 id="weekRecapTitle">Valider cette semaine ?</h2>
            </div>
            <button id="closeWeekRecap" class="icon-button" type="button" aria-label="Fermer">✕</button>
          </div>
          <div id="weekRecapContent"></div>
          <div class="recap-confirmation">
            <p id="weekRecapConfirmationText" class="microcopy"></p>
            <div class="dialog-actions">
              <button id="cancelWeekValidation" class="secondary-button" type="button">Continuer la semaine</button>
              <button id="confirmWeekValidation" class="primary-button" type="button">Valider & continuer</button>
            </div>
          </div>
        </div>
      </dialog>`);
  }

  function syncWeekNavigationUI() {
    const viewingHistorical = viewedWeekKey !== store.activeWeekKey;
    const banner = document.getElementById("weekViewBanner");
    const button = document.getElementById("completeWeekButton");

    if (!viewingHistorical) {
      banner.classList.add("hidden");
      button.disabled = false;
      button.textContent = "Valider la semaine";
      return;
    }

    const week = currentWeek();
    banner.classList.remove("hidden");
    document.getElementById("weekViewTitle").textContent = `Semaine ${week.cycleNumber || "—"} · ${weekLabel(week)}`;
    button.disabled = true;
    button.textContent = "Semaine archivée";

    const ordered = orderedWeeks();
    const index = ordered.findIndex((w) => w.key === viewedWeekKey);
    document.getElementById("previousSavedWeek").disabled = index <= 0;
    document.getElementById("nextSavedWeek").disabled = index < 0 || index >= ordered.length - 1;
  }

  function orderedWeeks() {
    return Object.values(store.weeks).sort((a, b) => {
      const ac = Number(a.cycleNumber) || 0;
      const bc = Number(b.cycleNumber) || 0;
      if (ac !== bc) return ac - bc;
      return String(a.startedAt || "").localeCompare(String(b.startedAt || ""));
    });
  }

  function viewWeek(key) {
    if (!store.weeks[key]) return;
    viewedWeekKey = key;
    resetTimer();
    selectedDay = chooseDefaultDay();
    render();
    const history = document.getElementById("historyDialog");
    if (history?.open) history.close();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openWeekRecap() {
    if (viewedWeekKey !== store.activeWeekKey) return;
    const week = store.weeks[store.activeWeekKey];
    const stats = completionForWeek(week.key);
    const recommendation = weeklyRecommendation(week, stats);
    pendingWeekDecision = recommendation.action;
    const next = nextTrainingPosition(week.program);
    const nextBlock = PROGRAM[next.block];
    const nextPlan = nextBlock.weeks[next.week - 1];
    const recovery = week.recovery || {};
    const missingDays = Math.max(0, 7 - stats.completedDays);
    const changesBlock = next.block !== week.program.block;
    const recommendationTitle = recommendation.action === "advance"
      ? `Tu peux passer à la semaine ${next.week}`
      : `Je te conseille de refaire cette semaine`;
    const recommendationText = recommendation.diagnosis;
    const reasonItems = recommendation.reasons.map((reason) => `<li>${reason}</li>`).join("");
    const blockersHtml = recommendation.action === "repeat" && recommendation.blockers.length > 1
      ? `<div class="week-recommendation-details"><span>Autres signaux</span><ul>${recommendation.blockers.slice(1, 3).map((item) => `<li>${item}</li>`).join("")}</ul></div>`
      : "";

    document.getElementById("weekRecapTitle").textContent = `Semaine ${week.cycleNumber || "—"} · ${stats.percent}% complétée`;
    document.getElementById("weekRecapContent").innerHTML = `
      <div class="week-recommendation ${recommendation.action}">
        <span class="week-recommendation-kicker">RECOMMANDATION</span>
        <strong>${recommendationTitle}</strong>
        <p>${recommendationText}</p>
        <ul>${reasonItems}</ul>
        ${blockersHtml}
        <div class="week-recommendation-target"><span>OBJECTIF POUR PROGRESSER</span><strong>${recommendation.target}</strong></div>
      </div>
      <div class="recap-score-card">
        <div class="recap-score-main"><strong>${stats.percent}%</strong><span>progression enregistrée</span></div>
        <div class="recap-progress"><span style="width:${stats.percent}%"></span></div>
      </div>
      <div class="recap-metrics">
        <div><strong>${stats.completedDays}/7</strong><span>jours complétés</span></div>
        <div><strong>${stats.strengthDone}/${stats.strengthTotal}</strong><span>séries muscu validées</span></div>
        <div><strong>${stats.runDone}/${stats.runTotal}</strong><span>étapes running</span></div>
      </div>
      <div class="recap-section">
        <div class="recap-section-title"><span>Récupération</span><small>${recovery.sleep ? `${recovery.sleep} h de sommeil` : "non renseignée"}</small></div>
        <div class="recap-recovery-row">
          <span>Énergie <strong>${recovery.energy || "—"}/5</strong></span>
          <span>Jambes <strong>${recovery.legs || "—"}/5</strong></span>
          <span>Ressenti <strong>${recommendation.avgFeeling ? recommendation.avgFeeling.toFixed(1) : "—"}/5</strong></span>
        </div>
      </div>
      <div class="recap-section next-week-preview">
        <div class="recap-section-title">
          <span>Si tu progresses</span>
          <small>${nextBlock.name} · Semaine ${next.week}/${nextBlock.weeks.length}${nextPlan.deload ? " · DELOAD" : ""}</small>
        </div>
        <div class="next-week-items">
          <div><span>Mercredi</span><strong>${nextPlan.quality.title}</strong><small>${nextPlan.quality.pace}</small></div>
          <div><span>Vendredi</span><strong>${nextPlan.easy[0]} min facile</strong><small>${nextPlan.easy[1] ? `+ ${nextPlan.easy[1]} strides` : "sans strides"}</small></div>
          <div><span>Dimanche</span><strong>${nextPlan.long} min</strong><small>sortie longue</small></div>
        </div>
      </div>
      ${missingDays ? `<p class="recap-warning">${missingDays} jour${missingDays > 1 ? "s" : ""} n'est pas entièrement complété.</p>` : `<p class="recap-success">Semaine entièrement complétée. Les données seront conservées dans l'historique.</p>`}`;

    document.getElementById("weekRecapConfirmationText").textContent =
      "La recommandation est présélectionnée, mais tu gardes le choix final.";
    const confirm = document.getElementById("confirmWeekValidation");
    const cancel = document.getElementById("cancelWeekValidation");
    if (recommendation.action === "advance") {
      confirm.textContent = changesBlock ? `Passer à ${nextBlock.name.replace(/^Bloc \d+ · /, "")}` : `Passer à la semaine ${next.week}`;
      cancel.textContent = "Refaire cette semaine";
    } else {
      confirm.textContent = "Refaire cette semaine";
      cancel.textContent = changesBlock ? `Passer à ${nextBlock.name.replace(/^Bloc \d+ · /, "")}` : `Passer quand même à la semaine ${next.week}`;
    }
    document.getElementById("weekRecapDialog").showModal();
  }

  function repeatCurrentTrainingWeek() {
    const old = store.weeks[store.activeWeekKey];
    if (!old) return;
    old.status = "archived";
    old.validated = true;
    old.validatedAt = new Date().toISOString();
    old.completedAt = old.validatedAt;
    old.pbSnapshot = store.settings.pbSeconds;
    old.weekDecision = "repeat";
    old.weekRecommendation = weeklyRecommendation(old, completionForWeek(old.key));

    const newKey = uniqueWeekKey();
    const repeated = createWeek(newKey, { ...old.program });
    repeated.cycleNumber = nextCycleNumber();
    repeated.previousWeekKey = old.key;
    repeated.repeatedFromWeekKey = old.key;
    old.nextWeekKey = newKey;
    store.weeks[newKey] = repeated;
    store.activeWeekKey = newKey;
    viewedWeekKey = newKey;
    saveStore();

    const recap = document.getElementById("weekRecapDialog");
    if (recap?.open) recap.close();
    resetTimer();
    selectedDay = chooseDefaultDay();
    render();
    showWeekToast(`Semaine ${repeated.cycleNumber} chargée · même programme pour consolider`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyRecommendedDecision(useRecommended = true) {
    const recommendation = pendingWeekDecision;
    const action = useRecommended ? recommendation : (recommendation === "advance" ? "repeat" : "advance");
    if (action === "repeat") repeatCurrentTrainingWeek();
    else advanceToNextTrainingWeek();
  }

  function advanceToNextTrainingWeek() {
    const old = store.weeks[store.activeWeekKey];
    if (!old) return;

    const nextPosition = nextTrainingPosition(old.program);
    old.status = "archived";
    old.validated = true;
    old.validatedAt = new Date().toISOString();
    old.completedAt = old.validatedAt;
    old.pbSnapshot = store.settings.pbSeconds;
    old.weekDecision = "advance";
    old.weekRecommendation = weeklyRecommendation(old, completionForWeek(old.key));

    const newKey = uniqueWeekKey();
    const next = createWeek(newKey, nextPosition);
    next.cycleNumber = nextCycleNumber();
    next.previousWeekKey = old.key;
    old.nextWeekKey = newKey;

    store.weeks[newKey] = next;
    store.activeWeekKey = newKey;
    viewedWeekKey = newKey;
    saveStore();

    const recap = document.getElementById("weekRecapDialog");
    if (recap?.open) recap.close();
    resetTimer();
    selectedDay = chooseDefaultDay();
    render();
    showWeekToast(`Semaine ${next.cycleNumber} chargée · ${weekLabel(next)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderInteractiveHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    const weeks = orderedWeeks().reverse();

    weeks.forEach((week) => {
      const stats = completionForWeek(week.key);
      const item = document.createElement("article");
      item.className = `history-item history-week-card${week.key === viewedWeekKey ? " is-viewed" : ""}`;
      const isActive = week.key === store.activeWeekKey;
      item.innerHTML = `
        <div class="history-head">
          <div>
            <span class="history-week-number">Semaine ${week.cycleNumber || "—"}</span>
            <strong>${weekLabel(week)}</strong>
          </div>
          <span class="pill">${isActive ? "actuelle" : "archivée"}</span>
        </div>
        <div class="history-week-stats">
          <span><strong>${stats.percent}%</strong> complété</span>
          <span><strong>${stats.completedDays}/7</strong> jours</span>
          <span><strong>${stats.strengthDone}</strong> séries muscu</span>
        </div>
        <small>${formatWeekDate(week)} · PB ${formatTime(week.pbSnapshot || store.settings.pbSeconds)}</small>
        <button class="secondary-button history-open-week" type="button" ${week.key === viewedWeekKey ? "disabled" : ""}>${week.key === viewedWeekKey ? "Semaine affichée" : "Voir cette semaine"}</button>`;
      const open = item.querySelector(".history-open-week");
      if (!open.disabled) open.addEventListener("click", () => viewWeek(week.key));
      list.appendChild(item);
    });
  }

  function showWeekToast(message) {
    let toast = document.getElementById("weekFlowToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "weekFlowToast";
      toast.className = "week-flow-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showWeekToast.timeout);
    showWeekToast.timeout = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function bindWeekFlowEvents() {
    const validateButton = document.getElementById("completeWeekButton");
    validateButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWeekRecap();
    }, true);

    document.getElementById("closeWeekRecap").addEventListener("click", () => document.getElementById("weekRecapDialog").close());
    document.getElementById("cancelWeekValidation").addEventListener("click", () => applyRecommendedDecision(false));
    document.getElementById("confirmWeekValidation").addEventListener("click", () => applyRecommendedDecision(true));
    document.getElementById("returnCurrentWeek").addEventListener("click", () => viewWeek(store.activeWeekKey));

    document.getElementById("previousSavedWeek").addEventListener("click", () => {
      const weeks = orderedWeeks();
      const index = weeks.findIndex((w) => w.key === viewedWeekKey);
      if (index > 0) viewWeek(weeks[index - 1].key);
    });

    document.getElementById("nextSavedWeek").addEventListener("click", () => {
      const weeks = orderedWeeks();
      const index = weeks.findIndex((w) => w.key === viewedWeekKey);
      if (index >= 0 && index < weeks.length - 1) viewWeek(weeks[index + 1].key);
    });
  }
})();
