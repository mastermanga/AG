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

// Charge le score daily pour un jeu donné
function getDailyScoreFor(gameKey) {
  const today = getTodayString();
  // Même format que dans Anidle
  const value = localStorage.getItem(`dailyScore_${gameKey}_${today}`);
  if (!value) return null;
  // Accepte chaîne ou nombre
  if (!isNaN(Number(value))) return Number(value);
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "number") return parsed;
    if (typeof parsed === "object" && typeof parsed.score === "number") return parsed.score;
  } catch {}
  return null;
}

// Affiche le récap du daily sur la page d’accueil
function loadDailyRecap() {
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
