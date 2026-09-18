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
        weight.type = "text";
        weight.inputMode = "decimal";
        weight.autocomplete = "off";
        const weightKey = `${prefix}-ex-${ei}-set-${s}-weight`;
        const storedWeight = stateGet(weightKey, "");
        weight.value = storedWeight === "" ? "" : String(storedWeight).replace(".", ",");
        weight.pattern = "[0-9]*([,.][0-9]*)?";
        weight.addEventListener("beforeinput", (event) => {
          if (event.inputType !== "insertText") return;
          if (event.data !== "," && event.data !== ".") return;
          event.preventDefault();
          const start = weight.selectionStart ?? weight.value.length;
          const end = weight.selectionEnd ?? start;
          const withoutSelection = weight.value.slice(0, start) + weight.value.slice(end);
          if (withoutSelection.includes(",") || withoutSelection.includes(".")) return;
          weight.setRangeText(",", start, end, "end");
          weight.dispatchEvent(new Event("input", { bubbles: true }));
        });
        weight.addEventListener("input", () => {
          let next = weight.value.replace(/\./g, ",").replace(/[^0-9,]/g, "");
          const firstComma = next.indexOf(",");
          if (firstComma !== -1) {
            next = next.slice(0, firstComma + 1) + next.slice(firstComma + 1).replace(/,/g, "");
          }
          if (next !== weight.value) {
            const caret = Math.min(weight.selectionStart ?? next.length, next.length);
            weight.value = next;
            try { weight.setSelectionRange(caret, caret); } catch {}
          }
        });
        const saveWeight = () => {
          const raw = weight.value.trim().replace(",", ".");
          if (raw === "") {
            stateSet(weightKey, "");
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed) || parsed < 0) return;
          const normalized = String(parsed);
          stateSet(weightKey, normalized);
          weight.value = normalized.replace(".", ",");
        };
        weight.addEventListener("change", saveWeight);
        weight.addEventListener("blur", saveWeight);

        const weightInputWrap = document.createElement("div");
        weightInputWrap.className = "weight-input-wrap";

        const commaButton = document.createElement("button");
        commaButton.type = "button";
        commaButton.className = "decimal-comma-button";
        commaButton.textContent = ",";
        commaButton.setAttribute("aria-label", "Ajouter une virgule décimale");
        commaButton.addEventListener("pointerdown", (event) => event.preventDefault());
        commaButton.addEventListener("click", () => {
          weight.focus({ preventScroll: true });
          const start = weight.selectionStart ?? weight.value.length;
          const end = weight.selectionEnd ?? start;
          const base = weight.value.slice(0, start) + weight.value.slice(end);
          if (base.includes(",") || base.includes(".")) return;
          weight.setRangeText(",", start, end, "end");
          weight.dispatchEvent(new Event("input", { bubbles: true }));
        });

        weightInputWrap.append(weight, commaButton);
        weightLabel.appendChild(weightInputWrap);

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