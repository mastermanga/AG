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

// === Mode selection buttons ===
let rankingMode = 'anime'; // 'anime' or 'opening'
const modeAnimeBtn = document.getElementById('mode-anime');
const modeOpeningBtn = document.getElementById('mode-opening');

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

// === Blind Ranking Variables ===
let animeList = [];
let currentIndex = 0;
let rankings = new Array(10).fill(null);
let selectedAnimes = [];

// ==== Double YouTube Player ====
let ytPlayers = [null, null];
let ytReady = [false, false];
let usingPlayerIndex = 0; // 0 ou 1

// Appelle l’API YouTube pour créer les deux players une fois qu'elle est prête
window.onYouTubeIframeAPIReady = function () {
  ytPlayers[0] = new YT.Player('yt-player-1', {
    height: '225',
    width: '100%',
    playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
    events: {
      'onReady': () => { ytReady[0] = true; },
    }
  });
  ytPlayers[1] = new YT.Player('yt-player-2', {
    height: '225',
    width: '100%',
    playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
    events: {
      'onReady': () => { ytReady[1] = true; },
    }
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
    // Masquer tous les players au début
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
      nextBtn.textContent = "Rejouer";
      // Arrête tout son de YouTube à la fin
      ytPlayers.forEach(p => p && p.stopVideo && p.stopVideo());
      document.getElementById('player-loader').style.display = "none";
    }
  }, 120);
}

async function showCurrentOpeningPlayer() {
  // Ne fait rien si YouTube API pas prête ou pas d’URL
  if (!selectedAnimes[currentIndex] || !selectedAnimes[currentIndex].youtubeUrls?.[0]) return;

  const currentVideoId = getYouTubeVideoId(selectedAnimes[currentIndex].youtubeUrls[0]);
  const nextVideoId = (selectedAnimes[currentIndex + 1] && selectedAnimes[currentIndex + 1].youtubeUrls?.[0])
    ? getYouTubeVideoId(selectedAnimes[currentIndex + 1].youtubeUrls[0])
    : null;

  // 1. Affiche loader si le player n'est pas prêt
  document.getElementById('player-loader').style.display = "flex";

  // 2. On attend que les players soient prêts
  await waitForPlayerReady(usingPlayerIndex);
  
  // 3. Charge la vidéo du currentIndex dans le bon player et affiche-le
  let mainPlayer = ytPlayers[usingPlayerIndex];
  if (mainPlayer && mainPlayer.loadVideoById) {
    mainPlayer.loadVideoById({ videoId: currentVideoId });
    document.getElementById(`yt-player-${usingPlayerIndex + 1}`).style.display = "block";
  }

  // 4. Cache l'autre player (pour éviter écho)
  document.getElementById(`yt-player-${((usingPlayerIndex + 1) % 2) + 1}`).style.display = "none";

  // 5. Précharge la vidéo suivante dans le second player (si existe)
  if (nextVideoId && ytPlayers[(usingPlayerIndex + 1) % 2] && ytPlayers[(usingPlayerIndex + 1) % 2].cueVideoById) {
    await waitForPlayerReady((usingPlayerIndex + 1) % 2);
    ytPlayers[(usingPlayerIndex + 1) % 2].cueVideoById({ videoId: nextVideoId });
  }

  document.getElementById('player-loader').style.display = "none";
}

// Attend que le player [i] soit prêt
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

  // On swap le player pour que le préchargé devienne l’actif
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

// ==== BOUTON REJOUER ====
document.getElementById("next-btn").onclick = startNewRanking;

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
  // Précharge les deux players (utile sur reset)
  displayCurrentItem();
}

// === INIT ON LOAD ===
window.onload = async function () {
  await startNewRanking();
};
