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
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
});

// ========== ANIMEDLE GAME ==========
let animeData = [];
let targetAnime = null;
let attemptCount = 0;
let gameOver = false;
let indiceStep = 0;

// Chargement des données
fetch('../data/animes.json')
  .then(response => response.json())
  .then(data => {
    animeData = data;
    targetAnime = animeData[Math.floor(Math.random() * animeData.length)];
    // console.log("Réponse secrète:", targetAnime); // DEBUG
  });

// Suggestions auto-complete
document.getElementById("animeInput").addEventListener("input", function() {
  const input = this.value.toLowerCase();
  const matches = animeData.filter(a => a.title.toLowerCase().includes(input)).slice(0, 5);
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = "";
  matches.forEach(anime => {
    const div = document.createElement("div");
    div.textContent = anime.title;
    div.onclick = () => {
      document.getElementById("animeInput").value = anime.title;
      suggestions.innerHTML = "";
      guessAnime();
    };
    suggestions.appendChild(div);
  });
});

// Indices progressifs
document.getElementById("indiceBtn").addEventListener("click", () => {
  if (!targetAnime) return;
  indiceStep++;
  if (indiceStep > 5) indiceStep = 5;
  document.getElementById("indicesContainer").style.display = "block";
  if (indiceStep >= 1) document.getElementById("indice1").textContent = targetAnime.genres[0] || "N/A";
  if (indiceStep >= 2) document.getElementById("indice2").textContent = targetAnime.studio || "N/A";
  if (indiceStep >= 3) document.getElementById("indice3").textContent = targetAnime.season || "N/A";
  if (indiceStep >= 4) document.getElementById("indice4").textContent = targetAnime.title.charAt(0) || "N/A";
  if (indiceStep >= 5) {
    const img = document.getElementById("indice5");
    img.src = targetAnime.image;
    img.style.filter = "blur(8px)";
  }
});

// Fonction principale de jeu
function guessAnime() {
  if (gameOver) return;
  const input = document.getElementById("animeInput").value.trim();
  const guessedAnime = animeData.find(a => a.title.toLowerCase() === input.toLowerCase());
  if (!guessedAnime) {
    alert("Anime non trouvé !");
    return;
  }

  attemptCount++;
  document.getElementById("counter").textContent = "Tentatives : " + attemptCount;
  updateAideList();

  const results = document.getElementById("results");

  const keyToClass = {
    image: "cell-image",
    title: "cell-title",
    season: "cell-season",
    studio: "cell-studio",
    genresThemes: "cell-genre",
    score: "cell-score"
  };

  // Afficher le header au premier essai
  if (attemptCount === 1) {
    const header = document.createElement("div");
    header.classList.add("row");
    ["Image", "Titre", "Saison", "Studio", "Genres / Thèmes", "Score"].forEach((label, i) => {
      const cell = document.createElement("div");
      cell.classList.add("cell", Object.values(keyToClass)[i]);
      cell.style.fontWeight = "bold";
      cell.textContent = label;
      header.appendChild(cell);
    });
    results.insertBefore(header, results.firstChild);
  }

  const row = document.createElement("div");
  row.classList.add("row");

  // Image
  const cellImage = document.createElement("div");
  cellImage.classList.add("cell", keyToClass.image);
  const img = document.createElement("img");
  img.src = guessedAnime.image;
  img.alt = guessedAnime.title;
  img.style.width = "100px";
  cellImage.appendChild(img);
  row.appendChild(cellImage);

  // Titre
  const cellTitle = document.createElement("div");
  cellTitle.classList.add("cell", keyToClass.title);
  const isTitleMatch = guessedAnime.title === targetAnime.title;
  cellTitle.classList.add(isTitleMatch ? "green" : "red");
  cellTitle.textContent = guessedAnime.title;
  row.appendChild(cellTitle);

  // Saison
  const cellSeason = document.createElement("div");
  cellSeason.classList.add("cell", keyToClass.season);
  const [gs, gy] = guessedAnime.season.split(" ");
  const [ts, ty] = targetAnime.season.split(" ");
  if (gs === ts && gy === ty) {
    cellSeason.classList.add("green");
    cellSeason.textContent = `✅ ${guessedAnime.season}`;
  } else if (gy === ty) {
    cellSeason.classList.add("orange");
    cellSeason.textContent = `🟧 ${guessedAnime.season}`;
  } else {
    cellSeason.classList.add("red");
    cellSeason.textContent = parseInt(gy) < parseInt(ty)
      ? `🔼 ${guessedAnime.season}`
      : `${guessedAnime.season} 🔽`;
  }
  row.appendChild(cellSeason);

  // Studio
  const cellStudio = document.createElement("div");
  cellStudio.classList.add("cell", keyToClass.studio);
  const isStudioMatch = guessedAnime.studio === targetAnime.studio;
  cellStudio.classList.add(isStudioMatch ? "green" : "red");
  cellStudio.textContent = guessedAnime.studio;
  row.appendChild(cellStudio);

  // Genres / Thèmes
  const cellGenresThemes = document.createElement("div");
  cellGenresThemes.classList.add("cell", keyToClass.genresThemes);
  const allGuessed = [...guessedAnime.genres, ...guessedAnime.themes];
  const allTarget = [...targetAnime.genres, ...targetAnime.themes];
  const matches = allGuessed.filter(x => allTarget.includes(x));
  if (matches.length === allGuessed.length && matches.length === allTarget.length) {
    cellGenresThemes.classList.add("green");
  } else if (matches.length > 0) {
    cellGenresThemes.classList.add("orange");
  } else {
    cellGenresThemes.classList.add("red");
  }
  cellGenresThemes.innerHTML = allGuessed.join("<br>");
  row.appendChild(cellGenresThemes);

  // Score
  const cellScore = document.createElement("div");
  cellScore.classList.add("cell", keyToClass.score);
  const g = parseFloat(guessedAnime.score);
  const t = parseFloat(targetAnime.score);
  if (g === t) {
    cellScore.classList.add("green");
    cellScore.textContent = `✅ ${g}`;
  } else {
    cellScore.classList.add("red");
    cellScore.textContent = g < t ? `🔼 ${g}` : `${g} 🔽`;
  }
  row.appendChild(cellScore);

  // Affiche la ligne sous le header
  const header = results.querySelector(".row");
  results.insertBefore(row, header.nextSibling);

  document.getElementById("animeInput").value = "";
  document.getElementById("suggestions").innerHTML = "";

  // Fin du jeu
  if (isTitleMatch) {
    gameOver = true;
    document.getElementById("animeInput").disabled = true;
    document.getElementById("indiceBtn").disabled = true;
    const message = document.createElement("div");
    message.id = "winMessage";
    message.innerHTML = `🎆 <span style="font-size:2rem;">🥳</span> Bravo ! C'était <u>${targetAnime.title}</u> en ${attemptCount} tentative${attemptCount > 1 ? 's' : ''}. <span style="font-size:2rem;">🎉</span>`;
    results.appendChild(message);
    launchFireworks();
  }
}

// Suggestions "Aide" dynamiques
function updateAideList() {
  const aideDiv = document.getElementById("aideContainer");
  if (attemptCount < 5) {
    aideDiv.innerHTML = "";
    return;
  }

  let filtered = animeData;
  const [season, yearStr] = targetAnime.season.split(" ");
  const targetYear = parseInt(yearStr);

  if (attemptCount >= 25) {
    filtered = filtered.filter(a => a.season === targetAnime.season);
  } else if (attemptCount >= 20) {
    filtered = filtered.filter(a => parseInt(a.season.split(" ")[1]) === targetYear);
  } else if (attemptCount >= 15) {
    filtered = filtered.filter(a => Math.abs(parseInt(a.season.split(" ")[1]) - targetYear) <= 2);
  } else if (attemptCount >= 10) {
    filtered = filtered.filter(a => Math.abs(parseInt(a.season.split(" ")[1]) - targetYear) <= 5);
  }

  aideDiv.innerHTML = `<h3>🔍 Suggestions</h3><ul>` +
    filtered.map(a => `<li onclick="selectFromAide('${a.title.replace(/'/g, "\\'")}')">${a.title}</li>`).join("") +
    `</ul>`;
}

// Sélection aide (pour clic suggestion)
function selectFromAide(title) {
  document.getElementById("animeInput").value = title;
  guessAnime();
}

// Reset du jeu
document.getElementById("resetBtn").addEventListener("click", resetGame);
function resetGame() {
  location.reload();
}

// Fireworks confetti
function launchFireworks() {
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];

  function createParticle(x, y) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = Math.random() * 5 + 2;
    return { x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 60 };
  }

  for (let i = 0; i < 100; i++) {
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
