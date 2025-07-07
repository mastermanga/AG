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

const parcoursContainer = document.getElementById("parcours-container");
const parcoursIframe = document.getElementById("parcours-iframe");
const parcoursScore = document.getElementById("parcours-score");
const parcoursFinish = document.getElementById("parcours-finish");

// Ajout loader (HTML dans JS, ou bien ajoute le DIV dans ton HTML !)
let parcoursLoader = document.getElementById('parcours-loader');
if (!parcoursLoader) {
  parcoursLoader = document.createElement('div');
  parcoursLoader.id = 'parcours-loader';
  parcoursLoader.textContent = "Chargement du jeu…";
  parcoursLoader.style.cssText = "display:none;text-align:center;margin:1.3rem;font-size:1.3rem;";
  parcoursContainer && parcoursContainer.insertBefore(parcoursLoader, parcoursIframe);
}

let parcoursSteps = [];
let parcoursScores = []; // Pour stocker les scores en live

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
  console.log("showRecap appelé !");
  document.getElementById("parcours-builder").style.display = "none";
  recapSection.style.display = "block";
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
  console.log("BOUTON CONFIRMER CLICK !");
  // Sauvegarde la liste dans localStorage
  localStorage.setItem("parcoursSteps", JSON.stringify(parcoursSteps));
  localStorage.setItem("parcoursInProgress", "1");
  localStorage.setItem("parcoursIndex", "0");
  parcoursScores = [];
  startIframeParcours();
  console.log("startIframeParcours a été appelée");
});

// ========== MODE IFRAME ==========
// Avec effet + loader
function startIframeParcours() {
  console.log("startIframeParcours DEBUT");
  document.getElementById("parcours-builder").style.display = "none";
  recapSection.style.display = "none";
  parcoursContainer.style.display = "flex";
  parcoursContainer.classList.add("active");
  parcoursScore.style.display = "none";
  parcoursFinish.style.display = "none";
  parcoursScores = [];
  launchIframeStep(0);
}

function launchIframeStep(idx) {
  console.log("launchIframeStep:", idx);
  const steps = JSON.parse(localStorage.getItem("parcoursSteps") || "[]");
  if (!steps.length || idx >= steps.length) {
    showFinalRecap();
    return;
  }
  localStorage.setItem("parcoursInProgress", "1");
  localStorage.setItem("parcoursIndex", String(idx));
  const step = steps[idx];
  let url = "";
  // REMETS BIEN TON CHEMIN DE BASE ICI
  const base = "https://mastermanga.github.io/AG/";
  if (step.type === "anidle") {
    url = `${base}Anidle/index.html?parcours=1&count=${step.count}`;
  } else if (step.type === "openingquizz") {
    url = `${base}OpeningQuizz/index.html?parcours=1&count=${step.count}`;
  } else if (step.type === "characterquizz") {
    url = `${base}CharacterQuizz/index.html?parcours=1&count=${step.count}`;
  } else if (step.type === "animetournament") {
    url = `${base}AnimeTournament/index.html?parcours=1&mode=${step.mode || "anime"}&count=${step.count}`;
  } else if (step.type === "blindranking") {
    url = `${base}BlindRanking/index.html?parcours=1&mode=${step.mode || "anime"}&count=${step.count}`;
  } else {
    url = base + "index.html";
  }
  console.log("URL utilisée pour l'iframe :", url);
  parcoursIframe.style.display = "none";
  parcoursLoader.style.display = "block";
  parcoursIframe.onload = () => {
    parcoursLoader.style.display = "none";
    parcoursIframe.style.display = "block";
  };
  parcoursIframe.src = url;
}


// Pour les jeux : doivent appeler parent.postMessage({parcoursScore: ...}, "*")
window.addEventListener("message", (e) => {
  // {parcoursScore: { label: "Opening Quizz", score: 21, total: 25 }}
  if (e.data && e.data.parcoursScore) {
    parcoursScores.push(e.data.parcoursScore);
    // Prochaine étape
    const idx = parseInt(localStorage.getItem("parcoursIndex") || "0", 10) + 1;
    const steps = JSON.parse(localStorage.getItem("parcoursSteps") || "[]");
    if (idx < steps.length) {
      launchIframeStep(idx);
    } else {
      showFinalRecap();
    }
  }
});

// ========== AFFICHAGE FINAL ==========
function showFinalRecap() {
  parcoursIframe.style.display = "none";
  parcoursLoader.style.display = "none";
  parcoursScore.style.display = "block";
  parcoursFinish.style.display = "block";
  let html = "<h2>Récapitulatif du Parcours</h2><ul>";
  let totalScore = 0;
  parcoursScores.forEach((res, idx) => {
    html += `<li>${res.label} : <b>${res.score} / ${res.total}</b></li>`;
    totalScore += (typeof res.score === "number" ? res.score : 0);
  });
  html += "</ul>";
  html += `<div style="font-size:1.3rem;margin-top:13px;"><b>Score total : ${totalScore}</b></div>`;
  parcoursScore.innerHTML = html;
  // Bouton retour menu
  parcoursFinish.innerHTML = `<button onclick="window.location.href='../index.html'">Retour menu</button>`;
}

// Pour pouvoir être appelé depuis l’iframe :
window.launchNextParcoursStep = function() {
  // Les jeux doivent poster le score avec :
  // parent.postMessage({parcoursScore: {label:..., score:..., total:...}}, "*");
  // Ici, le passage est fait à la réception du message postMessage (voir listener plus haut)
};

// Restauration parcours en cours si reload
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("parcoursInProgress")) {
    if (confirm("Un Mode Parcours est en cours, continuer ?")) {
      startIframeParcours();
    } else {
      localStorage.removeItem("parcoursInProgress");
      localStorage.removeItem("parcoursSteps");
      localStorage.removeItem("parcoursIndex");
      localStorage.removeItem("parcoursCurrent");
    }
  }
});
