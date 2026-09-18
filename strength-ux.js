(() => {
  const OPEN_EXERCISE_PREFIX = "tenk-open-exercise";

  function selectionKey(name, prefix) {
    const weekKey = currentWeek()?.key || store.activeWeekKey || "current";
    return `${OPEN_EXERCISE_PREFIX}:${weekKey}:${prefix}:${name}`;
  }

  function getSelectedExercise(name, prefix, max) {
    const raw = sessionStorage.getItem(selectionKey(name, prefix));
    const parsed = raw === null ? 0 : Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < max ? parsed : 0;
  }

  function setSelectedExercise(name, prefix, index) {
    sessionStorage.setItem(selectionKey(name, prefix), String(index));
  }

  function exerciseIsComplete(prefix, exerciseIndex, sets) {
    for (let setIndex = 1; setIndex <= sets; setIndex++) {
      if (!Boolean(stateGet(`${prefix}-ex-${exerciseIndex}-set-${setIndex}-done`))) return false;
    }
    return true;
  }

  renderStrength = function renderStrengthStable(name, prefix) {
    const cfg = STRENGTH[name];
    const wrap = document.createElement("div");
    wrap.className = "stack strength-exercise-stack";

    const helper = document.createElement("div");
    helper.className = "soft-card";
    helper.textContent = "Progression : complète la fourchette de reps avec la même charge avant d'augmenter. Garde le RIR indiqué.";
    wrap.appendChild(helper);

    const prev = previousWeekForCurrentProgram();
    const selectedIndex = getSelectedExercise(name, prefix, cfg.exercises.length);

    cfg.exercises.forEach(([exercise, sets, reps, rir], ei) => {
      const isComplete = exerciseIsComplete(prefix, ei, sets);
      const details = document.createElement("details");
      details.className = `exercise${isComplete ? " is-complete" : ""}`;
      details.dataset.exerciseIndex = String(ei);
      details.open = ei === selectedIndex;

      const summary = document.createElement("summary");
      summary.innerHTML = `
        <span class="exercise-title-wrap">
          <span class="exercise-name">${exercise}</span>
          <span class="exercise-sub">${sets} × ${reps} · ${rir}</span>
        </span>
        ${isComplete ? '<span class="exercise-done-badge">✓ Done</span>' : ""}
      `;

      const body = document.createElement("div");
      body.className = "exercise-body";

      if (prev) {
        const vals = [];
        for (let s = 1; s <= sets; s++) {
          const w = prev.data[`${prefix}-ex-${ei}-set-${s}-weight`];
          const r = prev.data[`${prefix}-ex-${ei}-set-${s}-reps`];
          if (w || r) vals.push(`${w || "—"} kg × ${r || "—"}`);
        }
        if (vals.length) {
          const p = document.createElement("div");
          p.className = "previous-set";
          p.textContent = `Semaine précédente : ${vals.join(" · ")}`;
          body.appendChild(p);
        }
      }

      for (let s = 1; s <= sets; s++) {
        const doneKey = `${prefix}-ex-${ei}-set-${s}-done`;
        const isDone = Boolean(stateGet(doneKey));

        const row = document.createElement("div");
        row.className = `set-row${isDone ? " is-set-done" : ""}`;

        const n = document.createElement("span");
        n.className = "set-number";
        n.textContent = `S${s}`;

        const weightLabel = document.createElement("label");
        weightLabel.className = "mini-field";
        weightLabel.textContent = "kg";

        const weight = document.createElement("input");
        weight.type = "number";
        weight.inputMode = "decimal";
        weight.step = "0.5";
        weight.min = "0";
        weight.value = stateGet(`${prefix}-ex-${ei}-set-${s}-weight`, "");
        weight.addEventListener("change", () => stateSet(`${prefix}-ex-${ei}-set-${s}-weight`, weight.value));
        weightLabel.appendChild(weight);

        const repsLabel = document.createElement("label");
        repsLabel.className = "mini-field";
        repsLabel.textContent = "reps";

        const rep = document.createElement("input");
        rep.type = "number";
        rep.inputMode = "numeric";
        rep.min = "0";
        rep.value = stateGet(`${prefix}-ex-${ei}-set-${s}-reps`, "");
        rep.addEventListener("change", () => stateSet(`${prefix}-ex-${ei}-set-${s}-reps`, rep.value));
        repsLabel.appendChild(rep);

        const done = document.createElement("button");
        done.type = "button";
        done.className = `done-btn${isDone ? " is-done" : ""}`;
        done.textContent = isDone ? "✓" : "OK";
        done.addEventListener("click", () => {
          stateSet(doneKey, !stateGet(doneKey));
          // renderTraining() no longer resets to exercise 1:
          // the explicitly selected exercise is restored from sessionStorage.
          renderTraining();
        });

        row.append(n, weightLabel, repsLabel, done);
        body.appendChild(row);
      }

      details.addEventListener("toggle", () => {
        if (!details.open) return;

        setSelectedExercise(name, prefix, ei);

        // Accordion behavior: only the exercise explicitly chosen by the user stays open.
        wrap.querySelectorAll("details.exercise").forEach((other) => {
          if (other !== details && other.open) other.open = false;
        });
      });

      details.append(summary, body);
      wrap.appendChild(details);
    });

    return wrap;
  };
})();