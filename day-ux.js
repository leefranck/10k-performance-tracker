(() => {
  const SECTION_STATE_PREFIX = "tenk-day-section";

  const originalTrackableKeysForDay = trackableKeysForDay;
  trackableKeysForDay = function trackableKeysWithDailyValidation(dayId) {
    return [...originalTrackableKeysForDay(dayId), `d${dayId}-day-validated`];
  };

  function sectionStorageKey(section) {
    const weekKey = currentWeek()?.key || store.activeWeekKey || "current";
    return `${SECTION_STATE_PREFIX}:${weekKey}:${selectedDay}:${section}`;
  }

  function getSectionOpen(section, fallback = true) {
    const raw = sessionStorage.getItem(sectionStorageKey(section));
    return raw === null ? fallback : raw === "1";
  }

  function setSectionOpen(section, open) {
    sessionStorage.setItem(sectionStorageKey(section), open ? "1" : "0");
  }

  function makeSection({ id, icon, title, subtitle, content, defaultOpen = true }) {
    const details = document.createElement("details");
    details.className = "training-section-accordion";
    details.open = getSectionOpen(id, defaultOpen);

    const summary = document.createElement("summary");
    summary.className = "training-section-summary";
    summary.innerHTML = `
      <span class="training-section-icon">${icon}</span>
      <span class="training-section-copy">
        <strong>${title}</strong>
        ${subtitle ? `<small>${subtitle}</small>` : ""}
      </span>
      <span class="training-section-chevron" aria-hidden="true">⌄</span>
    `;

    const body = document.createElement("div");
    body.className = "training-section-body";
    body.appendChild(content);

    details.addEventListener("toggle", () => setSectionOpen(id, details.open));
    details.append(summary, body);
    return details;
  }

  function renderDailyCheck(prefix) {
    const wrap = document.createElement("section");
    const validatedKey = `${prefix}-day-validated`;
    const feelingKey = `${prefix}-feeling`;
    const validated = Boolean(stateGet(validatedKey));
    const feeling = String(stateGet(feelingKey, ""));

    wrap.className = `daily-check-card${validated ? " is-validated" : ""}`;
    wrap.innerHTML = `
      <div class="daily-check-head">
        <div>
          <p class="eyebrow">JOURNÉE</p>
          <strong>${validated ? "Journée validée ✓" : "Comment tu te sens ?"}</strong>
        </div>
        <span class="daily-status-pill">${validated ? "DONE" : "À VALIDER"}</span>
      </div>
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
      <button type="button" class="${validated ? "secondary-button daily-validate-button is-validated" : "primary-button daily-validate-button"}">
        ${validated ? "✓ Journée validée" : "Valider la journée"}
      </button>
      <p class="daily-check-hint">${validated ? "Ton ressenti et cette validation sont sauvegardés dans l’historique." : "Choisis ton ressenti puis valide quand tu considères ta journée terminée."}</p>
    `;

    wrap.querySelectorAll(".feeling-button").forEach((button) => {
      button.addEventListener("click", () => {
        stateSet(feelingKey, button.dataset.feeling);
        renderTraining();
      });
    });

    wrap.querySelector(".daily-validate-button").addEventListener("click", () => {
      stateSet(validatedKey, !Boolean(stateGet(validatedKey)));
      render();
    });

    return wrap;
  }

  function simpleChecklist(prefix, labels) {
    const wrap = document.createElement("div");
    wrap.className = "stack";
    labels.forEach((label, index) => wrap.appendChild(checkboxRow(`${prefix}-step-${index}`, label)));
    return wrap;
  }

  renderTraining = function renderTrainingBySections() {
    const day = getDay(selectedDay);
    const content = document.getElementById("trainingContent");
    const prefix = `d${selectedDay}`;

    document.getElementById("trainingTitle").textContent = day.name;
    document.getElementById("trainingBadge").textContent = day.type;
    content.innerHTML = "";

    if (day.kind === "simple") {
      content.appendChild(makeSection({
        id: "football",
        icon: "⚽",
        title: "Football",
        subtitle: "Séance haute intensité",
        content: simpleChecklist(prefix, ["Échauffement / mobilité", "Séance de foot terminée", "Retour au calme / hydratation"]),
        defaultOpen: true
      }));
      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
      return;
    }

    if (day.kind === "rest") {
      content.appendChild(makeSection({
        id: "recovery",
        icon: "💤",
        title: "Récupération",
        subtitle: "Repos complet",
        content: simpleChecklist(prefix, ["Repos respecté", "Hydratation correcte", "7–9 h de sommeil visées"]),
        defaultOpen: true
      }));
      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
      return;
    }

    if (day.kind === "quality") {
      content.appendChild(makeSection({
        id: "running",
        icon: "🏃",
        title: "Course",
        subtitle: day.title,
        content: renderRunCard(day.run, prefix, { quality: true }),
        defaultOpen: true
      }));
      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
      return;
    }

    if (day.kind === "endurance") {
      content.appendChild(makeSection({
        id: "running",
        icon: "🏃",
        title: "Course",
        subtitle: day.title,
        content: renderRunCard(day.run, prefix),
        defaultOpen: true
      }));
      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
      return;
    }

    if (day.kind === "strength") {
      content.appendChild(makeSection({
        id: "strength",
        icon: "🏋️",
        title: "Musculation",
        subtitle: STRENGTH[day.strength].title,
        content: renderStrength(day.strength, prefix),
        defaultOpen: true
      }));
      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
      return;
    }

    if (day.kind === "strength-run") {
      content.appendChild(makeSection({
        id: "strength",
        icon: "🏋️",
        title: "Musculation",
        subtitle: STRENGTH[day.strength].title,
        content: renderStrength(day.strength, `${prefix}-strength`),
        defaultOpen: true
      }));

      content.appendChild(makeSection({
        id: "running",
        icon: "🏃",
        title: "Course",
        subtitle: day.run.title,
        content: renderRunCard(day.run, `${prefix}-run`),
        defaultOpen: false
      }));

      content.appendChild(makeSection({
        id: "feeling",
        icon: "🧠",
        title: "Ressenti & validation",
        subtitle: "Comment tu te sens après ta journée ?",
        content: renderDailyCheck(prefix),
        defaultOpen: true
      }));
    }
  };

  // Re-render once with the new hierarchy after this enhancement is loaded.
  render();
})();