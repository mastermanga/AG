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

// ====== OPENING QUIZZ LOGIC (UNIFORME ANIDLE) =======
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
    shuffle(animeList);
    currentIndex = 0;
    currentAnime = animeList[currentIndex];
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  });

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
  resetControls();
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
  const inputVal = selectedTitle.trim().toLowerCase();
  if (currentAnime.altTitles.includes(inputVal)) {
    document.getElementById("result").textContent = `✅ Bravo ! C’est ${currentAnime.title}`;
    document.getElementById("result").className = "correct";
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
  if(player && player.stopVideo) player.stopVideo();
  currentIndex++;
  if (currentIndex >= animeList.length) {
    alert("Fin du quiz ! Merci d'avoir joué.");
    currentIndex = 0;
  }
  currentAnime = animeList[currentIndex];
  resetControls();
}

document.getElementById("playTry1").addEventListener("click", () => playTry(1));
document.getElementById("playTry2").addEventListener("click", () => playTry(2));
document.getElementById("playTry3").addEventListener("click", () => playTry(3));
document.getElementById("nextBtn").addEventListener("click", () => nextAnime());

// ===== UNIFORME ANIDLE — AUTOCOMPLETE & SUBMIT =====
const input = document.getElementById("openingInput");
input.addEventListener("input", function() {
  const val = this.value.toLowerCase();
  const suggestionsDiv = document.getElementById("suggestions");
  suggestionsDiv.innerHTML = "";
  if (!val || document.getElementById("openingInput").disabled) return;
  // Unique titres seulement
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

// "Entrée" valide direct si suggestion unique ou titre exact
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
