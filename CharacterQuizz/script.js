// ========== DARK/LIGHT MODE + MENU ==========
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
  if (savedTheme === "light") document.body.classList.add("light");
});

// ========== VARIABLES ==========
let data = [];
let dailyPlayed = false;
let dailyScore = null;
let currentCharacter = null;
let currentAnswer = "";
let isDaily = true;
let attemptCount = 0;
let allAnimes = [];
let dailyIndex = 0;

// ========== DAILY KEYS ==========
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2,"0")}`;
}
const SCORE_KEY = `daily_characterquizz_score_${todayKey()}`;
const CHAR_INDEX_KEY = `daily_characterquizz_idx_${todayKey()}`;

// ========== FETCH DATA + INIT ==========
fetch('../data/characters.json')
  .then(res => res.json())
  .then(characters => {
    data = characters;
    allAnimes = [...new Set(data.map(c => c.anime))];
    setupGame();
  });

// ========== SETUP GAME ==========
function setupGame() {
  attemptCount = 0;
  dailyScore = localStorage.getItem(SCORE_KEY);
  dailyPlayed = !!dailyScore;

  // --- Daily index persistant pour chaque jour
  if (isDaily) {
    if (!localStorage.getItem(CHAR_INDEX_KEY)) {
      dailyIndex = getDeterministicDailyIndex(data.length);
      localStorage.setItem(CHAR_INDEX_KEY, dailyIndex);
    } else {
      dailyIndex = parseInt(localStorage.getItem(CHAR_INDEX_KEY));
    }
    currentCharacter = data[dailyIndex];
    if (dailyPlayed) {
      showFeedback(`✅ Déjà joué ! Score : ${dailyScore} pts`, "correct");
      document.getElementById("submit-btn").disabled = true;
      document.getElementById("characterInput").disabled = true;
    } else {
      showFeedback("Mode Daily du jour : Qui est-ce ?", "");
      document.getElementById("submit-btn").disabled = false;
      document.getElementById("characterInput").disabled = false;
    }
  } else {
    // Mode classic random
    currentCharacter = data[Math.floor(Math.random() * data.length)];
    showFeedback("Mode Classic : Qui est-ce ?", "");
    document.getElementById("submit-btn").disabled = false;
    document.getElementById("characterInput").disabled = false;
  }
  document.getElementById("characterInput").value = "";
  document.getElementById("suggestions").innerHTML = "";
  document.getElementById("restart-btn").style.display = "none";
  displayCharacter(currentCharacter);
}

// ========== DAILY DETERMINISTIC ==========
function getDeterministicDailyIndex(len) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  return seed % len;
}

// ========== DISPLAY CHARACTER IMAGE ==========
function displayCharacter(char) {
  const container = document.getElementById("character-container");
  container.innerHTML = `
    <img src="${char.image}" alt="Character" style="max-width:170px; border-radius:12px; box-shadow:0 2px 8px #00bcd44a; margin: 18px auto 20px auto; display:block;">
    <div style="font-size:1.07rem; margin-bottom:8px; color:#00bcd4;text-align:center;">
      ${isDaily ? "🗓️ Daily" : "🎲 Classic"}
    </div>
  `;
}

// ========== AUTOCOMPLETE SUGGESTIONS ==========
const input = document.getElementById("characterInput");
input.addEventListener("input", function() {
  const val = this.value.trim().toLowerCase();
  const suggestionsDiv = document.getElementById("suggestions");
  suggestionsDiv.innerHTML = "";
  if (!val || input.disabled) return;
  const matches = allAnimes.filter(title => title.toLowerCase().includes(val)).slice(0, 6);
  matches.forEach(title => {
    const div = document.createElement("div");
    div.textContent = title;
    div.onclick = () => {
      input.value = title;
      suggestionsDiv.innerHTML = "";
      checkAnswer(title);
    };
    suggestionsDiv.appendChild(div);
  });
});
input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !input.disabled) {
    const val = input.value.trim();
    if (!val) return;
    checkAnswer(val);
    document.getElementById("suggestions").innerHTML = "";
  }
});
document.addEventListener("click", (e) => {
  if (e.target !== input) document.getElementById("suggestions").innerHTML = "";
});

// ========== CHECK ANSWER ==========
function checkAnswer(answer) {
  if (input.disabled) return;
  attemptCount++;
  const ok = answer.trim().toLowerCase() === currentCharacter.anime.toLowerCase();
  if (ok) {
    // SCORE Daily (base 2000 - 100 x tentatives)
    let score = 0;
    if (isDaily && !dailyPlayed) {
      score = 2000 - (attemptCount - 1) * 100;
      if (score < 0) score = 0;
      localStorage.setItem(SCORE_KEY, score);
      dailyScore = score;
      dailyPlayed = true;
    }
    showFeedback(`✅ Bravo ! C'était : ${currentCharacter.anime} (${attemptCount} tentative${attemptCount>1?'s':''})${isDaily ? " | Score : "+score+" pts" : ""}`, "correct");
    document.getElementById("submit-btn").disabled = true;
    input.disabled = true;
    document.getElementById("restart-btn").style.display = "inline-block";
  } else {
    showFeedback(`❌ Mauvaise réponse : ${answer}`, "incorrect");
    if (attemptCount >= 5) {
      showFeedback(`🔔 C'était : ${currentCharacter.anime}`, "incorrect");
      document.getElementById("submit-btn").disabled = true;
      input.disabled = true;
      document.getElementById("restart-btn").style.display = "inline-block";
    }
  }
}

// ========== FEEDBACK ==========
function showFeedback(msg, css) {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = css;
}

// ========== SUBMIT / REJOUER ==========
document.getElementById("submit-btn").onclick = () => {
  const val = input.value.trim();
  if (!val) return;
  checkAnswer(val);
};
document.getElementById("restart-btn").onclick = () => {
  if (isDaily) window.location.reload();
  else setupGame();
};

// ========== MODE CLASSIC/DAILY SWITCH (optionnel bouton, ou clavier Ctrl+M) ==========
window.switchCharacterMode = function() {
  isDaily = !isDaily;
  setupGame();
};
// **Bonus** : raccourci clavier Ctrl+M pour basculer Daily/Classic (optionnel)
window.addEventListener("keydown", function(e) {
  if (e.ctrlKey && e.key.toLowerCase() === 'm') {
    isDaily = !isDaily;
    setupGame();
  }
});
