// === MENU & THEME ===
document.getElementById("back-to-menu").addEventListener("click", function() {
  window.location.href = "../index.html";
});
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
});
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
});

// === DAILY SYSTEME ===
let isDaily = true;
const DAILY_BANNER = document.getElementById("daily-banner");
const DAILY_STATUS = document.getElementById("daily-status");
const DAILY_SCORE = document.getElementById("daily-score");
const SWITCH_MODE_BTN = document.getElementById("switch-mode-btn");

// --- Seed utils ---
function getGameSeed(gameName, year, month, day) {
  let str = `${gameName}_${year}_${month}_${day}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash) >>> 0;
}
function seededRandom(seed) {
  return function() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}
const SCORE_KEY = `dailyScore_characterquizz_${todayKey()}`;
const CHARACTER_KEY = `daily_characterquizz_id_${todayKey()}`; // index du jour (pour compatibilité, mais inutile après seed unique)

let dailyPlayed = false;
let dailyScore = null;

if (SWITCH_MODE_BTN) {
  SWITCH_MODE_BTN.onclick = () => {
    isDaily = !isDaily;
    startNewGame();
  };
}
function updateSwitchModeBtn() {
  if (!SWITCH_MODE_BTN) return;
  if (isDaily) {
    SWITCH_MODE_BTN.textContent = "Passer en mode Classic";
    SWITCH_MODE_BTN.style.backgroundColor = "#42a5f5";
  } else {
    SWITCH_MODE_BTN.textContent = "Revenir au Daily";
    SWITCH_MODE_BTN.style.backgroundColor = "#00bcd4";
  }
}
function showDailyBanner() {
  if (!DAILY_BANNER) return;
  DAILY_BANNER.style.display = "block";
  updateSwitchModeBtn();
  if (dailyPlayed) {
    DAILY_STATUS.innerHTML = "<span style='font-weight:bold;'><input type='checkbox' checked disabled style='accent-color:#38d430; margin-right:6px;'>Daily du jour déjà jouée !</span>";
    DAILY_SCORE.innerHTML = `Score : ${dailyScore} pts`;
  } else {
    DAILY_STATUS.textContent = "🎲 Daily du jour :";
    DAILY_SCORE.textContent = "";
  }
}

// === VARIABLES & DOM ===
const container = document.getElementById("character-container");
const feedback = document.getElementById("feedback");
const timerDisplay = document.getElementById("timer");
const input = document.getElementById("characterInput");
const submitBtn = document.getElementById("submit-btn");
const restartBtn = document.getElementById("restart-btn");
const suggestions = document.getElementById("suggestions");

let allAnimes = [];
let currentAnime = null;
let revealedCount = 0;
let gameEnded = false;
let countdown = 5;
let countdownInterval = null;

// Chargement des données
async function loadAnimes() {
  try {
    const response = await fetch('../data/animes.json');
    allAnimes = await response.json();
    startNewGame();
  } catch (error) {
    timerDisplay.textContent = "Erreur de chargement des données.";
    console.error(error);
  }
}

// --- Le coeur du jeu, Daily ou Classic selon isDaily ---
function startNewGame() {
  dailyScore = localStorage.getItem(SCORE_KEY);
  dailyPlayed = !!dailyScore;
  if (isDaily && allAnimes.length > 0) {
    let animeIdx;
    let stored = localStorage.getItem(CHARACTER_KEY);
    if (!stored) {
      // SEED UNIQUE avec nom du jeu
      const d = new Date();
      const seed = getGameSeed("characterquizz", d.getFullYear(), d.getMonth()+1, d.getDate());
      const rand = seededRandom(seed)();
      animeIdx = Math.floor(rand * allAnimes.length);
      localStorage.setItem(CHARACTER_KEY, animeIdx);
    } else {
      animeIdx = parseInt(stored);
    }
    currentAnime = allAnimes[animeIdx];
    showDailyBanner();
    if (dailyPlayed) {
      showSuccessDailyMsg();
      blockInputs();
      return;
    }
  } else if (allAnimes.length > 0) {
    currentAnime = allAnimes[Math.floor(Math.random() * allAnimes.length)];
    if (DAILY_BANNER) DAILY_BANNER.style.display = "none";
    unlockClassicInputs();
  }

  // Reset
  container.innerHTML = '';
  feedback.textContent = '';
  feedback.className = "";
  revealedCount = 0;
  gameEnded = false;
  restartBtn.style.display = 'none';

  // Affiche tous les persos mais masqués (display:none)
  currentAnime.characters.forEach((char, i) => {
    const img = document.createElement("img");
    img.src = char.image;
    img.alt = char.name;
    img.className = "character-img";
    img.id = "char-" + i;
    img.style.display = "none";
    container.appendChild(img);
  });

  revealNextCharacter();

  input.disabled = false;
  input.value = '';
  submitBtn.disabled = true;
  input.focus();

  suggestions.innerHTML = '';
  timerDisplay.textContent = '';
  clearInterval(countdownInterval);
  resetTimer();
}

function showSuccessDailyMsg() {
  feedback.innerHTML = `<span style="font-weight:bold; color:#4caf50;">
    <input type="checkbox" checked disabled style="accent-color:#38d430; margin-right:6px;">
    Daily du jour déjà jouée ! Score : ${dailyScore} pts
  </span>`;
  feedback.className = "success";
  restartBtn.textContent = "Retour menu";
  restartBtn.style.display = 'inline-block';
  timerDisplay.textContent = "";
}

// --- UI Logic ---
function unlockClassicInputs() {
  input.disabled = false;
  submitBtn.disabled = true;
  restartBtn.textContent = "Rejouer";
  restartBtn.style.display = "none";
}
function blockInputs() {
  input.disabled = true;
  submitBtn.disabled = true;
  restartBtn.style.display = "inline-block";
}

// Suggestions comme Anidle
input.addEventListener("input", function() {
  if (gameEnded || (isDaily && dailyPlayed)) return;
  const val = this.value.toLowerCase();
  suggestions.innerHTML = '';
  feedback.textContent = '';
  submitBtn.disabled = true;
  if (!val) return;
  // max 7 suggestions
  const found = [...new Set(allAnimes.map(a => a.title))]
    .filter(title => title.toLowerCase().includes(val))
    .slice(0, 7);

  found.forEach(title => {
    const div = document.createElement("div");
    div.innerHTML = `<span>${title.replace(new RegExp(val, 'i'), 
      match => `<b>${match}</b>`)}</span>`;
    div.addEventListener("mousedown", function(e) {
      e.preventDefault();
      input.value = title;
      suggestions.innerHTML = "";
      submitBtn.disabled = false;
      input.focus();
    });
    suggestions.appendChild(div);
  });
});

// Active le bouton valider si la valeur matche un titre
input.addEventListener("input", function() {
  const val = this.value.trim().toLowerCase();
  const titles = allAnimes.map(a => a.title.toLowerCase());
  submitBtn.disabled = !titles.includes(val) || (isDaily && dailyPlayed);
});

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !submitBtn.disabled && !gameEnded && !(isDaily && dailyPlayed)) {
    checkGuess();
  }
});

submitBtn.addEventListener("click", checkGuess);
restartBtn.addEventListener("click", function() {
  if (isDaily && dailyPlayed) {
    window.location.href = "../index.html";
  } else {
    startNewGame();
  }
});

function revealNextCharacter() {
  if (revealedCount < currentAnime.characters.length) {
    const img = document.getElementById("char-" + revealedCount);
    if (img) img.style.display = "block";
    revealedCount++;
    resetTimer();
  }
}

function resetTimer() {
  countdown = 5;
  timerDisplay.textContent = `Temps restant : ${countdown} s`;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (!gameEnded) {
        if (revealedCount === currentAnime.characters.length) {
          feedback.textContent = `⏰ Temps écoulé ! Tu as perdu. C'était "${currentAnime.title}".`;
          feedback.className = "error";
          endGame();
        } else {
          revealNextCharacter();
        }
      }
    } else {
      timerDisplay.textContent = `Temps restant : ${countdown} s`;
    }
  }, 1000);
}

function checkGuess() {
  if (gameEnded || (isDaily && dailyPlayed)) return;

  const guess = input.value.trim();
  if (!guess) {
    feedback.textContent = "⚠️ Tu dois écrire un nom d'anime.";
    feedback.className = "error";
    return;
  }
  const normalizedGuess = guess.toLowerCase();
  const answer = currentAnime.title.toLowerCase();

  if (normalizedGuess === answer) {
    feedback.textContent = `🎉 Bonne réponse ! C'était bien "${currentAnime.title}"`;
    feedback.className = "success";
    clearInterval(countdownInterval);
    // Affiche tous les persos restants
    for (let i = revealedCount; i < currentAnime.characters.length; i++) {
      document.getElementById("char-" + i).style.display = "block";
    }
    // --- Scoring only for Daily ---
    if (isDaily && !dailyPlayed) {
      let score = Math.max(1000 - (revealedCount-1)*100, 100);
      localStorage.setItem(SCORE_KEY, score);
      dailyPlayed = true;
      dailyScore = score;
      showDailyBanner();
      restartBtn.textContent = "Retour menu";
    } else {
      restartBtn.textContent = "Rejouer";
    }
    endGame();
  } else {
    feedback.textContent = "❌ Mauvaise réponse.";
    feedback.className = "error";
    if (revealedCount < currentAnime.characters.length) {
      clearInterval(countdownInterval);
      revealNextCharacter();
    } else {
      feedback.textContent += ` Tu as épuisé tous les indices. C'était "${currentAnime.title}".`;
      endGame();
    }
  }

  input.value = '';
  submitBtn.disabled = true;
  input.focus();
  suggestions.innerHTML = '';
}

function endGame() {
  gameEnded = true;
  input.disabled = true;
  submitBtn.disabled = true;
  restartBtn.style.display = 'inline-block';
  timerDisplay.textContent = "Jeu terminé.";
  suggestions.innerHTML = '';
}

loadAnimes();
