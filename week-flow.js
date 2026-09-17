(() => {
  let viewedWeekKey = store.activeWeekKey;

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
    const next = nextTrainingPosition(week.program);
    const nextBlock = PROGRAM[next.block];
    const nextPlan = nextBlock.weeks[next.week - 1];
    const recovery = week.recovery || {};
    const missingDays = Math.max(0, 7 - stats.completedDays);
    const changesBlock = next.block !== week.program.block;

    document.getElementById("weekRecapTitle").textContent = `Semaine ${week.cycleNumber || "—"} · ${stats.percent}% complétée`;
    document.getElementById("weekRecapContent").innerHTML = `
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
          <span>PB 10 km <strong>${formatTime(store.settings.pbSeconds || BASELINE_10K)}</strong></span>
        </div>
      </div>
      <div class="recap-section next-week-preview">
        <div class="recap-section-title">
          <span>Prochaine semaine</span>
          <small>${nextBlock.name} · Semaine ${next.week}/${nextBlock.weeks.length}${nextPlan.deload ? " · DELOAD" : ""}</small>
        </div>
        <div class="next-week-items">
          <div><span>Mercredi</span><strong>${nextPlan.quality.title}</strong><small>${nextPlan.quality.pace}</small></div>
          <div><span>Vendredi</span><strong>${nextPlan.easy[0]} min facile</strong><small>${nextPlan.easy[1] ? `+ ${nextPlan.easy[1]} strides` : "sans strides"}</small></div>
          <div><span>Dimanche</span><strong>${nextPlan.long} min</strong><small>sortie longue</small></div>
        </div>
      </div>
      ${missingDays ? `<p class="recap-warning">${missingDays} jour${missingDays > 1 ? "s" : ""} n'est pas entièrement complété. Tu peux quand même valider si tu veux avancer.</p>` : `<p class="recap-success">Semaine entièrement complétée. Les données seront conservées dans l'historique.</p>`}`;

    const confirmText = changesBlock
      ? `Cette validation termine ${PROGRAM[week.program.block].name} et démarre ${nextBlock.name}, semaine 1.`
      : `Cette validation archive la semaine actuelle et charge immédiatement la semaine ${next.week}.`;
    document.getElementById("weekRecapConfirmationText").textContent = confirmText;
    document.getElementById("confirmWeekValidation").textContent = changesBlock ? `Valider & démarrer ${nextBlock.name.replace(/^Bloc \d+ · /, "")}` : "Valider & démarrer la semaine suivante";
    document.getElementById("weekRecapDialog").showModal();
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
    document.getElementById("cancelWeekValidation").addEventListener("click", () => document.getElementById("weekRecapDialog").close());
    document.getElementById("confirmWeekValidation").addEventListener("click", advanceToNextTrainingWeek);
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
