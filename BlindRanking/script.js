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
    const response = await fetch('anime_v2.json');
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
    } else {
      document.getElementById("rank-section").style.display = "none";
      document.getElementById("anime-item").style.display = "none";
      document.getElementById("new-ranking-btn").style.display = "block";
      document.body.classList.add("final-view");
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

  rankings.forEach((animeTitle, index) => {
    if (animeTitle) {
      const anime = selectedAnimes.find(a => a.title === animeTitle);
      rankingList.innerHTML += `
        <li>
          <img src="${anime.image}" alt="${anime.title}">
          <span>Rang ${index + 1}: ${anime.title}</span>
        </li>`;
    }
  });
}

function startNewRanking() {
  getRandomAnimes();
  currentIndex = 0;
  rankings = new Array(10).fill(null);
  document.body.classList.remove("final-view");

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
  document.getElementById("menu-screen").style.display = "none";

  const allGames = ['ranking-game']; // ajouter plus tard d'autres IDs ici
  allGames.forEach(id => {
    const section = document.getElementById(id);
    if (section) section.style.display = "none";
  });

  const selectedGame = document.getElementById(gameId);
  if (selectedGame) selectedGame.style.display = "flex";

  if (gameId === 'ranking-game') {
    document.querySelector(".ranking-container").style.display = "block"; // Afficher le récapitulatif
    document.getElementById("anime-container").style.display = "flex";
    startNewRanking();
  } else {
    document.querySelector(".ranking-container").style.display = "none"; // Masquer pour autres jeux
  }
}

function backToMenu() {
  document.getElementById("ranking-game").style.display = "none";
  document.getElementById("menu-screen").style.display = "flex";
  document.querySelector(".ranking-container").style.display = "none"; // Masquer le récapitulatif
  document.body.classList.remove("final-view"); // Réinitialiser la vue finale
}

window.onload = async function () {
  await loadAnimes();
};
