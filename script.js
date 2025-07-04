// ========== THEME (DARK/LIGHT) ==========
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
  loadDailyRecap();
});

// ========== DAILY RECAP SYSTEM ==========

// Helper pour obtenir la date du jour sous forme 'YYYY-MM-DD'
function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Charge le score daily pour un jeu donné (clé commune à tous les jeux)
function getDailyScoreFor(gameKey) {
  const today = getTodayString();
  // Accepté : dailyScore_anidle_YYYY-MM-DD, dailyScore_openingquizz_YYYY-MM-DD, etc.
  try {
    const saved = localStorage.getItem(`dailyScore_${gameKey}_${today}`);
    if (!saved) return null;
    const value = JSON.parse(saved);
    if (typeof value === "number") return value;
    if (typeof value === "object" && typeof value.score === "number") return value.score;
    return null;
  } catch {
    return null;
  }
}

// Affiche le récap du daily sur la page d’accueil
function loadDailyRecap() {
  // Les clés utilisées devront être les mêmes dans chaque jeu pour la sauvegarde :
  //   dailyScore_anidle_YYYY-MM-DD, dailyScore_openingquizz_YYYY-MM-DD, dailyScore_characterquizz_YYYY-MM-DD
  const recapFields = [
    { key: "anidle", label: "Anidle", el: document.getElementById("recap-anidle") },
    { key: "openingquizz", label: "OpeningQuizz", el: document.getElementById("recap-openingquizz") },
    { key: "characterquizz", label: "CharacterQuizz", el: document.getElementById("recap-characterquizz") }
  ];

  let total = 0;
  let playedAny = false;

  recapFields.forEach(field => {
    const score = getDailyScoreFor(field.key);
    if (score != null) {
      field.el.textContent = score + " pts";
      total += score;
      playedAny = true;
    } else {
      field.el.textContent = "Non joué";
    }
  });

  // Total
  const recapTotal = document.getElementById("recap-total");
  recapTotal.textContent = playedAny ? (total + " pts") : "Aucun jeu fait aujourd’hui";
}
