// Bouton retour au menu
document.getElementById("back-to-menu").addEventListener("click", function() {
  window.location.href = "../index.html";
});

// Thème clair/sombre persistant
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
});
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
});

(() => {
  const TOTAL_ITEMS = 16;
  const QUALIFIED_TO_BRACKET = 8;
  const MAX_WINS = 3;
  const MAX_LOSSES = 3;

  let mode = 'anime';
  let data = [];
  let items = [];

  let swissStats = [];
  let swissMatches = [];
  let bracketMatches = [];
  let bracketRound = 0;
  let bracketMatchIndex = 0;

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
    duelContainer.innerHTML = '';
    duelContainer.style.display = '';
    classementDiv.innerHTML = '';
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

      swissStats = items.map(() => ({
        wins: 0,
        losses: 0,
        playedOpponents: new Set()
      }));

      swissMatches = generateSwissRoundMatches();

      setupUI();
      showNextMatch();
    } catch(e) {
      alert(e.message);
    }
  }

  function generateSwissRoundMatches() {
    const groups = {};
    for(let i=0; i<items.length; i++){
      const key = `${swissStats[i].wins}-${swissStats[i].losses}`;
      if(!groups[key]) groups[key] = [];
      groups[key].push(i);
    }
    const newMatches = [];
    for(const key in groups){
      const players = groups[key];
      const paired = new Set();
      for(let i=0; i<players.length; i++){
        if(paired.has(players[i])) continue;
        for(let j=i+1; j<players.length; j++){
          if(paired.has(players[j])) continue;
          if(!swissStats[players[i]].playedOpponents.has(players[j])){
            newMatches.push({i1: players[i], i2: players[j], winner: 0});
            paired.add(players[i]);
            paired.add(players[j]);
            break;
          }
        }
      }
    }
    const pairedPlayers = new Set(newMatches.flatMap(m => [m.i1, m.i2]));
    for(let i=0; i<items.length; i++){
      if(!pairedPlayers.has(i) && swissStats[i].wins < MAX_WINS && swissStats[i].losses < MAX_LOSSES){
        swissStats[i].wins++;
      }
    }
    return newMatches;
  }

  function setupUI() {
    duelContainer.innerHTML = '';
    duelContainer.style.display = 'flex';

    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    if(mode === 'anime'){
      div1.className = 'anime-card';
      div2.className = 'anime-card';
      div1.innerHTML = `<img src="" alt="" /><div class="title"></div>`;
      div2.innerHTML = `<img src="" alt="" /><div class="title"></div>`;
    } else {
      div1.className = 'opening-card';
      div2.className = 'opening-card';
      div1.innerHTML = `<iframe src="" frameborder="0" allowfullscreen></iframe><div class="title"></div>`;
      div2.innerHTML = `<iframe src="" frameborder="0" allowfullscreen></iframe><div class="title"></div>`;
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
    const swissOngoing = swissStats.some(s => s.wins < MAX_WINS && s.losses < MAX_LOSSES);
    if(swissOngoing && swissMatches.length > 0){
      const match = swissMatches.shift();
      if(!match){
        swissMatches = generateSwissRoundMatches();
        if(swissMatches.length === 0) {
          startBracket();
          return;
        }
        showNextMatch();
        return;
      }
      showMatch(match);
    } else {
      if(bracketRound === 0){
        startBracket();
      } else {
        showClassement();
      }
    }
  }

  function showMatch(match) {
    const i1 = match.i1;
    const i2 = match.i2;
    const divs = duelContainer.children;

    if(mode === 'anime'){
      divs[0].querySelector('img').src = items[i1].image;
      divs[0].querySelector('img').alt = items[i1].title;
      divs[0].querySelector('.title').textContent = items[i1].title;

      divs[1].querySelector('img').src = items[i2].image;
      divs[1].querySelector('img').alt = items[i2].title;
      divs[1].querySelector('.title').textContent = items[i2].title;
    } else {
      const url1 = getYouTubeEmbedUrl(items[i1].youtubeUrls?.[0] || '') || '';
      const url2 = getYouTubeEmbedUrl(items[i2].youtubeUrls?.[0] || '') || '';
      divs[0].querySelector('iframe').src = url1;
      divs[0].querySelector('.title').textContent = items[i1].title;

      divs[1].querySelector('iframe').src = url2;
      divs[1].querySelector('.title').textContent = items[i2].title;
    }
    currentMatch = match;
  }

  let currentMatch = null;

  function recordWin(winner) {
    if(!currentMatch) return;
    if(bracketRound === 0){
      const winnerIndex = (winner === 1) ? currentMatch.i1 : currentMatch.i2;
      const loserIndex = (winner === 1) ? currentMatch.i2 : currentMatch.i1;
      swissStats[winnerIndex].wins++;
      swissStats[loserIndex].losses++;
      swissStats[winnerIndex].playedOpponents.add(loserIndex);
      swissStats[loserIndex].playedOpponents.add(winnerIndex);
      const swissDone = swissStats.every(s => s.wins >= MAX_WINS || s.losses >= MAX_LOSSES);
      if(swissDone){
        startBracket();
      } else {
        if(swissMatches.length === 0){
          swissMatches = generateSwissRoundMatches();
          if(swissMatches.length === 0){
            startBracket();
            return;
          }
        }
        showNextMatch();
      }
    } else {
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
    let qualified = swissStats
      .map((s, i) => ({index: i, wins: s.wins, losses: s.losses}))
      .filter(p => p.wins >= MAX_WINS && p.losses < MAX_LOSSES);
    qualified.sort((a,b) => {
      if(b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });
    qualified = qualified.slice(0, QUALIFIED_TO_BRACKET);
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
      divs[0].querySelector('.title').textContent = items[i1].title;

      divs[1].querySelector('img').src = items[i2].image;
      divs[1].querySelector('img').alt = items[i2].title;
      divs[1].querySelector('.title').textContent = items[i2].title;
    } else {
      const url1 = getYouTubeEmbedUrl(items[i1].youtubeUrls?.[0] || '') || '';
      const url2 = getYouTubeEmbedUrl(items[i2].youtubeUrls?.[0] || '') || '';
      divs[0].querySelector('iframe').src = url1;
      divs[0].querySelector('.title').textContent = items[i1].title;
      divs[1].querySelector('iframe').src = url2;
      divs[1].querySelector('.title').textContent = items[i2].title;
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
    if(bracketRound > 0){
      const ranks = new Array(items.length).fill(null);
      const winnerIndex = bracketMatches.length === 1 && bracketMatches[0].winner != null ? bracketMatches[0].winner : null;
      if(!winnerIndex){
        alert("Classement non disponible");
        return;
      }
      if(bracketRound === 3){
        const finalMatch = bracketMatches[0];
        const finalLoser = finalMatch.i1 === finalMatch.winner ? finalMatch.i2 : finalMatch.i1;
        ranks[winnerIndex] = 1;
        ranks[finalLoser] = 2;
        const qualified = swissStats
          .map((s, i) => ({index: i, wins: s.wins, losses: s.losses}))
          .filter(p => p.wins >= MAX_WINS && p.losses < MAX_LOSSES)
          .slice(0, QUALIFIED_TO_BRACKET)
          .map(p => p.index);
        const otherQualified = qualified.filter(i => i !== winnerIndex && i !== finalLoser);
        for(let j=0; j<otherQualified.length; j++){
          ranks[otherQualified[j]] = (j < 2) ? 3 + j : 5 + (j - 2);
        }
        for(let i=0; i<items.length; i++){
          if(ranks[i] === null){
            ranks[i] = 9 + i;
          }
        }
      } else {
        ranks.fill(null);
        swissStats.forEach((s,i) => {
          ranks[i] = 9 + i;
        });
      }
      const rankedItems = items.map((item,i) => ({
        index: i,
        rank: ranks[i],
        wins: swissStats[i]?.wins || 0,
        losses: swissStats[i]?.losses || 0
      })).sort((a,b) => a.rank - b.rank);

      for(const entry of rankedItems){
        displayClassementItem(entry.index, entry.rank);
      }
    } else {
      const classement = swissStats
        .map((s,i) => ({index: i, wins: s.wins, losses: s.losses}))
        .sort((a,b) => {
          if(b.wins !== a.wins) return b.wins - a.wins;
          return a.losses - b.losses;
        });
      classement.forEach((c,i) => displayClassementItem(c.index, i+1));
    }
  }

  function displayClassementItem(idx, rank) {
    const item = items[idx];
    let card;
    if(rank <= 3) {
      card = document.createElement('div');
      card.className = `classement-item podium-flip top${rank}`;
      card.style.opacity = 0;

      const front = document.createElement('div');
      front.className = 'front';
      if(mode === 'anime'){
        front.innerHTML = `<img src="${item.image}" alt="${item.title}" /><div class="title">${item.title}</div>`;
      } else {
        const ytid = getYouTubeId(item.youtubeUrls?.[0] || '');
        let iframeOrThumb;
        if(ytid)
          iframeOrThumb = `<iframe src="https://www.youtube.com/embed/${ytid}?rel=0&autoplay=0" frameborder="0" allowfullscreen></iframe>`;
        else
          iframeOrThumb = `<div style="width:100%;height:210px;background:#444;border-radius:9px;"></div>`;
        front.innerHTML = `${iframeOrThumb}<div class="title">${item.title}</div>`;
      }
      const rankDiv = document.createElement('div');
      rankDiv.className = 'rank';
      rankDiv.textContent = `#${rank}`;
      front.appendChild(rankDiv);

      const back = document.createElement('div');
      back.className = 'back';
      back.innerHTML = `<span>TOP ${rank}</span>`;

      card.appendChild(front);
      card.appendChild(back);

      classementDiv.appendChild(card);

      setTimeout(() => {
        card.style.opacity = 1;
        setTimeout(() => {
          card.classList.add('flipped');
        }, 350 + (4 - rank) * 500);
      }, rank * 120);

    } else {
      card = document.createElement('div');
      card.className = `classement-item`;
      if(mode === 'anime'){
        card.innerHTML = `<img src="${item.image}" alt="${item.title}" /><div class="title">${item.title}</div>`;
      } else {
        const ytid = getYouTubeId(item.youtubeUrls?.[0] || '');
        let iframeOrThumb;
        if(ytid)
          iframeOrThumb = `<iframe src="https://www.youtube.com/embed/${ytid}?rel=0&autoplay=0" frameborder="0" allowfullscreen></iframe>`;
        else
          iframeOrThumb = `<div style="width:100%;height:210px;background:#444;border-radius:9px;"></div>`;
        card.innerHTML = `${iframeOrThumb}<div class="title">${item.title}</div>`;
      }
      const rankDiv = document.createElement('div');
      rankDiv.className = 'rank';
      rankDiv.textContent = `#${rank}`;
      card.appendChild(rankDiv);

      classementDiv.appendChild(card);
    }
  }

  loadDataAndStart();
})();
