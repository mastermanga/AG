// Bouton retour au menu
document.getElementById("back-to-menu").addEventListener("click", function() {
  window.location.href = "../index.html";
});

// Bouton changer de thème + persistance
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
      onReady: (event) => {
        player.setVolume(50);
      },
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
  document.getElementById("guessInput").value = "";
  document.getElementById("guessInput").disabled = true;
  document.getElementById("playTry1").disabled = false;
  document.getElementById("playTry2").disabled = true;
  document.getElementById("playTry3").disabled = true;
  document.getElementById("nextBtn").style.display = "none";
}

function playTry(n) {
  if (n !== tries + 1) return alert("Vous devez écouter les extraits dans l'ordre.");
  tries = n;
  document.getElementById("guessInput").disabled = false;
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

  if (tries === 1) {
    document.getElementById("playTry1").disabled = true;
    document.getElementById("playTry2").disabled = false;
    document.getElementById("playTry3").disabled = true;
  } else if (tries === 2) {
    document.getElementById("playTry1").disabled = true;
    document.getElementById("playTry2").disabled = true;
    document.getElementById("playTry3").disabled = false;
  } else if (tries === 3) {
    document.getElementById("playTry1").disabled = true;
    document.getElementById("playTry2").disabled = true;
    document.getElementById("playTry3").disabled = true;
  }
}

function checkAnswer(selectedTitle) {
  const inputVal = selectedTitle.toLowerCase();
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
      document.getElementById("guessInput").disabled = true;
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
  document.getElementById("guessInput").disabled = true;
  document.getElementById("playTry1").disabled = true;
  document.getElementById("playTry2").disabled = true;
  document.getElementById("playTry3").disabled = true;
}

function showNextButton() {
  document.getElementById("nextBtn").style.display = "inline-block";
}

function nextAnime() {
  // Arrête la vidéo si elle est en cours
  if(player && player.stopVideo) {
    player.stopVideo();
  }
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

const input = document.getElementById("guessInput");
input.addEventListener("input", function() {
  closeAllLists();
  if (!this.value) return false;
  const val = this.value.toLowerCase();
  const list = document.getElementById("autocomplete-list");
  const uniqueTitles = [...new Set(animeList.map(a => a.title))];
  uniqueTitles.forEach(title => {
    if (title.toLowerCase().startsWith(val)) {
      const item = document.createElement("div");
      item.innerHTML = "<strong>" + title.substr(0, val.length) + "</strong>" + title.substr(val.length);
      item.addEventListener("click", function() {
        input.value = title;
        closeAllLists();
        checkAnswer(title);
      });
      list.appendChild(item);
    }
  });
});
function closeAllLists() {
  const list = document.getElementById("autocomplete-list");
  while (list.firstChild) list.removeChild(list.firstChild);
}
document.addEventListener("click", (e) => {
  if (e.target !== input) closeAllLists();
});
