(() => {
  const originalTrackableKeysForDay = trackableKeysForDay;
  trackableKeysForDay = function trackableKeysWithDailyValidation(dayId) {
    const base = originalTrackableKeysForDay(dayId).filter((key) => key !== `d${dayId}-day-validated`);
    return [...base, `d${dayId}-day-validated`];
  };

  let pendingDayAction = null;
  const CARD_STATE_PREFIX = "tenk-card-open";

  function cardStateKey(id) {
    const weekKey = currentWeek()?.key || store.activeWeekKey || "current";
    return `${CARD_STATE_PREFIX}:${weekKey}:${selectedDay}:${id}`;
  }

  function getSavedCardOpen(id, fallback) {
    const saved = sessionStorage.getItem(cardStateKey(id));
    return saved === null ? fallback : saved === "1";
  }

  function saveCardOpen(id, open) {
    sessionStorage.setItem(cardStateKey(id), open ? "1" : "0");
  }

  function dailyKey(suffix) {
    return `d${selectedDay}-${suffix}`;
  }

  function isDayConfirmed(dayId = selectedDay) {
    return Boolean(stateGet(`d${dayId}-day-validated`));
  }

  function simpleChecklist(prefix, labels) {
    const wrap = document.createElement("div");
    wrap.className = "stack";
    labels.forEach((label, index) => wrap.appendChild(checkboxRow(`${prefix}-step-${index}`, label)));
    return wrap;
  }

  function hideSection(id) {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    const content = el.querySelector(".section-card-body");
    if (content) content.innerHTML = "";
  }

  function showSection(id, open = true) {
    const el = document.getElementById(id);
    el.classList.remove("hidden");
    el.open = getSavedCardOpen(id, open);
    return el;
  }

  function renderFeeling() {
    const target = document.getElementById("feelingCardContent");
    const feeling = String(stateGet(dailyKey("feeling"), ""));
    const confirmed = isDayConfirmed();

    target.innerHTML = `
      <div class="feeling-control" role="group" aria-label="Ressenti de la journée">
        ${[
          ["1","😣","Très dur"],
          ["2","😕","Dur"],
          ["3","😐","Correct"],
          ["4","🙂","Bien"],
          ["5","💪","Excellent"]
        ].map(([value,emoji,label]) => `
          <button type="button" class="feeling-button${feeling===value ? " active" : ""}" data-feeling="${value}" aria-label="${label}">
            <span>${emoji}</span><small>${label}</small>
          </button>`).join("")}
      </div>
      <button id="dailyValidationButton" type="button" class="${confirmed ? "secondary-button daily-validate-button confirmed" : "primary-button daily-validate-button"}">
        ${confirmed ? "Annuler la confirmation" : "Valider la journée"}
      </button>
      <p class="daily-check-hint">${confirmed ? "Journée confirmée. Tu peux la réouvrir sans perdre tes données." : "La validation affiche d’abord un récap des éléments réalisés et manquants."}</p>
    `;

    target.querySelectorAll(".feeling-button").forEach((button) => {
      button.addEventListener("click", () => {
        stateSet(dailyKey("feeling"), button.dataset.feeling);
        renderFeeling();
      });
    });

    document.getElementById("dailyValidationButton").addEventListener("click", () => {
      if (confirmed) openUnconfirmDialog();
      else openConfirmDialog();
    });
  }

  function missingForDay() {
    const day = getDay(selectedDay);
    const keys = originalTrackableKeysForDay(selectedDay).filter((key) => key !== dailyKey("day-validated"));
    const missing = keys.filter((key) => !Boolean(stateGet(key)));
    const groups = { strength: [], run: [], other: [] };

    missing.forEach((key) => {
      if (key.includes("-ex-") && key.endsWith("-done")) groups.strength.push(key);
      else if (key.includes("-rep-") || key.endsWith("-run-done") || key.endsWith("-session-done")) groups.run.push(key);
      else groups.other.push(key);
    });

    const strengthMissing = [];
    if (day.strength) {
      const prefix = day.kind === "strength-run" ? `d${selectedDay}-strength` : `d${selectedDay}`;
      STRENGTH[day.strength].exercises.forEach(([exercise, sets], exerciseIndex) => {
        let done = 0;
        for (let set = 1; set <= sets; set++) {
          if (stateGet(`${prefix}-ex-${exerciseIndex}-set-${set}-done`)) done++;
        }
        if (done < sets) strengthMissing.push(`${exercise} : ${done}/${sets} séries`);
      });
    }

    const runMissing = [];
    if (day.kind === "quality") {
      let done = 0;
      for (let i=1;i<=day.run.reps;i++) if (stateGet(`d${selectedDay}-rep-${i}`)) done++;
      if (done < day.run.reps) runMissing.push(`${day.run.title} : ${done}/${day.run.reps} répétitions`);
      if (!stateGet(`d${selectedDay}-session-done`)) runMissing.push("Séance running non marquée terminée");
    } else if (day.kind === "endurance" && !stateGet(`d${selectedDay}-run-done`)) {
      runMissing.push(`Course ${day.run.minutes} min non validée`);
    } else if (day.kind === "strength-run" && !stateGet(`d${selectedDay}-run-run-done`)) {
      runMissing.push(`${day.run.title} non validé`);
    }

    const otherMissing = [];
    if (day.kind === "simple" || day.kind === "rest") {
      const labels = day.kind === "simple"
        ? ["Échauffement / mobilité", "Séance de foot terminée", "Retour au calme / hydratation"]
        : ["Repos respecté", "Hydratation correcte", "7–9 h de sommeil visées"];
      labels.forEach((label, i) => {
        if (!stateGet(`d${selectedDay}-step-${i}`)) otherMissing.push(label);
      });
    }

    return { strengthMissing, runMissing, otherMissing, total: missing.length };
  }

  function openConfirmDialog() {
    const day = getDay(selectedDay);
    const missing = missingForDay();
    const feeling = String(stateGet(dailyKey("feeling"), ""));
    const feelingLabels = { "1":"Très dur", "2":"Dur", "3":"Correct", "4":"Bien", "5":"Excellent" };

    document.getElementById("dayConfirmTitle").textContent = `Confirmer ${day.name} ?`;
    const blocks = [];
    if (missing.strengthMissing.length) blocks.push(sectionHtml("Musculation incomplète", missing.strengthMissing));
    if (missing.runMissing.length) blocks.push(sectionHtml("Course incomplète", missing.runMissing));
    if (missing.otherMissing.length) blocks.push(sectionHtml("Éléments manquants", missing.otherMissing));

    document.getElementById("dayConfirmContent").innerHTML = `
      <div class="day-confirm-summary">
        <span>Ressenti <strong>${feelingLabels[feeling] || "non renseigné"}</strong></span>
        <span>Statut <strong>${missing.total ? "Incomplète" : "Complète"}</strong></span>
      </div>
      ${blocks.length ? blocks.join("") : '<p class="day-confirm-success">Tout ce qui était prévu pour cette journée est validé.</p>'}
      ${missing.total ? '<p class="day-confirm-warning">Tu peux quand même confirmer la journée. Les éléments manquants resteront visibles dans l’historique.</p>' : ""}
    `;
    pendingDayAction = "confirm";
    document.getElementById("dayConfirmDialog").showModal();
  }

  function sectionHtml(title, items) {
    return `<div class="day-missing-block"><strong>${title}</strong><ul>${items.map((item)=>`<li>${item}</li>`).join("")}</ul></div>`;
  }

  function openUnconfirmDialog() {
    pendingDayAction = "unconfirm";
    document.getElementById("dayUnconfirmDialog").showModal();
  }

  function setDayConfirmed(value) {
    stateSet(dailyKey("day-validated"), value);
    pendingDayAction = null;
    render();
  }

  function syncConfirmedVisuals() {
    const confirmed = isDayConfirmed();
    document.getElementById("dayMain").classList.toggle("is-day-confirmed", confirmed);
    document.getElementById("dayValidationPill").textContent = confirmed ? "Confirmée ✓" : "À valider";
    document.getElementById("dayValidationPill").classList.toggle("confirmed", confirmed);

    const selected = document.querySelector(".day-btn.active");
    if (selected) selected.classList.toggle("confirmed-day", confirmed);
  }

  const originalRenderDayNav = renderDayNav;
  renderDayNav = function renderDayNavWithConfirmation() {
    originalRenderDayNav();
    [1,2,3,4,5,6,0].forEach((dayId, index) => {
      const button = document.getElementById("dayNav").children[index];
      if (button && Boolean(stateGet(`d${dayId}-day-validated`))) button.classList.add("confirmed-day");
    });
  };

  renderTraining = function renderIndependentDayCards() {
    const day = getDay(selectedDay);
    const prefix = `d${selectedDay}`;

    // Legacy training header is no longer used, but keep IDs harmless if other code reads them.
    const trainingTitle = document.getElementById("trainingTitle");
    const trainingBadge = document.getElementById("trainingBadge");
    if (trainingTitle) trainingTitle.textContent = day.name;
    if (trainingBadge) trainingBadge.textContent = day.type;

    hideSection("activityCard");
    hideSection("strengthCard");
    hideSection("runCard");

    if (day.kind === "simple") {
      const card = showSection("activityCard", true);
      document.getElementById("activityTitle").textContent = "Football";
      document.getElementById("activitySubtitle").textContent = "Séance haute intensité";
      document.getElementById("activityContent").appendChild(
        simpleChecklist(prefix, ["Échauffement / mobilité", "Séance de foot terminée", "Retour au calme / hydratation"])
      );
    }

    if (day.kind === "rest") {
      const card = showSection("activityCard", true);
      document.getElementById("activityTitle").textContent = "Récupération";
      document.getElementById("activitySubtitle").textContent = "Repos complet";
      document.getElementById("activityContent").appendChild(
        simpleChecklist(prefix, ["Repos respecté", "Hydratation correcte", "7–9 h de sommeil visées"])
      );
    }

    if (day.kind === "strength" || day.kind === "strength-run") {
      showSection("strengthCard", true);
      document.getElementById("strengthCardTitle").textContent = STRENGTH[day.strength].title;
      document.getElementById("strengthCardSubtitle").textContent = "Charges · reps · RIR";
      const strengthPrefix = day.kind === "strength-run" ? `${prefix}-strength` : prefix;
      document.getElementById("strengthCardContent").appendChild(renderStrength(day.strength, strengthPrefix));
    }

    if (day.kind === "quality" || day.kind === "endurance" || day.kind === "strength-run") {
      showSection("runCard", day.kind !== "strength-run");
      document.getElementById("runCardTitle").textContent = day.kind === "strength-run" ? day.run.title : day.title;
      document.getElementById("runCardSubtitle").textContent = day.kind === "quality" ? day.run.pace : (day.run.pace || "");
      const runPrefix = day.kind === "strength-run" ? `${prefix}-run` : prefix;
      document.getElementById("runCardContent").appendChild(
        renderRunCard(day.run, runPrefix, { quality: day.kind === "quality" })
      );
    }

    renderFeeling();
    syncConfirmedVisuals();
  };

  document.getElementById("closeDayConfirm").addEventListener("click", () => document.getElementById("dayConfirmDialog").close());
  document.getElementById("cancelDayConfirm").addEventListener("click", () => document.getElementById("dayConfirmDialog").close());
  document.getElementById("confirmDay").addEventListener("click", () => {
    document.getElementById("dayConfirmDialog").close();
    if (pendingDayAction === "confirm") setDayConfirmed(true);
  });
  document.getElementById("cancelDayUnconfirm").addEventListener("click", () => document.getElementById("dayUnconfirmDialog").close());
  document.getElementById("confirmDayUnconfirm").addEventListener("click", () => {
    document.getElementById("dayUnconfirmDialog").close();
    if (pendingDayAction === "unconfirm") setDayConfirmed(false);
  });

  ["activityCard", "strengthCard", "runCard", "recoveryAccordion"].forEach((id) => {
    const card = document.getElementById(id);
    card?.addEventListener("toggle", () => {
      if (!card.classList.contains("hidden")) saveCardOpen(id, card.open);
    });
  });

  render();
})();