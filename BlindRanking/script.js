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

let animeList = [];
let currentIndex = 0;
let rankings = new Array(10).fill(null);
let selectedAnimes = [];

async function loadAnimes() {
  try {
    const response = await fetch('../data/animes.json');
    if (!response.ok) throw new Error('Fichier introuvable');
    animeList = await response.json();
  } catch (error) {
    alert("Erreur lors du chargement du fichier JSON : " + error.message);
  }
}

function getRandomAnimes() {
  selectedAnimes = [];
  while (selectedAnimes.length < 10) {
    const randomIndex = Math.floor(Math.random() * animeList.length);
    const anime = animeList[randomIndex];
    if (!selectedAnimes.includes(anime)) {
      selectedAnimes.push(anime);
    }
  }
}

function displayAnime() {
  setTimeout(() => {
    if (currentIndex < selectedAnimes.length) {
      const anime = selectedAnimes[currentIndex];
      document.getElementById("anime-name").textContent = anime.title;
      document.getElementById("anime-img").src = anime.image;
      document.getElementById("anime-item").style.display = "flex";
      document.getElementById("rank-section").style.display = "block";
      document.getElementById("new-ranking-btn").style.display = "none";
    } else {
      document.getElementById("rank-section").style.display = "none";
      document.getElementById("anime-item").style.display = "none";
      document.getElementById("new-ranking-btn").style.display = "block";
    }
  }, 150); // délai léger pour plus de fluidité
}

function assignRank(rank) {
  if (rankings[rank - 1] !== null) {
    alert("Ce rang a déjà été attribué !");
    return;
  }
  rankings[rank - 1] = selectedAnimes[currentIndex].title;
  document.getElementById(`rank-${rank}`).disabled = true;
  updateRankingList();
  currentIndex++;
  displayAnime();
}

function updateRankingList() {
  const rankingList = document.getElementById("ranking-list");
  rankingList.innerHTML = '';

  // Générer deux lignes de 5
  let rows = [[], []];
  for (let i = 0; i < 10; i++) {
    if (rankings[i]) {
      const anime = selectedAnimes.find(a => a.title === rankings[i]);
      if (anime) {
        rows[Math.floor(i / 5)].push(`
          <li>
            <img src="${anime.image}" alt="${anime.title}">
            <span>Rang ${i + 1}: ${anime.title}</span>
          </li>
        `);
      } else {
        rows[Math.floor(i / 5)].push(`<li><span>Rang ${i + 1}: </span></li>`);
      }
    } else {
      // Case vide
      rows[Math.floor(i / 5)].push(`
        <li>
          <div style="width:100px;height:100px;opacity:0.1;background:#ccc;display:inline-block;border-radius:10px"></div>
          <span>Rang ${i + 1}</span>
        </li>
      `);
    }
  }
  // Affichage dans une seule grille avec grid CSS (le CSS s'occupe du layout)
  rankingList.innerHTML = rows[0].join('') + rows[1].join('');
}

function startNewRanking() {
  getRandomAnimes();
  currentIndex = 0;
  rankings = new Array(10).fill(null);

  for (let i = 1; i <= 10; i++) {
    document.getElementById(`rank-${i}`).disabled = false;
  }

  updateRankingList();
  document.getElementById("anime-item").style.display = "flex";
  document.getElementById("rank-section").style.display = "block";
  document.getElementById("new-ranking-btn").style.display = "none";
  document.getElementById("anime-name").textContent = "Nom de l'Anime";
  document.getElementById("anime-img").src = "";

  displayAnime();
}

function launchGame(gameId) {
  document.getElementById("menu-screen") && (document.getElementById("menu-screen").style.display = "none");

  const allGames = ['ranking-game']; // ajouter plus tard d'autres IDs ici
  allGames.forEach(id => {
    const section = document.getElementById(id);
    if (section) section.style.display = "none";
  });

  const selectedGame = document.getElementById(gameId);
  if (selectedGame) selectedGame.style.display = "flex";

  if (gameId === 'ranking-game') {
    document.querySelector(".ranking-container").style.display = "block";
    document.getElementById("anime-container").style.display = "flex";
    startNewRanking();
  } else {
    document.querySelector(".ranking-container").style.display = "none";
  }
}

function backToMenu() {
  document.getElementById("ranking-game").style.display = "none";
  document.getElementById("menu-screen") && (document.getElementById("menu-screen").style.display = "flex");
}

// ======== ON LOAD ========
window.onload = async function () {
  await loadAnimes();
  if (animeList.length > 0) startNewRanking();
};

