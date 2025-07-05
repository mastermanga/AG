// ======= DARK/LIGHT MODE + MENU =======
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

// ======= DAILY / CLASSIC MODE LOGIC =======
let isDaily = true;
const DAILY_BANNER = document.getElementById("daily-banner");
const DAILY_STATUS = document.getElementById("daily-status");
const DAILY_SCORE = document.getElementById("daily-score");
const SWITCH_MODE_BTN = document.getElementById("switch-mode-btn");

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2,"0")}`;
}
const SCORE_KEY = `dailyScore_openingquizz_${todayKey()}`;
const OPENING_KEY = `daily_openingquizz_id_${todayKey()}`;

let dailyPlayed = false;
let dailyScore = null;

function getDeterministicDailyIndex(len) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  return seed % len;
}

// ====== OPENING QUIZZ LOGIC =======
function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[5].length === 11) ? match[5] : null;
}

let animeList = [];
let currentIndex = 0;
let player;
let stopInterval;
let currentAnime;
let tries = 0;
const maxTries = 3;
const tryDurations = [3, 5, 15];
let failedAnswers = [];

fetch('../data/openings.json')
  .then(res => res.json())
  .then(data => {
    animeList = data.flatMap(anime =>
      anime.youtubeUrls.map((url, index) => ({
        title: anime.title,
        altTitles: [anime.title.toLowerCase()],
        opening: `Opening ${index + 1}`,
        videoId: extractVideoId(url),
        startTime: index === 1 ? 3 : 0
      }))
    ).filter(a => a.videoId);
    setupGame();
  });

function setupGame() {
  // Gestion du score daily
  dailyScore = localStorage.getItem(SCORE_KEY);
  dailyPlayed = !!dailyScore;
  // Index de daily fixé ou random pour classic
  if (isDaily) {
    let animeIdx;
    if (!localStorage.getItem(OPENING_KEY)) {
      animeIdx = getDeterministicDailyIndex(animeList.length);
      localStorage.setItem(OPENING_KEY, animeIdx);
    } else {
      animeIdx = parseInt(localStorage.getItem(OPENING_KEY));
    }
    currentIndex = animeIdx;
    showDailyBanner();
    if (dailyPlayed) {
      showResultMessage(`✅ Daily du jour déjà jouée !`, true, true);
      blockInputs();
      document.getElementById("nextBtn").style.display = "block";
      return;
    }
  } else {
    currentIndex = Math.floor(Math.random() * animeList.length);
    if (DAILY_BANNER) DAILY_BANNER.style.display = "none";
    unlockClassicInputs();
  }

  currentAnime = animeList[currentIndex];
  if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
    window.onYouTubeIframeAPIReady = initPlayer;
  } else {
    initPlayer();
  }
  resetControls();
}

function showDailyBanner() {
  if (!DAILY_BANNER) return;
  DAILY_BANNER.style.display = "block";
  updateSwitchModeBtn();
  if (dailyPlayed) {
    DAILY_STATUS.textContent = "✅ Daily du jour déjà jouée !";
    DAILY_SCORE.textContent = `Score : ${dailyScore} pts`;
  } else {
    DAILY_STATUS.textContent = "🎲 Daily du jour :";
    DAILY_SCORE.textContent = "";
  }
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
if (SWITCH_MODE_BTN) {
  SWITCH_MODE_BTN.onclick = () => {
    isDaily = !isDaily;
    setupGame();
  };
}
function unlockClassicInputs() {
  document.getElementById("openingInput").disabled = false;
  document.getElementById("playTry1").disabled = false;
  document.getElementById("playTry2").disabled = true;
  document.getElementById("playTry3").disabled = true;
  document.getElementById("nextBtn").style.display = "none";
}

// ============ PLAYER LOGIC ===========
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function initPlayer() {
  player = new YT.Player('playerWrapper', {
    height: '0',
    width: '0',
    videoId: currentAnime.videoId,
    playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3 },
    events: {
      onReady: (event) => player.setVolume(50),
      onStateChange: onPlayerStateChange
    }
  });
}
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    clearInterval(stopInterval);
    stopInterval = setInterval(() => {
      const currentTime = player.getCurrentTime();
      if (currentTime >= (currentAnime.startTime + tryDurations[tries - 1])) {
        player.pauseVideo();
        clearInterval(stopInterval);
      }
    }, 200);
  }
}
function resetControls() {
  tries = 0;
  failedAnswers = [];
  updateFailedAttempts();
  document.getElementById("result").textContent = "";
  document.getElementById("result").className = "";
  document.getElementById("timer").style.display = "none";
  document.getElementById("timer").textContent = "";
  document.getElementById("openingInput").value = "";
  document.getElementById("openingInput").disabled = true;
  document.getElementById("playTry1").disabled = false;
  document.getElementById("playTry2").disabled = true;
  document.getElementById("playTry3").disabled = true;
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("suggestions").innerHTML = "";
}

function playTry(n) {
  if (isDaily && dailyPlayed) return;
  if (n !== tries + 1) return alert("Vous devez écouter les extraits dans l'ordre.");
  tries = n;
  document.getElementById("openingInput").disabled = false;
  document.getElementById("result").textContent = "";
  document.getElementById("result").className = "";
  clearInterval(stopInterval);

  let start = 0;
  if (tries === 2) start = 3;
  if (tries === 3) start = 0;
  currentAnime.startTime = start;

  player.loadVideoById({
    videoId: currentAnime.videoId,
    startSeconds: start,
    endSeconds: start + tryDurations[tries - 1]
  });
  player.playVideo();

  document.getElementById("playTry1").disabled = true;
  document.getElementById("playTry2").disabled = (tries !== 1);
  document.getElementById("playTry3").disabled = (tries !== 2);
}

function checkAnswer(selectedTitle) {
  if (isDaily && dailyPlayed) return;
  const inputVal = selectedTitle.trim().toLowerCase();
  if (currentAnime.altTitles.includes(inputVal)) {
    // SCORE: 1000/800/500 pour daily, sinon pas de save
    let score = 0;
    if (isDaily && !dailyPlayed) {
      score = tries === 1 ? 1000 : (tries === 2 ? 800 : 500);
      localStorage.setItem(SCORE_KEY, score);
      showDailyBanner();
      dailyPlayed = true;
      dailyScore = score;
    }
    showResultMessage(`✅ Bravo ! C’est ${currentAnime.title}${isDaily && score ? " ("+score+" pts)" : ""}`, true);
    blockInputs();
    showNextButton();
  } else {
    failedAnswers.push(selectedTitle);
    updateFailedAttempts();
    if (tries >= maxTries) {
      revealAnswer();
    } else {
      document.getElementById("openingInput").disabled = true;
    }
  }
}

function updateFailedAttempts() {
  document.getElementById("failedAttempts").innerText = failedAnswers.map(e => `❌ ${e}`).join("\n");
}
function revealAnswer() {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = `🔔 Réponse : ${currentAnime.title}`;
  resultDiv.className = "incorrect";
  blockInputs();
  showNextButton();
}
function blockInputs() {
  document.getElementById("openingInput").disabled = true;
  document.getElementById("playTry1").disabled = true;
  document.getElementById("playTry2").disabled = true;
  document.getElementById("playTry3").disabled = true;
  document.getElementById("suggestions").innerHTML = "";
}
function showNextButton() {
  document.getElementById("nextBtn").style.display = "block";
}

function nextAnime() {
  if (isDaily) {
    window.location.href = "../index.html";
    return;
  }
  if(player && player.stopVideo) player.stopVideo();
  currentIndex = Math.floor(Math.random() * animeList.length);
  currentAnime = animeList[currentIndex];
  resetControls();
}

function showResultMessage(msg, correct = false, dailyDone = false) {
  document.getElementById("result").textContent = msg;
  document.getElementById("result").className = correct ? "correct" : "incorrect";
  if (dailyDone) {
    blockInputs();
    document.getElementById("nextBtn").textContent = "Retour menu";
    document.getElementById("nextBtn").style.display = "block";
  } else if (correct) {
    document.getElementById("nextBtn").textContent = isDaily ? "Retour menu" : "Rejouer";
  }
}

document.getElementById("playTry1").addEventListener("click", () => playTry(1));
document.getElementById("playTry2").addEventListener("click", () => playTry(2));
document.getElementById("playTry3").addEventListener("click", () => playTry(3));
document.getElementById("nextBtn").addEventListener("click", () => nextAnime());

// ===== AUTOCOMPLETE & SUBMIT =====
const input = document.getElementById("openingInput");
input.addEventListener("input", function() {
  if (isDaily && dailyPlayed) return;
  const val = this.value.toLowerCase();
  const suggestionsDiv = document.getElementById("suggestions");
  suggestionsDiv.innerHTML = "";
  if (!val || document.getElementById("openingInput").disabled) return;
  const uniqueTitles = [...new Set(animeList.map(a => a.title))];
  const matches = uniqueTitles.filter(title => title.toLowerCase().includes(val)).slice(0, 6);
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
