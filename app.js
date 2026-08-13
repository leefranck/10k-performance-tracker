const STORAGE_KEY = "tenk-performance-tracker-v1";

const DAYS = {
  1: {
    short: "Lun",
    name: "Lundi",
    icon: "🏋️",
    type: "Musculation",
    title: "Muscu A · Full body",
    tip: "Garde environ 2 répétitions en réserve sur les jambes pour arriver frais au foot de mardi.",
    meals: [
      ["🥞", "Petit-déjeuner", "Pancakes banane-chocolat", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["🍌", "Collation", "Banane + chocolat noir + amandes", "≈ 250 kcal"],
      ["🍽️", "Dîner", "Saumon + pommes de terre + légumes + fromage blanc", "≈ 800 kcal"]
    ],
    training: {
      kind: "strength",
      exercises: [
        ["Développé couché", 3, "5–8"],
        ["Tractions / tirage vertical", 3, "6–10"],
        ["Rowing", 3, "6–10"],
        ["Squat ou presse", 2, "5–8"],
        ["Développé épaules", 3, "6–10"],
        ["Mollets", 3, "10–15"],
        ["Abdos", 3, "10–15"]
      ]
    }
  },
  2: {
    short: "Mar",
    name: "Mardi",
    icon: "⚽",
    type: "Football",
    title: "Foot",
    tip: "Le foot compte déjà comme une séance cardio intense. Aucun running supplémentaire aujourd’hui.",
    meals: [
      ["🍞", "Petit-déjeuner", "French toast banane + pâte à tartiner", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["⚡", "Collation pré-foot", "Banane + 2 galettes de riz + beurre de cacahuète", "≈ 250 kcal"],
      ["🍽️", "Dîner", "Poulet + riz + légumes + tzatziki + fruit", "≈ 800 kcal"]
    ],
    training: {
      kind: "simple",
      steps: ["Échauffement / mobilité terminé", "Séance de foot terminée", "Retour au calme / hydratation terminé"]
    }
  },
  3: {
    short: "Mer",
    name: "Mercredi",
    icon: "🏃",
    type: "Running",
    title: "Fractionné · 6 × 800 m",
    tip: "Objectif : régularité. Ne pars pas trop vite sur les deux premières répétitions.",
    meals: [
      ["🍫", "Petit-déjeuner", "Bowl tiramisu avoine / café / chocolat", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["⚡", "Collation pré-run", "Pain + confiture + banane", "≈ 250 kcal"],
      ["🍝", "Dîner", "Pâtes bolognaises au steak 5 %", "≈ 800 kcal"]
    ],
    training: {
      kind: "interval",
      warmup: "15 min facile + quelques accélérations",
      reps: 6,
      repLabel: "800 m",
      pace: "4:20–4:25/km",
      target: "≈ 3:28–3:32",
      recovery: "2 min en marchant ou trottinant",
      cooldown: "10 min retour au calme"
    }
  },
  4: {
    short: "Jeu",
    name: "Jeudi",
    icon: "🏃‍♂️",
    type: "Running + muscu",
    title: "Footing facile + Muscu B",
    tip: "Le footing doit être réellement facile. Si les jambes sont lourdes, ralentis.",
    meals: [
      ["🥞", "Petit-déjeuner", "Pancakes cœur pâte à tartiner + fruits rouges", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["🥤", "Collation", "Whey + fruit + galettes de riz", "≈ 250 kcal"],
      ["🍳", "Dîner", "Omelette + pommes de terre + légumes + pain", "≈ 800 kcal"]
    ],
    training: {
      kind: "combo",
      runSteps: ["10 min faciles", "20 min", "30 min", "40–45 min terminées"],
      exercises: [
        ["Développé incliné", 3, "6–10"],
        ["Tirage vertical", 3, "6–10"],
        ["RDL / soulevé de terre roumain", 2, "6–8"],
        ["Élévations latérales", 3, "10–15"],
        ["Biceps", 3, "8–12"],
        ["Triceps", 3, "8–12"],
        ["Gainage", 3, "30–60 s"]
      ]
    }
  },
  5: {
    short: "Ven",
    name: "Vendredi",
    icon: "⚽",
    type: "Football",
    title: "Foot",
    tip: "Bonne séance, mais évite d’ajouter du volume : le samedi est ton vrai jour de récupération.",
    meals: [
      ["🥯", "Petit-déjeuner", "Bagel œufs / dinde / fromage + fruit", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["⚡", "Collation pré-foot", "Banane + pain + miel ou confiture", "≈ 250 kcal"],
      ["🐟", "Dîner", "Poisson blanc + pommes de terre + légumes", "≈ 800 kcal"]
    ],
    training: {
      kind: "simple",
      steps: ["Échauffement / mobilité terminé", "Séance de foot terminée", "Retour au calme / hydratation terminé"]
    }
  },
  6: {
    short: "Sam",
    name: "Samedi",
    icon: "💤",
    type: "Repos",
    title: "Repos complet",
    tip: "Pas de séance. Marche tranquille si tu veux, mais l’objectif est de récupérer pour la sortie du dimanche.",
    meals: [
      ["🍞", "Petit-déjeuner", "French toast chocolat-banane", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["🍫", "Collation", "Fruit + chocolat noir + amandes", "≈ 250 kcal"],
      ["🥩", "Dîner", "Steak 5 % + pommes de terre + légumes", "≈ 800 kcal"]
    ],
    training: {
      kind: "rest",
      steps: ["Repos respecté", "Hydratation correcte", "7–8 h de sommeil visées"]
    }
  },
  0: {
    short: "Dim",
    name: "Dimanche",
    icon: "🏃",
    type: "Running",
    title: "Endurance · 1 h 05",
    tip: "La sortie doit rester confortable. Les 10 dernières minutes vers 5:00/km sont facultatives.",
    meals: [
      ["🥞", "Petit-déjeuner", "Pancakes banane-chocolat", "≈ 500 kcal"],
      ["🥗", "Déjeuner", "Salade froide pâtes / poulet / pesto", "≈ 650 kcal"],
      ["⚡", "Collation pré-run", "Banane + galettes de riz + beurre de cacahuète", "≈ 250 kcal"],
      ["🍝", "Dîner", "Pâtes au poulet + sauce tomate + parmesan", "≈ 800 kcal"]
    ],
    training: {
      kind: "endurance",
      steps: ["15 min faciles", "30 min", "45 min", "55 min", "1 h 05 terminée"],
      note: "50–55 min à 5:40–6:00/km. Si tu te sens bien : 10 dernières minutes vers 5:00/km."
    }
  }
};

const state = loadState();
let selectedDay = chooseDefaultDay();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function chooseDefaultDay() {
  const today = new Date().getDay();
  return Object.prototype.hasOwnProperty.call(DAYS, today) ? today : 1;
}

function key(...parts) {
  return parts.join("-");
}

function getState(id, fallback = false) {
  return state[id] ?? fallback;
}

function setState(id, value) {
  state[id] = value;
  persistState();
  updateGlobal();
}

function checkboxRow(id, label) {
  const wrapper = document.createElement("label");
  wrapper.className = "check-row";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(getState(id));
  input.addEventListener("change", () => {
    setState(id, input.checked);
  });

  const box = document.createElement("span");
  box.className = "checkmark";

  const text = document.createElement("span");
  text.className = "check-label";
  text.textContent = label;

  wrapper.append(input, box, text);
  return wrapper;
}

function renderDayNav() {
  const nav = document.getElementById("dayNav");
  nav.innerHTML = "";

  [1, 2, 3, 4, 5, 6, 0].forEach((dayId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-btn${selectedDay === dayId ? " active" : ""}`;
    button.textContent = DAYS[dayId].short;
    button.addEventListener("click", () => {
      selectedDay = dayId;
      render();
    });
    nav.appendChild(button);
  });
}

function renderDayHero() {
  const day = DAYS[selectedDay];
  document.getElementById("dayHero").innerHTML = `
    <div class="day-hero-main">
      <div class="day-icon">${day.icon}</div>
      <div>
        <div class="day-title">${day.name}</div>
        <div class="day-type">${day.type}</div>
      </div>
    </div>
    <span class="pill">≈ 2 200 kcal</span>
  `;
}

function renderStrength(exercises, prefix) {
  const container = document.createElement("div");
  container.className = "stack";

  const helper = document.createElement("div");
  helper.className = "soft-card";
  helper.textContent = "Utilise + et − pour compter les répétitions, puis valide la série avec OK.";
  container.appendChild(helper);

  exercises.forEach(([name, sets, reps], exerciseIndex) => {
    const details = document.createElement("details");
    details.className = "exercise";
    if (exerciseIndex === 0) details.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${name}</span><span>${sets} séries</span>`;

    const body = document.createElement("div");
    body.className = "exercise-body";

    const weightLabel = document.createElement("label");
    weightLabel.className = "weight-field";
    weightLabel.textContent = "Charge utilisée (kg)";

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.inputMode = "decimal";
    weightInput.min = "0";
    weightInput.step = "0.5";
    weightInput.placeholder = "Optionnel";
    const weightKey = key(prefix, "ex", exerciseIndex, "weight");
    weightInput.value = getState(weightKey, "");
    weightInput.addEventListener("input", () => {
      setState(weightKey, weightInput.value);
    });

    weightLabel.appendChild(weightInput);
    body.appendChild(weightLabel);

    for (let setIndex = 1; setIndex <= sets; setIndex++) {
      const countKey = key(prefix, "ex", exerciseIndex, "set", setIndex, "count");
      const doneKey = key(prefix, "ex", exerciseIndex, "set", setIndex, "done");

      const row = document.createElement("div");
      row.className = `set-row${getState(doneKey) ? " done" : ""}`;

      const meta = document.createElement("div");
      meta.className = "set-meta";
      meta.innerHTML = `<strong>Série ${setIndex}</strong><span>Cible : ${reps}</span>`;

      const controls = document.createElement("div");
      controls.className = "rep-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "rep-btn";
      minus.textContent = "−";

      const value = document.createElement("span");
      value.className = "rep-value";
      value.textContent = getState(countKey, 0);

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "rep-btn";
      plus.textContent = "+";

      const done = document.createElement("button");
      done.type = "button";
      done.className = `done-btn${getState(doneKey) ? " is-done" : ""}`;
      done.textContent = getState(doneKey) ? "✓" : "OK";

      minus.addEventListener("click", () => {
        const next = Math.max(0, Number(getState(countKey, 0)) - 1);
        setState(countKey, next);
        value.textContent = next;
      });

      plus.addEventListener("click", () => {
        const next = Number(getState(countKey, 0)) + 1;
        setState(countKey, next);
        value.textContent = next;
      });

      done.addEventListener("click", () => {
        const next = !Boolean(getState(doneKey));
        setState(doneKey, next);
        row.classList.toggle("done", next);
        done.classList.toggle("is-done", next);
        done.textContent = next ? "✓" : "OK";
      });

      controls.append(minus, value, plus, done);
      row.append(meta, controls);
      body.appendChild(row);
    }

    details.append(summary, body);
    container.appendChild(details);
  });

  return container;
}

function renderTraining() {
  const day = DAYS[selectedDay];
  const training = day.training;
  const content = document.getElementById("trainingContent");

  document.getElementById("trainingTitle").textContent = day.title;
  document.getElementById("trainingBadge").textContent = day.type;
  content.innerHTML = "";

  const prefix = `d${selectedDay}`;

  if (training.kind === "strength") {
    content.appendChild(renderStrength(training.exercises, prefix));
    return;
  }

  if (training.kind === "interval") {
    const info = document.createElement("div");
    info.className = "soft-card";
    info.innerHTML = `<strong>Allure :</strong> ${training.pace}<br>
      <strong>Cible :</strong> ${training.target}<br>
      <strong>Récup :</strong> ${training.recovery}`;
    content.appendChild(info);
    content.appendChild(checkboxRow(key(prefix, "warmup"), `Échauffement · ${training.warmup}`));

    for (let i = 1; i <= training.reps; i++) {
      content.appendChild(
        checkboxRow(
          key(prefix, "rep", i),
          `Répétition ${i} · ${training.repLabel} · ${training.target}`
        )
      );
    }

    content.appendChild(checkboxRow(key(prefix, "cooldown"), training.cooldown));
    return;
  }

  if (training.kind === "combo") {
    const info = document.createElement("div");
    info.className = "soft-card";
    info.textContent = "Footing facile : 5:45–6:15/km. La muscu peut idéalement être faite plus tard dans la journée.";
    content.appendChild(info);

    training.runSteps.forEach((step, index) => {
      content.appendChild(checkboxRow(key(prefix, "run", index), step));
    });

    const muscuTitle = document.createElement("h3");
    muscuTitle.textContent = "Muscu B";
    muscuTitle.style.marginTop = "8px";
    content.appendChild(muscuTitle);
    content.appendChild(renderStrength(training.exercises, `${prefix}-muscu`));
    return;
  }

  if (training.kind === "endurance") {
    const info = document.createElement("div");
    info.className = "soft-card";
    info.textContent = training.note;
    content.appendChild(info);
  }

  training.steps.forEach((step, index) => {
    content.appendChild(checkboxRow(key(prefix, "step", index), step));
  });
}

function renderMeals() {
  const day = DAYS[selectedDay];
  const list = document.getElementById("mealList");
  list.innerHTML = "";

  day.meals.forEach(([icon, name, desc, kcal], index) => {
    const mealKey = key(`d${selectedDay}`, "meal", index);

    const card = document.createElement("label");
    card.className = "meal-card";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(getState(mealKey));
    input.addEventListener("change", () => {
      setState(mealKey, input.checked);
      updateMealProgress();
    });

    const iconEl = document.createElement("span");
    iconEl.className = "meal-icon";
    iconEl.textContent = icon;

    const text = document.createElement("div");
    text.innerHTML = `<div class="meal-name">${name}</div><div class="meal-desc">${desc}</div>`;

    const kcalEl = document.createElement("span");
    kcalEl.className = "meal-kcal";
    kcalEl.textContent = kcal;

    card.append(input, iconEl, text, kcalEl);
    list.appendChild(card);
  });

  updateMealProgress();
}

function updateMealProgress() {
  const done = DAYS[selectedDay].meals.filter((_, index) =>
    Boolean(getState(key(`d${selectedDay}`, "meal", index)))
  ).length;

  document.getElementById("mealProgress").textContent = `${done} / 4`;
}

function getTrackableKeys() {
  const keys = [];

  Object.entries(DAYS).forEach(([dayId, day]) => {
    const prefix = `d${dayId}`;

    day.meals.forEach((_, index) => {
      keys.push(key(prefix, "meal", index));
    });

    const t = day.training;

    if (t.kind === "strength") {
      t.exercises.forEach((exercise, exerciseIndex) => {
        for (let setIndex = 1; setIndex <= exercise[1]; setIndex++) {
          keys.push(key(prefix, "ex", exerciseIndex, "set", setIndex, "done"));
        }
      });
    }

    if (t.kind === "interval") {
      keys.push(key(prefix, "warmup"));
      for (let i = 1; i <= t.reps; i++) {
        keys.push(key(prefix, "rep", i));
      }
      keys.push(key(prefix, "cooldown"));
    }

    if (t.kind === "combo") {
      t.runSteps.forEach((_, index) => keys.push(key(prefix, "run", index)));

      t.exercises.forEach((exercise, exerciseIndex) => {
        for (let setIndex = 1; setIndex <= exercise[1]; setIndex++) {
          keys.push(key(`${prefix}-muscu`, "ex", exerciseIndex, "set", setIndex, "done"));
        }
      });
    }

    if (["simple", "rest", "endurance"].includes(t.kind)) {
      t.steps.forEach((_, index) => keys.push(key(prefix, "step", index)));
    }
  });

  return keys;
}

function updateGlobal() {
  const keys = getTrackableKeys();
  const done = keys.filter((id) => Boolean(getState(id))).length;
  const percent = keys.length ? Math.round((done / keys.length) * 100) : 0;

  document.getElementById("globalPercent").textContent = `${percent}%`;
  document.getElementById("globalCount").textContent = `${done} / ${keys.length}`;
  document.getElementById("globalBar").style.width = `${percent}%`;
}

function render() {
  renderDayNav();
  renderDayHero();
  renderTraining();
  renderMeals();

  const day = DAYS[selectedDay];
  document.getElementById("dailyTip").innerHTML = `<strong>Conseil du jour :</strong> ${day.tip}`;

  updateGlobal();
}

render();
