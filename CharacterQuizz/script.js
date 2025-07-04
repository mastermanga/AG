// Bouton retour au menu
document.getElementById("back-to-menu").addEventListener("click", function() {
  window.location.href = "../index.html";
});

// Thème dark/light + persistance
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

// ========== CARACTÈRES ==========
const container = document.getElementById("character-container");
const feedback = document.getElementById("feedback");
const timerDisplay = document.getElementById("timer");
const input = document.getElementById("characterInput"); // nouveau nom uniforme
const submitBtn = document.getElementById("submit-btn");
const restartBtn = document.getElementById("restart-btn");
const suggestions = document.getElementById("suggestions");

let allAnimes = [];
let currentAnime = null;
let revealedCount = 0;
let gameEnded = false;
let countdown = 5;
let countdownInterval = null;

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

function startNewGame() {
  currentAnime = allAnimes[Math.floor(Math.random() * allAnimes.length)];
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

// Système de suggestions identique à Anidle
input.addEventListener("input", function() {
  if (gameEnded) return;
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
  submitBtn.disabled = !titles.includes(val);
});

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !submitBtn.disabled && !gameEnded) {
    checkGuess();
  }
});

submitBtn.addEventListener("click", checkGuess);
restartBtn.addEventListener("click", startNewGame);

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
  if (gameEnded) return;

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
