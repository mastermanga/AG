// ========== THEME (DARK/LIGHT) ==========
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
});
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") document.body.classList.add("light");
});

// ========== RETOUR MENU ==========
document.getElementById("back-to-menu").addEventListener("click", function() {
  window.location.href = "../index.html";
});

// ========== DOMS ==========
const stepsList = document.getElementById("steps-list");
const gameType = document.getElementById("gameType");
const modeOption = document.getElementById("modeOption");
const stepCount = document.getElementById("stepCount");
const addStepBtn = document.getElementById("addStepBtn");
const startParcoursBtn = document.getElementById("startParcoursBtn");

const recapSection = document.getElementById("recap");
const recapList = document.getElementById("parcoursRecapList");
const editParcoursBtn = document.getElementById("editParcoursBtn");
const launchConfirmedBtn = document.getElementById("launchConfirmedBtn");

let parcoursSteps = [];

// ========== AFFICHER/DISSIMULER LE MODE (anime/opening) ==========
gameType.addEventListener("change", () => {
  if (["animetournament", "blindranking"].includes(gameType.value) || gameType.value === "characterquizz") {
    modeOption.style.display = "";
    modeOption.innerHTML = "";
    if (gameType.value === "characterquizz") {
      modeOption.innerHTML = `<option value="anime">Anime</option>`;
    } else {
      modeOption.innerHTML = `
        <option value="anime">Anime</option>
        <option value="opening">Opening</option>
      `;
    }
  } else {
    modeOption.style.display = "none";
  }
});

// ========== AJOUTER UNE ETAPE ==========
addStepBtn.addEventListener("click", () => {
  const type = gameType.value;
  const mode = modeOption.style.display === "none" ? null : modeOption.value;
  const count = parseInt(stepCount.value, 10);

  if (!type || count < 1) return;

  let label = "";
  switch(type) {
    case "anidle": label = `Anidle × ${count}`; break;
    case "openingquizz": label = `Opening Quizz × ${count}`; break;
    case "characterquizz": label = `Character Quizz × ${count}`; break;
    case "animetournament":
      label = `AnimeTournament (${mode === "opening" ? "Opening" : "Anime"})`;
      break;
    case "blindranking":
      label = `BlindRanking (${mode === "opening" ? "Opening" : "Anime"})`;
      break;
  }

  parcoursSteps.push({ type, mode, count });
  renderSteps();
  startParcoursBtn.style.display = parcoursSteps.length > 0 ? "block" : "none";
});

function renderSteps() {
  stepsList.innerHTML = "";
  if (parcoursSteps.length === 0) {
    stepsList.innerHTML = "<div class='empty'>Ajoutez vos étapes !</div>";
    startParcoursBtn.style.display = "none";
    return;
  }
  parcoursSteps.forEach((step, idx) => {
    let txt = "";
    if (["anidle", "openingquizz", "characterquizz"].includes(step.type)) {
      txt = `${gameNameLabel(step.type)} × ${step.count}`;
    } else {
      txt = `${gameNameLabel(step.type)} (${step.mode === "opening" ? "Opening" : "Anime"})`;
    }
    const div = document.createElement("div");
    div.className = "step-line";
    div.innerHTML = `
      <span class="step-label">${txt}</span>
      <span class="step-controls">
        <button class="upBtn" ${idx === 0 ? "disabled" : ""}>⬆️</button>
        <button class="downBtn" ${idx === parcoursSteps.length-1 ? "disabled" : ""}>⬇️</button>
        <button class="removeBtn">🗑️</button>
      </span>
    `;
    // Events
    div.querySelector(".upBtn").onclick = () => { moveStep(idx, -1); };
    div.querySelector(".downBtn").onclick = () => { moveStep(idx, 1); };
    div.querySelector(".removeBtn").onclick = () => { removeStep(idx); };
    stepsList.appendChild(div);
  });
}

function gameNameLabel(type) {
  switch(type) {
    case "anidle": return "Anidle";
    case "openingquizz": return "Opening Quizz";
    case "characterquizz": return "Character Quizz";
    case "animetournament": return "AnimeTournament";
    case "blindranking": return "BlindRanking";
    default: return "";
  }
}

function moveStep(idx, dir) {
  if ((dir === -1 && idx === 0) || (dir === 1 && idx === parcoursSteps.length-1)) return;
  const temp = parcoursSteps[idx];
  parcoursSteps.splice(idx, 1);
  parcoursSteps.splice(idx + dir, 0, temp);
  renderSteps();
}

function removeStep(idx) {
  parcoursSteps.splice(idx, 1);
  renderSteps();
}

// ========== BOUTON LANCER LE PARCOURS ==========
startParcoursBtn.addEventListener("click", () => {
  if (parcoursSteps.length === 0) return;
  showRecap();
});

function showRecap() {
  document.getElementById("parcours-builder").style.display = "none";
  recapSection.style.display = "";
  recapList.innerHTML = "";
  parcoursSteps.forEach((step, i) => {
    let txt = "";
    if (["anidle", "openingquizz", "characterquizz"].includes(step.type)) {
      txt = `${gameNameLabel(step.type)} × ${step.count}`;
    } else {
      txt = `${gameNameLabel(step.type)} (${step.mode === "opening" ? "Opening" : "Anime"})`;
    }
    const li = document.createElement("li");
    li.textContent = `${i+1}. ${txt}`;
    recapList.appendChild(li);
  });
}

// ========== BOUTON EDITER ==========
editParcoursBtn.addEventListener("click", () => {
  document.getElementById("parcours-builder").style.display = "";
  recapSection.style.display = "none";
});

// ========== CONFIRMER LE PARCOURS ==========
launchConfirmedBtn.addEventListener("click", () => {
  // Sauvegarde la liste dans localStorage
  localStorage.setItem("parcoursSteps", JSON.stringify(parcoursSteps));
  localStorage.setItem("parcoursInProgress", "1");
  localStorage.setItem("parcoursIndex", "0");
  // Redirige vers la première étape :
  launchNextParcoursStep();
});

// ========== ENCHAÎNEMENT DES JEUX ==========
function launchNextParcoursStep() {
  const steps = JSON.parse(localStorage.getItem("parcoursSteps") || "[]");
  let idx = parseInt(localStorage.getItem("parcoursIndex") || "0", 10);

  if (!steps.length || idx >= steps.length) {
    localStorage.removeItem("parcoursInProgress");
    localStorage.removeItem("parcoursIndex");
    window.location.href = "parcours_result.html";
    return;
  }
  const step = steps[idx];
  // Selon le type, redirige avec infos utiles en localStorage :
  localStorage.setItem("parcoursCurrent", JSON.stringify(step));
  // Redirection selon le jeu (ici adapte les liens à ton arborescence !)
  if (step.type === "anidle") {
    window.location.href = "anidle.html?parcours=1";
  } else if (step.type === "openingquizz") {
    window.location.href = "openingquizz.html?parcours=1";
  } else if (step.type === "characterquizz") {
    window.location.href = "characterquizz.html?parcours=1";
  } else if (step.type === "animetournament") {
    window.location.href = "animetournament.html?parcours=1";
  } else if (step.type === "blindranking") {
    window.location.href = "blindranking.html?parcours=1";
  } else {
    window.location.href = "../index.html";
  }
}

// Pour pouvoir être appelé depuis les autres jeux :
window.launchNextParcoursStep = launchNextParcoursStep;

// ========= DÉMO : on reload, on restaure si parcours en cours (optionnel) ==========
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("parcoursInProgress")) {
    if (confirm("Un Mode Parcours est en cours, continuer ?")) {
      launchNextParcoursStep();
    } else {
      localStorage.removeItem("parcoursInProgress");
      localStorage.removeItem("parcoursSteps");
      localStorage.removeItem("parcoursIndex");
      localStorage.removeItem("parcoursCurrent");
    }
  }
});
