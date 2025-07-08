// === Navigation & thème ===
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

// === Mode PARCOURS (lecture URL) ===
const urlParams = new URLSearchParams(window.location.search);
const isParcours = urlParams.get("parcours") === "1";
const parcoursCount = parseInt(urlParams.get("count") || "1", 10);
let parcoursStepIdx = 0;
let parcoursScores = [];
let rankingMode = urlParams.get("mode") || 'anime'; // par défaut anime

const modeAnimeBtn = document.getElementById('mode-anime');
const modeOpeningBtn = document.getElementById('mode-opening');

// Si parcours, cacher sélecteur de mode et fixer le mode :
if (isParcours) {
  document.getElementById("mode-select").style.display = "none";
  modeAnimeBtn.classList.toggle('active', rankingMode === 'anime');
  modeOpeningBtn.classList.toggle('active', rankingMode === 'opening');
} else {
  modeAnimeBtn.onclick = () => {
    if (rankingMode !== 'anime') {
      rankingMode = 'anime';
      modeAnimeBtn.classList.add('active');
      modeAnimeBtn.setAttribute('aria-pressed', 'true');
      modeOpeningBtn.classList.remove('active');
      modeOpeningBtn.setAttribute('aria-pressed', 'false');
      startNewRanking();
    }
  };
  modeOpeningBtn.onclick = () => {
    if (rankingMode !== 'opening') {
      rankingMode = 'opening';
      modeOpeningBtn.classList.add('active');
      modeOpeningBtn.setAttribute('aria-pressed', 'true');
      modeAnimeBtn.classList.remove('active');
      modeAnimeBtn.setAttribute('aria-pressed', 'false');
      startNewRanking();
    }
  };
}

// === Blind Ranking Variables ===
let animeList = [];
let currentIndex = 0;
let rankings = new Array(10).fill(null);
let selectedAnimes = [];
let gamesPlayed = 0;

// ==== Double YouTube Player ====
let ytPlayers = [null, null];
let ytReady = [false, false];
let usingPlayerIndex = 0; // 0 ou 1

window.onYouTubeIframeAPIReady = function () {
  ytPlayers[0] = new YT.Player('yt-player-1', {
    height: '225',
    width: '100%',
    playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
    events: { 'onReady': () => { ytReady[0] = true; } }
  });
  ytPlayers[1] = new YT.Player('yt-player-2', {
    height: '225',
    width: '100%',
    playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
    events: { 'onReady': () => { ytReady[1] = true; } }
  });
};

// ==== DATA ====
async function loadRankingData() {
  try {
    const file = rankingMode === 'anime' ? '../data/animes.json' : '../data/openings.json';
    const response = await fetch(file);
    if (!response.ok) throw new Error('Fichier introuvable');
    animeList = await response.json();
  } catch (error) {
    alert("Erreur lors du chargement du fichier JSON : " + error.message);
    animeList = [];
  }
}

function getRandomItems() {
  selectedAnimes = [];
  const used = new Set();
  while (selectedAnimes.length < 10 && animeList.length > 0) {
    const randomIndex = Math.floor(Math.random() * animeList.length);
    if (!used.has(randomIndex)) {
      selectedAnimes.push(animeList[randomIndex]);
      used.add(randomIndex);
    }
  }
}

function getYouTubeVideoId(youtubeUrl) {
  let videoId = null;
  try {
    const urlObj = new URL(youtubeUrl);
    if(urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    } else if(urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
  } catch {}
  return videoId;
}
function getYouTubeEmbedUrl(youtubeUrl) {
  const videoId = getYouTubeVideoId(youtubeUrl);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0` : "";
}

// ==== AFFICHAGE ====
function displayCurrentItem() {
  setTimeout(async () => {
    const animeImg = document.getElementById("anime-img");
    const container = document.getElementById("anime-item");
    const nextBtn = document.getElementById("next-btn");
    document.getElementById('yt-player-1').style.display = "none";
    document.getElementById('yt-player-2').style.display = "none";
    document.getElementById('player-loader').style.display = "none";

    if (currentIndex < selectedAnimes.length) {
      const item = selectedAnimes[currentIndex];
      document.getElementById("anime-name").textContent = item.title;
      if (rankingMode === "anime") {
        animeImg.src = item.image;
        animeImg.style.display = "block";
      } else {
        animeImg.style.display = "none";
        await showCurrentOpeningPlayer();
      }
      container.style.display = "flex";
      document.getElementById("rank-section").style.display = "block";
      nextBtn.style.display = "none";
    } else {
      document.getElementById("rank-section").style.display = "none";
      container.style.display = "none";
      nextBtn.style.display = "block";
      // Arrête tout son de YouTube à la fin
      ytPlayers.forEach(p => p && p.stopVideo && p.stopVideo());
      document.getElementById('player-loader').style.display = "none";
      finishGame(); // On gère le bouton ici (parcours/rejouer)
    }
  }, 120);
}

async function showCurrentOpeningPlayer() {
  if (!selectedAnimes[currentIndex] || !selectedAnimes[currentIndex].youtubeUrls?.[0]) return;
  const currentVideoId = getYouTubeVideoId(selectedAnimes[currentIndex].youtubeUrls[0]);
  const nextVideoId = (selectedAnimes[currentIndex + 1] && selectedAnimes[currentIndex + 1].youtubeUrls?.[0])
    ? getYouTubeVideoId(selectedAnimes[currentIndex + 1].youtubeUrls[0])
    : null;
  document.getElementById('player-loader').style.display = "flex";
  await waitForPlayerReady(usingPlayerIndex);
  let mainPlayer = ytPlayers[usingPlayerIndex];
  if (mainPlayer && mainPlayer.loadVideoById) {
    mainPlayer.loadVideoById({ videoId: currentVideoId });
    document.getElementById(`yt-player-${usingPlayerIndex + 1}`).style.display = "block";
  }
  document.getElementById(`yt-player-${((usingPlayerIndex + 1) % 2) + 1}`).style.display = "none";
  if (nextVideoId && ytPlayers[(usingPlayerIndex + 1) % 2] && ytPlayers[(usingPlayerIndex + 1) % 2].cueVideoById) {
    await waitForPlayerReady((usingPlayerIndex + 1) % 2);
    ytPlayers[(usingPlayerIndex + 1) % 2].cueVideoById({ videoId: nextVideoId });
  }
  document.getElementById('player-loader').style.display = "none";
}

function waitForPlayerReady(i) {
  return new Promise(res => {
    if (ytReady[i]) return res();
    const check = setInterval(() => {
      if (ytReady[i]) {
        clearInterval(check);
        res();
      }
    }, 50);
  });
}

// ==== ASSIGNATION RANG ====
function assignRank(rank) {
  if (rankings[rank - 1] !== null) {
    alert("Ce rang a déjà été attribué !");
    return;
  }
  rankings[rank - 1] = selectedAnimes[currentIndex].title;
  document.getElementById(`rank-${rank}`).disabled = true;
  updateRankingList();
  currentIndex++;
  if (rankingMode === "opening") {
    usingPlayerIndex = (usingPlayerIndex + 1) % 2;
  }
  displayCurrentItem();
}

function updateRankingList() {
  const rankingList = document.getElementById("ranking-list");
  rankingList.innerHTML = '';
  let rows = [[], []];
  for (let i = 0; i < 10; i++) {
    let html = "";
    if (rankings[i]) {
      const item = selectedAnimes.find(a => a.title === rankings[i]);
      if (item) {
        if (rankingMode === 'anime') {
          html = `
            <li>
              <img src="${item.image}" alt="${item.title}">
              <span>Rang ${i + 1}: ${item.title}</span>
            </li>
          `;
        } else {
          html = `
            <li>
              <iframe src="${getYouTubeEmbedUrl(item.youtubeUrls?.[0] || "")}" frameborder="0" allowfullscreen style="border-radius:10px;width:100%;height:210px;background:#222;box-shadow:0 2px 12px #1114;"></iframe>
              <span>Rang ${i + 1}: ${item.title}</span>
            </li>
          `;
        }
      } else {
        html = `<li><span>Rang ${i + 1}: </span></li>`;
      }
    } else {
      html = `
        <li>
          <div style="width:100%;height:210px;opacity:0.1;background:#ccc;display:inline-block;border-radius:10px"></div>
          <span>Rang ${i + 1}</span>
        </li>
      `;
    }
    rows[Math.floor(i / 5)].push(html);
  }
  rankingList.innerHTML = rows[0].join('') + rows[1].join('');
}

// ==== BOUTON REJOUER / SUIVANT (PARCOURS) ====
// on ne met pas de .onclick ici mais dans finishGame()

async function startNewRanking() {
  await loadRankingData();
  getRandomItems();
  currentIndex = 0;
  rankings = new Array(10).fill(null);
  usingPlayerIndex = 0;
  for (let i = 1; i <= 10; i++) {
    document.getElementById(`rank-${i}`).disabled = false;
  }
  updateRankingList();
  document.getElementById("anime-item").style.display = "flex";
  document.getElementById("rank-section").style.display = "block";
  document.getElementById("next-btn").style.display = "none";
  document.getElementById("anime-name").textContent = "Nom de l'Anime ou de l'Opening";
  document.getElementById("anime-img").src = "";
  displayCurrentItem();
}

// ==== FIN DE PARTIE ET ENCHAÎNEMENT PARCOURS ====
// appelé automatiquement à la fin d'une partie
function finishGame() {
  const nextBtn = document.getElementById("next-btn");
  // Score simple = nb de rangs exacts trouvés
  let score = 0;
  for (let i = 0; i < 10; i++) {
    const trueTitle = selectedAnimes[i]?.title;
    if (rankings[i] === trueTitle) score++;
  }
  // Mode parcours
  if (isParcours) {
    nextBtn.textContent = (gamesPlayed < parcoursCount - 1) ? "Suivant" : "Terminer";
    nextBtn.onclick = function () {
      parcoursScores.push({
        label: "Blind Ranking " + (rankingMode === "anime" ? "Anime" : "Opening"),
        score: score,
        total: 10
      });
      gamesPlayed++;
      if (gamesPlayed < parcoursCount) {
        startNewRanking();
      } else {
        // Envoyer tous les scores au parent
        // (Ici on ne peut en renvoyer qu'un, donc tu peux custom si besoin)
        // On envoie chaque score séparément :
        parcoursScores.forEach(s => parent.postMessage({ parcoursScore: s }, "*"));
      }
    }
  } else {
    nextBtn.textContent = "Rejouer";
    nextBtn.onclick = function () {
      startNewRanking();
    };
  }
}

// === INIT ON LOAD ===
window.onload = async function () {
  gamesPlayed = 0;
  parcoursScores = [];
  await startNewRanking();
};
