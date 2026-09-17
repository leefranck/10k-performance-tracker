(() => {
  const EMAIL_SETTING = "summaryEmail";

  installSettingsEmailField();
  installRecapEmailField();
  bindEmailEvents();
  syncRecapEmail();

  function installSettingsEmailField() {
    if (document.getElementById("summaryEmailInput")) return;
    const pbInput = document.getElementById("pbInput");
    const anchor = pbInput?.closest("label");
    if (!anchor) return;

    const label = document.createElement("label");
    label.className = "email-settings-field";
    label.innerHTML = `Adresse email pour les récapitulatifs
      <input id="summaryEmailInput" type="email" inputmode="email" autocomplete="email" placeholder="ton@email.com" />
      <small class="field-help">Utilisée uniquement pour préparer le récap quand tu valides une semaine.</small>`;
    anchor.insertAdjacentElement("afterend", label);
  }

  function installRecapEmailField() {
    if (document.getElementById("weekRecapEmail")) return;
    const confirmation = document.querySelector("#weekRecapDialog .recap-confirmation");
    if (!confirmation) return;

    const block = document.createElement("div");
    block.className = "recap-email-block";
    block.innerHTML = `
      <div class="recap-email-copy">
        <strong>📧 Récap par email</strong>
        <span>Après validation, ton app Mail s'ouvrira avec le bilan complet déjà rempli.</span>
      </div>
      <label>Envoyer à
        <input id="weekRecapEmail" type="email" inputmode="email" autocomplete="email" placeholder="ton@email.com" />
      </label>
      <p id="weekRecapEmailError" class="email-error" role="alert"></p>`;
    confirmation.insertAdjacentElement("afterbegin", block);
  }

  function bindEmailEvents() {
    const settingsButton = document.getElementById("settingsButton");
    settingsButton?.addEventListener("click", () => {
      const input = document.getElementById("summaryEmailInput");
      if (input) input.value = store.settings?.[EMAIL_SETTING] || "";
    });

    const saveSettings = document.getElementById("saveSettings");
    saveSettings?.addEventListener("click", () => {
      const input = document.getElementById("summaryEmailInput");
      if (!input) return;
      const email = input.value.trim();
      if (!store.settings) store.settings = {};
      store.settings[EMAIL_SETTING] = email;
      saveStore();
      syncRecapEmail();
    }, true);

    const recapEmail = document.getElementById("weekRecapEmail");
    recapEmail?.addEventListener("input", () => {
      document.getElementById("weekRecapEmailError").textContent = "";
    });

    const confirm = document.getElementById("confirmWeekValidation");
    confirm?.addEventListener("click", (event) => {
      const input = document.getElementById("weekRecapEmail");
      const email = (input?.value || store.settings?.[EMAIL_SETTING] || "").trim();
      const error = document.getElementById("weekRecapEmailError");

      if (!isValidEmail(email)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (error) error.textContent = "Renseigne une adresse email valide pour recevoir le récap de la semaine.";
        input?.focus();
        return;
      }

      if (!store.settings) store.settings = {};
      store.settings[EMAIL_SETTING] = email;
      saveStore();

      const week = store.weeks[store.activeWeekKey];
      if (!week) return;
      const message = buildWeeklyEmail(week);
      const mailto = `mailto:${email}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;

      // Let week-flow archive the current week and render the next one first.
      // Then invoke the native/default mail app with the prepared summary.
      setTimeout(() => {
        window.location.href = mailto;
      }, 80);
    }, true);
  }

  function syncRecapEmail() {
    const stored = store.settings?.[EMAIL_SETTING] || "";
    const recap = document.getElementById("weekRecapEmail");
    const settings = document.getElementById("summaryEmailInput");
    if (recap) recap.value = stored;
    if (settings && !settings.value) settings.value = stored;
    const error = document.getElementById("weekRecapEmailError");
    if (error) error.textContent = "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function buildWeeklyEmail(week) {
    const stats = weekStats(week);
    const block = PROGRAM[week.program.block];
    const plan = block.weeks[week.program.week - 1];
    const nextPosition = nextPositionFor(week.program);
    const nextBlock = PROGRAM[nextPosition.block];
    const nextPlan = nextBlock.weeks[nextPosition.week - 1];
    const recovery = week.recovery || {};
    const cycle = week.cycleNumber || "—";

    const subject = `10K Hybrid — Récap semaine ${cycle} — ${block.name}`;
    const lines = [
      `10K HYBRID PERFORMANCE — RÉCAP SEMAINE ${cycle}`,
      `${block.name} · Semaine ${week.program.week}/${block.weeks.length}`,
      "",
      `BILAN GLOBAL`,
      `• Progression : ${stats.percent}% (${stats.done}/${stats.total})`,
      `• Jours entièrement complétés : ${stats.completedDays}/7`,
      `• Séries muscu validées : ${stats.strengthDone}/${stats.strengthTotal}`,
      `• Étapes running validées : ${stats.runDone}/${stats.runTotal}`,
      `• PB 10 km : ${formatTime(store.settings.pbSeconds || BASELINE_10K)}`,
      "",
      `RÉCUPÉRATION`,
      `• Sommeil : ${recovery.sleep ? `${recovery.sleep} h` : "non renseigné"}`,
      `• Énergie : ${recovery.energy ? `${recovery.energy}/5` : "non renseignée"}`,
      `• Jambes : ${recovery.legs ? `${recovery.legs}/5` : "non renseignées"}`,
      "",
      `SEMAINE JOUR PAR JOUR`,
      ...daySummaryLines(week),
      "",
      `RUNNING`,
      `• Séance clé : ${plan.quality.title} · ${plan.quality.pace} · ${countQualityReps(week)}/${plan.quality.reps} répétitions validées`,
      `• Mardi récup : ${plan.recovery} min · ${boolLabel(week.data["d2-run-run-done"])}`,
      `• Vendredi easy : ${plan.easy[0]} min${plan.easy[1] ? ` + ${plan.easy[1]} strides` : ""} · ${boolLabel(week.data["d5-run-run-done"])}`,
      `• Dimanche long : ${plan.long} min · ${boolLabel(week.data["d0-run-done"])}`,
      "",
      `MUSCULATION`,
      ...strengthSummaryLines(week),
      "",
      `PROCHAINE SEMAINE`,
      `${nextBlock.name} · Semaine ${nextPosition.week}/${nextBlock.weeks.length}${nextPlan.deload ? " · DELOAD" : ""}`,
      `• Mercredi : ${nextPlan.quality.title} · ${nextPlan.quality.pace}`,
      `• Vendredi : ${nextPlan.easy[0]} min facile${nextPlan.easy[1] ? ` + ${nextPlan.easy[1]} strides` : ""}`,
      `• Dimanche : ${nextPlan.long} min sortie longue`,
      "",
      `Généré par 10K Hybrid Performance.`
    ];

    return { subject, body: lines.join("\n") };
  }

  function weekStats(week) {
    const previous = currentWeek;
    currentWeek = () => week;
    try {
      const allKeys = [1, 2, 3, 4, 5, 6, 0].flatMap(trackableKeysForDay);
      const done = allKeys.filter((key) => Boolean(week.data[key])).length;
      const strengthKeys = allKeys.filter((key) => key.includes("-ex-") && key.endsWith("-done"));
      const runKeys = allKeys.filter((key) => key.includes("-rep-") || key.endsWith("-run-done") || key.endsWith("-session-done"));
      const completedDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => {
        const keys = trackableKeysForDay(day);
        return keys.length && keys.every((key) => Boolean(week.data[key]));
      }).length;
      return {
        total: allKeys.length,
        done,
        percent: allKeys.length ? Math.round((done / allKeys.length) * 100) : 0,
        completedDays,
        strengthDone: strengthKeys.filter((key) => Boolean(week.data[key])).length,
        strengthTotal: strengthKeys.length,
        runDone: runKeys.filter((key) => Boolean(week.data[key])).length,
        runTotal: runKeys.length
      };
    } finally {
      currentWeek = previous;
    }
  }

  function daySummaryLines(week) {
    const labels = [
      [1, "Lundi", "Football"],
      [2, "Mardi", "Upper A + footing récup"],
      [3, "Mercredi", PROGRAM[week.program.block].weeks[week.program.week - 1].quality.title],
      [4, "Jeudi", "Lower"],
      [5, "Vendredi", "Upper B + endurance facile"],
      [6, "Samedi", "Repos"],
      [0, "Dimanche", "Sortie longue"]
    ];

    const previous = currentWeek;
    currentWeek = () => week;
    try {
      return labels.map(([id, day, name]) => {
        const keys = trackableKeysForDay(id);
        const done = keys.filter((key) => Boolean(week.data[key])).length;
        const pct = keys.length ? Math.round((done / keys.length) * 100) : 0;
        return `• ${day} — ${name} : ${pct}%`;
      });
    } finally {
      currentWeek = previous;
    }
  }

  function strengthSummaryLines(week) {
    const sessions = [
      ["Mardi", "upperA", "d2-strength"],
      ["Jeudi", "lower", "d4"],
      ["Vendredi", "upperB", "d5-strength"]
    ];
    const lines = [];

    sessions.forEach(([day, strengthName, prefix]) => {
      lines.push(`${day} — ${STRENGTH[strengthName].title}`);
      STRENGTH[strengthName].exercises.forEach(([exercise, sets], exerciseIndex) => {
        let completed = 0;
        const entered = [];
        for (let set = 1; set <= sets; set++) {
          const base = `${prefix}-ex-${exerciseIndex}-set-${set}`;
          if (week.data[`${base}-done`]) completed++;
          const weight = week.data[`${base}-weight`];
          const reps = week.data[`${base}-reps`];
          if (weight || reps) entered.push({ weight: Number(weight) || 0, reps: Number(reps) || 0 });
        }
        const best = entered.sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
        const bestText = best ? ` · meilleur set ${best.weight || "—"} kg × ${best.reps || "—"}` : "";
        lines.push(`  • ${exercise} : ${completed}/${sets} séries${bestText}`);
      });
    });

    return lines;
  }

  function countQualityReps(week) {
    const plan = PROGRAM[week.program.block].weeks[week.program.week - 1];
    let done = 0;
    for (let i = 1; i <= plan.quality.reps; i++) if (week.data[`d3-rep-${i}`]) done++;
    return done;
  }

  function nextPositionFor(program) {
    const block = PROGRAM[program.block];
    if (program.week < block.weeks.length) return { block: program.block, week: program.week + 1 };
    const nextBlock = nextBlockName(program.block);
    return nextBlock ? { block: nextBlock, week: 1 } : { block: program.block, week: block.weeks.length };
  }

  function boolLabel(value) {
    return value ? "terminé ✓" : "non validé";
  }
})();
