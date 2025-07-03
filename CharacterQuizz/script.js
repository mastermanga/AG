const container = document.getElementById("character-container");
const feedback = document.getElementById("feedback");
const timerDisplay = document.getElementById("timer");
const guessInput = document.getElementById("guess-input");
const submitBtn = document.getElementById("submit-btn");
const restartBtn = document.getElementById("restart-btn");
const animeList = document.getElementById("anime-list");

let currentAnime = null;
let revealedCount = 0;
let gameEnded = false;
let countdown = 5;
let countdownInterval = null;
let allAnimes = [];

async function loadAnimes() {
  try {
    const response = await fetch('../data/animes.json');
    const animes = await response.json();
    allAnimes = animes;

    // Remplir la datalist avec les titres uniques
    const titles = [...new Set(animes.map(a => a.title))];
    animeList.innerHTML = '';
    titles.forEach(title => {
      const option = document.createElement('option');
      option.value = title;
      animeList.appendChild(option);
    });

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
  revealedCount = 0;
  gameEnded = false;
  restartBtn.style.display = 'none';

  currentAnime.characters.forEach((char, i) => {
    const img = document.createElement("img");
    img.src = char.image;
    img.alt = char.name;
    img.className = "character-img";
    img.id = "char-" + i;
    container.appendChild(img);
  });

  revealNextCharacter();

  guessInput.disabled = false;
  submitBtn.disabled = true;
  guessInput.value = '';
  guessInput.focus();

  timerDisplay.textContent = '';
  clearInterval(countdownInterval);
  resetTimer();
}

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

  const guess = guessInput.value.trim();
  if (!guess) {
    feedback.textContent = "⚠️ Tu dois écrire un nom d'anime.";
    feedback.className = "error";
    return;
  }

  // Vérifier si la saisie correspond à un titre connu (ignore la casse)
  const normalizedGuess = guess.toLowerCase();
  const validTitles = allAnimes.map(a => a.title.toLowerCase());
  if (!validTitles.includes(normalizedGuess)) {
    feedback.textContent = "⚠️ Cet anime n'est pas dans la liste.";
    feedback.className = "error";
    return;
  }

  const answer = currentAnime.title.toLowerCase();

  if (normalizedGuess === answer) {
    feedback.textContent = `🎉 Bonne réponse ! C'était bien "${currentAnime.title}"`;
    feedback.className = "success";
    clearInterval(countdownInterval);
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

  guessInput.value = '';
  submitBtn.disabled = true;
  guessInput.focus();
}

function endGame() {
  gameEnded = true;
  guessInput.disabled = true;
  submitBtn.disabled = true;
  restartBtn.style.display = 'inline-block';
  timerDisplay.textContent = "Jeu terminé.";
}

guessInput.addEventListener("input", () => {
  submitBtn.disabled = guessInput.value.trim() === '';
  feedback.textContent = '';
});

submitBtn.addEventListener("click", checkGuess);

restartBtn.addEventListener("click", () => {
  startNewGame();
});

loadAnimes();
