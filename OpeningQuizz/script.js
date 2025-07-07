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
  dailyScore = localStorage.getItem(SCORE_KEY);
  dailyPlayed = !!dailyScore;

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
      showDailyBanner();
      showResultMessage("✅ Daily du jour déjà jouée !", true, true, true);
      blockInputs();
      document.getElementById("nextBtn").style.display = "block";
      document.getElementById("nextBtn").textContent = "Retour menu";
      resizeContainer();
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
  resizeContainer();
}

function showDailyBanner() {
  if (!DAILY_BANNER) return;
  DAILY_BANNER.style.display = "flex";
  updateSwitchModeBtn();
  if (dailyPlayed) {
    // ✅ Daily du jour déjà jouée !  Score : 1000 pts
    DAILY_STATUS.innerHTML = `<span style="color:#25ff67;font-size:1.3em;vertical-align:-2px;">&#x2705;</span> <b>Daily du jour déjà jouée !</b>`;
    DAILY_SCORE.innerHTML = `<span style="margin-left:12px;">Score : <b>${dailyScore} pts</b></span>`;
  } else {
    DAILY_STATUS.innerHTML = `<span style="font-size:1.35em;vertical-align:-1.5px;">🎲</span> <b>Daily du jour :</b>`;
    DAILY_SCORE.innerHTML = "";
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

// ============ PLAYER LOGIC (YOUTUBE LECTURE FLEXIBLE) ===========
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
  resizeContainer();
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
  resizeContainer();
}

function checkAnswer(selectedTitle) {
  if (isDaily && dailyPlayed) return;
  const inputVal = selectedTitle.trim().toLowerCase();
  if (currentAnime.altTitles.includes(inputVal)) {
    let score = 0;
    if (isDaily && !dailyPlayed) {
      score = tries === 1 ? 1000 : (tries === 2 ? 800 : 500);
      localStorage.setItem(SCORE_KEY, score);
      dailyPlayed = true;
      dailyScore = score;
      showDailyBanner(); // met à jour le bandeau direct (✅ Daily du jour déjà jouée ! ...)
    }
    showVictory();
    blockInputs();
    showNextButton();
    resizeContainer();
  } else {
    failedAnswers.push(selectedTitle);
    updateFailedAttempts();
    if (tries >= maxTries) {
      revealAnswer();
    } else {
      document.getElementById("openingInput").disabled = true;
    }
    resizeContainer();
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
  resizeContainer();
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
  document.getElementById("nextBtn").textContent = isDaily ? "Retour menu" : "Rejouer";
}

// ===== VICTOIRE / MESSAGE =====
function showVictory() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `🎉 Bravo ! C’est <b>${currentAnime.title}</b> <span style="font-size:1.1em;">en ${tries} tentative${tries > 1 ? "s" : ""}.</span> 🥳`;
  resultDiv.className = "correct";
  launchFireworks();
}
function launchFireworks() {
  const canvas = document.getElementById("fireworks");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  function createParticle(x, y) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = Math.random() * 5 + 2;
    return { x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 60 };
  }
  for (let i = 0; i < 80; i++) {
    particles.push(createParticle(canvas.width / 2, canvas.height / 2));
  }
  function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.05;
      p.life--;
    });
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 0) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ========== AUTOCOMPLETE & SUBMIT ==========
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

// ========= BUTTONS EVENTS =========
document.getElementById("playTry1").addEventListener("click", () => playTry(1));
document.getElementById("playTry2").addEventListener("click", () => playTry(2));
document.getElementById("playTry3").addEventListener("click", () => playTry(3));
document.getElementById("nextBtn").addEventListener("click", () => nextAnime());

function nextAnime() {
  if (isDaily) {
    window.location.href = "../index.html";
    return;
  }
  if (player && player.stopVideo) player.stopVideo();
  currentIndex = Math.floor(Math.random() * animeList.length);
  currentAnime = animeList[currentIndex];
  resetControls();
  if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
    window.onYouTubeIframeAPIReady = initPlayer;
  } else {
    initPlayer();
  }
  resizeContainer();
}

// ===== Resize container (évite grand vide en bas) =====
function resizeContainer() {
  const c = document.getElementById("container");
  if (!c) return;
  c.style.minHeight = "unset";
  c.style.height = "unset";
  setTimeout(() => {
    c.style.height = "auto";
    c.style.minHeight = "0";
  }, 40);
}
