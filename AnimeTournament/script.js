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

(() => {
  const TOTAL_ITEMS = 16;
  const QUALIFIED_TO_BRACKET = 8;
  const SWISS_ROUNDS = 5; // 5 duels fixes

  let mode = 'anime';
  let data = [];
  let items = [];

  // Round suisse data
  let swissStats = []; // {wins, losses, playedOpponents: Set, opponents: Array}
  let swissMatches = [];
  let swissRound = 0;

  // Bracket data
  let bracketMatches = [];
  let bracketRound = 0;
  let bracketMatchIndex = 0;

  // UI Elements
  const duelContainer = document.querySelector('#duel-container');
  const classementDiv = document.querySelector('#classement');
  const modeAnimeBtn = document.getElementById('mode-anime');
  const modeOpeningBtn = document.getElementById('mode-opening');

  modeAnimeBtn.onclick = () => switchMode('anime');
  modeOpeningBtn.onclick = () => switchMode('opening');

  function switchMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    modeAnimeBtn.classList.toggle('active', mode === 'anime');
    modeAnimeBtn.setAttribute('aria-pressed', mode === 'anime');
    modeOpeningBtn.classList.toggle('active', mode === 'opening');
    modeOpeningBtn.setAttribute('aria-pressed', mode === 'opening');
    reset();
    loadDataAndStart();
  }

  function reset() {
    data = [];
    items = [];
    swissStats = [];
    swissMatches = [];
    bracketMatches = [];
    bracketRound = 0;
    bracketMatchIndex = 0;
    swissRound = 0;
    duelContainer.innerHTML = '';
    duelContainer.style.display = '';
    classementDiv.innerHTML = '';
    document.querySelectorAll('body > .rank').forEach(e => e.remove());
  }

  function shuffle(array) {
    for(let i = array.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async function loadDataAndStart() {
    const url = mode === 'anime' ? '../data/animes.json' : '../data/openings.json';
    try {
      const res = await fetch(url);
      if(!res.ok) throw new Error("Erreur chargement " + url);
      data = await res.json();

      shuffle(data);
      items = data.slice(0, TOTAL_ITEMS);

      // Init swiss stats for each item
      swissStats = items.map(() => ({
        wins: 0,
        losses: 0,
        playedOpponents: new Set(),
        opponents: []
      }));

      swissRound = 0;
      swissMatches = generateSwissRoundMatches();

      setupUI();
      showNextMatch();
    } catch(e) {
      alert(e.message);
    }
  }

  // ----------- SUISSE ALGO 5 RONDES POUR TOUS -----------
  function generateSwissRoundMatches() {
    // Pairing suisse: on groupe par score, puis on essaie de pairer sans doublons
    const indices = Array.from({length: items.length}, (_, i) => i);
    // Trie par score puis random pour éviter pairings automatiques
    indices.sort((a, b) => {
      if (swissStats[b].wins !== swissStats[a].wins) return swissStats[b].wins - swissStats[a].wins;
      return Math.random() - 0.5;
    });

    const matches = [];
    const used = new Set();

    for (let i = 0; i < indices.length; i++) {
      if (used.has(indices[i])) continue;
      // Cherche le 1er dispo qui n'a pas encore été affronté
      let found = false;
      for (let j = i+1; j < indices.length; j++) {
        if (used.has(indices[j])) continue;
        if (!swissStats[indices[i]].playedOpponents.has(indices[j])) {
          matches.push({i1: indices[i], i2: indices[j]});
          used.add(indices[i]);
          used.add(indices[j]);
          found = true;
          break;
        }
      }
      // Si on n'a pas trouvé, pair au hasard
      if (!found) {
        for (let j = i+1; j < indices.length; j++) {
          if (!used.has(indices[j])) {
            matches.push({i1: indices[i], i2: indices[j]});
            used.add(indices[i]);
            used.add(indices[j]);
            break;
          }
        }
      }
    }
    return matches;
  }

  function setupUI() {
    duelContainer.innerHTML = '';
    duelContainer.style.display = 'flex';

    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    if(mode === 'anime'){
      div1.className = 'anime';
      div2.className = 'anime';

      div1.innerHTML = `<img src="" alt="" /><h3></h3>`;
      div2.innerHTML = `<img src="" alt="" /><h3></h3>`;
    } else {
      div1.className = 'opening';
      div2.className = 'opening';

      div1.innerHTML = `<iframe src="" frameborder="0" allowfullscreen></iframe><h3></h3>`;
      div2.innerHTML = `<iframe src="" frameborder="0" allowfullscreen></iframe><h3></h3>`;
    }

    duelContainer.appendChild(div1);
    duelContainer.appendChild(div2);

    div1.onclick = () => recordWin(1);
    div2.onclick = () => recordWin(2);
  }

  function getYouTubeEmbedUrl(youtubeUrl) {
    let videoId = null;
    try {
      const urlObj = new URL(youtubeUrl);
      if(urlObj.hostname.includes('youtube.com')){
        videoId = urlObj.searchParams.get('v');
      } else if(urlObj.hostname.includes('youtu.be')){
        videoId = urlObj.pathname.slice(1);
      }
    } catch {}
    if(videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0`;
    return null;
  }

  function getYouTubeId(youtubeUrl) {
    try {
      const urlObj = new URL(youtubeUrl);
      if(urlObj.hostname.includes('youtube.com'))
        return urlObj.searchParams.get('v');
      if(urlObj.hostname.includes('youtu.be'))
        return urlObj.pathname.replace('/', '');
    } catch {}
    return null;
  }

  function showNextMatch() {
    if (swissMatches.length === 0 && swissRound < SWISS_ROUNDS) {
      swissRound++;
      if (swissRound < SWISS_ROUNDS) {
        swissMatches = generateSwissRoundMatches();
        showNextMatch();
      } else {
        startBracket();
      }
      return;
    }

    if (swissMatches.length > 0) {
      showMatch(swissMatches.shift());
    } else if (bracketRound > 0) {
      showClassement();
    }
  }

  let currentMatch = null;

  function showMatch(match) {
    const i1 = match.i1;
    const i2 = match.i2;
    const divs = duelContainer.children;

    if(mode === 'anime'){
      divs[0].querySelector('img').src = items[i1].image;
      divs[0].querySelector('img').alt = items[i1].title;
      divs[0].querySelector('h3').textContent = items[i1].title;

      divs[1].querySelector('img').src = items[i2].image;
      divs[1].querySelector('img').alt = items[i2].title;
      divs[1].querySelector('h3').textContent = items[i2].title;
    } else {
      const url1 = getYouTubeEmbedUrl(items[i1].youtubeUrls?.[0] || '') || '';
      const url2 = getYouTubeEmbedUrl(items[i2].youtubeUrls?.[0] || '') || '';

      divs[0].querySelector('iframe').src = url1;
      divs[1].querySelector('iframe').src = url2;

      divs[0].querySelector('h3').textContent = items[i1].title;
      divs[1].querySelector('h3').textContent = items[i2].title;
    }
    currentMatch = match;
  }

  function recordWin(winner) {
    if(!currentMatch) return;
    // Phase suisse
    if(bracketRound === 0){
      const winnerIndex = (winner === 1) ? currentMatch.i1 : currentMatch.i2;
      const loserIndex = (winner === 1) ? currentMatch.i2 : currentMatch.i1;

      swissStats[winnerIndex].wins++;
      swissStats[loserIndex].losses++;

      swissStats[winnerIndex].playedOpponents.add(loserIndex);
      swissStats[loserIndex].playedOpponents.add(winnerIndex);
      swissStats[winnerIndex].opponents.push(loserIndex);
      swissStats[loserIndex].opponents.push(winnerIndex);

      showNextMatch();
    } else {
      // Bracket
      const winnerIndex = (winner === 1) ? bracketMatches[bracketMatchIndex].i1 : bracketMatches[bracketMatchIndex].i2;
      bracketMatches[bracketMatchIndex].winner = winnerIndex;
      bracketMatchIndex++;
      if(bracketMatchIndex >= bracketMatches.length){
        setupNextBracketRound();
      } else {
        showBracketMatch(bracketMatches[bracketMatchIndex]);
      }
    }
  }

  function startBracket() {
    // Calcule le Buchholz pour chaque joueur
    for (let i = 0; i < swissStats.length; i++) {
      swissStats[i].buchholz = swissStats[i].opponents.reduce((sum, idx) => sum + swissStats[idx].wins, 0);
    }

    // Trie par victoires, puis buchholz, puis random
    let classement = swissStats.map((s, i) => ({
      index: i,
      wins: s.wins,
      buchholz: s.buchholz
    })).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
      return Math.random() - 0.5;
    });

    let qualified = classement.slice(0, QUALIFIED_TO_BRACKET);

    if(qualified.length < QUALIFIED_TO_BRACKET){
      alert("Pas assez de qualifiés pour le bracket.");
      showClassement();
      return;
    }

    bracketRound = 1;
    bracketMatchIndex = 0;
    bracketMatches = [];

    for(let i=0; i<QUALIFIED_TO_BRACKET/2; i++){
      bracketMatches.push({
        i1: qualified[i].index,
        i2: qualified[QUALIFIED_TO_BRACKET - 1 - i].index,
        winner: null
      });
    }

    alert("Phase bracket 1v1 éliminatoire commencée !");
    duelContainer.style.display = 'flex';
    showBracketMatch(bracketMatches[bracketMatchIndex]);
  }

  function showBracketMatch(match) {
    const divs = duelContainer.children;
    const i1 = match.i1;
    const i2 = match.i2;

    if(mode === 'anime'){
      divs[0].querySelector('img').src = items[i1].image;
      divs[0].querySelector('img').alt = items[i1].title;
      divs[0].querySelector('h3').textContent = items[i1].title;

      divs[1].querySelector('img').src = items[i2].image;
      divs[1].querySelector('img').alt = items[i2].title;
      divs[1].querySelector('h3').textContent = items[i2].title;
    } else {
      const url1 = getYouTubeEmbedUrl(items[i1].youtubeUrls?.[0] || '') || '';
      const url2 = getYouTubeEmbedUrl(items[i2].youtubeUrls?.[0] || '') || '';

      divs[0].querySelector('iframe').src = url1;
      divs[1].querySelector('iframe').src = url2;

      divs[0].querySelector('h3').textContent = items[i1].title;
      divs[1].querySelector('h3').textContent = items[i2].title;
    }
    currentMatch = match;
  }

  function setupNextBracketRound() {
    const winners = bracketMatches.map(m => m.winner);

    if(winners.length === 1){
      showClassement();
      return;
    }
    bracketRound++;
    bracketMatchIndex = 0;
    bracketMatches = [];
    for(let i=0; i<winners.length; i+=2){
      bracketMatches.push({
        i1: winners[i],
        i2: winners[i+1],
        winner: null
      });
    }
    showBracketMatch(bracketMatches[bracketMatchIndex]);
  }

  function showClassement() {
    duelContainer.style.display = 'none';
    classementDiv.innerHTML = '';

    // Classement général (phase suisse)
    let classement = swissStats.map((s, i) => ({
      index: i,
      wins: s.wins,
      buchholz: s.buchholz || s.opponents.reduce((sum, idx) => sum + swissStats[idx].wins, 0)
    })).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
      return Math.random() - 0.5;
    });

    classement.forEach((c, i) => displayClassementItem(c.index, i + 1));
  }

  function displayClassementItem(idx, rank) {
    const item = items[idx];
    const div = document.createElement('div');
    div.className = 'classement-item';
    if(rank === 1) div.classList.add('top1');
    if(rank === 2) div.classList.add('top2');
    if(rank === 3) div.classList.add('top3');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Rang ${rank} - ${item.title}`);

    const rankDiv = document.createElement('div');
    rankDiv.className = 'rank';
    rankDiv.textContent = `#${rank}`;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = item.title;

    div.appendChild(rankDiv);

    if(mode === 'anime'){
      // --- Affiche une image
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title;
      div.appendChild(img);
    } else {
      // --- Affiche l’opening YouTube directement dans un iframe
      const iframe = document.createElement('iframe');
      const embedUrl = getYouTubeEmbedUrl(item.youtubeUrls?.[0] || '');
      if(embedUrl) {
        iframe.src = embedUrl;
        iframe.width = "100%";
        iframe.height = "210";
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        div.appendChild(iframe);
      } else {
        // fallback image
        const thumb = document.createElement('img');
        thumb.src = 'default-opening.png';
        thumb.alt = item.title;
        div.appendChild(thumb);
      }
    }
    div.appendChild(titleDiv);
    classementDiv.appendChild(div);
  }

  // Init first load
  loadDataAndStart();
})();
