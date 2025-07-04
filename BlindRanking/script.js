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

// === Jeu Blind Ranking ===
let animeList = [];
let currentIndex = 0;
let rankings = new Array(10).fill(null);
let selectedAnimes = [];

// Chargement dynamique selon le mode
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

// Choix aléatoire de 10 items non doublonnés
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

// Convertit une URL YT en embed pour iframe
function getYouTubeEmbedUrl(youtubeUrl) {
  let videoId = null;
  try {
    const urlObj = new URL(youtubeUrl);
    if(urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    } else if(urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
  } catch {}
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0` : "";
}

// Affichage principal de l’item en cours
function displayCurrentItem() {
  setTimeout(() => {
    const animeImg = document.getElementById("anime-img");
    const container = document.getElementById("anime-item");
    document.getElementById("anime-video")?.remove();

    if (currentIndex < selectedAnimes.length) {
      const item = selectedAnimes[currentIndex];
      document.getElementById("anime-name").textContent = item.title;
      if (rankingMode === "anime") {
        animeImg.src = item.image;
        animeImg.style.display = "block";
      } else {
        animeImg.style.display = "none";
        let iframe = document.createElement("iframe");
        iframe.id = "anime-video";
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "");
        iframe.style.borderRadius = "15px";
        iframe.style.width = "100%";
        iframe.style.maxWidth = "440px";
        iframe.style.height = "440px";
        iframe.style.background = "#222";
        iframe.style.boxShadow = "0 4px 18px #1116";
        iframe.src = getYouTubeEmbedUrl(item.youtubeUrls?.[0] || "");
        container.insertBefore(iframe, animeImg);
      }
      container.style.display = "flex";
      document.getElementById("rank-section").style.display = "block";
      document.getElementById("new-ranking-btn").style.display = "none";
    } else {
      document.getElementById("rank-section").style.display = "none";
      container.style.display = "none";
      document.getElementById("new-ranking-btn").style.display = "block";
    }
  }, 120);
}

// Attribuer le rang, avancer, MAJ UI
function assignRank(rank) {
  if (rankings[rank - 1] !== null) {
    alert("Ce rang a déjà été attribué !");
    return;
  }
  rankings[rank - 1] = selectedAnimes[currentIndex].title;
  document.getElementById(`rank-${rank}`).disabled = true;
  updateRankingList();
  currentIndex++;
  displayCurrentItem();
}

// Mise à jour de la grille des classements
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

// Démarre ou redémarre une partie
async function startNewRanking() {
  await loadRankingData();
  getRandomItems();
  currentIndex = 0;
  rankings = new Array(10).fill(null);
  // Active tous les boutons rang
  for (let i = 1; i <= 10; i++) {
    document.getElementById(`rank-${i}`).disabled = false;
  }
  updateRankingList();
  // Reset zone item courant
  document.getElementById("anime-item").style.display = "flex";
  document.getElementById("rank-section").style.display = "block";
  document.getElementById("new-ranking-btn").style.display = "none";
  document.getElementById("anime-name").textContent = "Nom de l'Anime ou de l'Opening";
  document.getElementById("anime-img").src = "";
  displayCurrentItem();
}

// Init on load
window.onload = async function () {
  await startNewRanking();
};
