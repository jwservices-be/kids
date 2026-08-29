// ---------- Auto-advance progress button helper ----------
function startAutoAdvanceBar(fillEl) {
  fillEl.classList.remove('filling');
  void fillEl.offsetWidth;
  fillEl.classList.add('filling');
}

function resetAutoAdvanceBar(fillEl) {
  fillEl.classList.remove('filling');
}

// ---------- Shared setup-screen helpers ----------
function clampInputRange(input, min, max) {
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (input.value !== '' && (Number.isNaN(value) || value < min)) input.value = String(min);
    if (value > max) input.value = String(max);
  });
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePicker(list) {
  let pool = [];
  return {
    next() {
      if (pool.length === 0) pool = shuffleArray(list);
      return pool.pop();
    },
    reset() {
      pool = [];
    },
  };
}

function setDoneMessage(ratio, emojiId, titleId) {
  const emojiEl = document.getElementById(emojiId);
  const titleEl = document.getElementById(titleId);
  if (ratio === 1) {
    emojiEl.textContent = '🏆';
    titleEl.textContent = 'Proficiat! Perfecte score!';
  } else if (ratio >= 0.7) {
    emojiEl.textContent = '🎉';
    titleEl.textContent = 'Proficiat! Goed gedaan!';
  } else if (ratio >= 0.4) {
    emojiEl.textContent = '👍';
    titleEl.textContent = 'Goed geprobeerd!';
  } else {
    emojiEl.textContent = '💪';
    titleEl.textContent = 'Blijf oefenen, je kan het!';
  }
}

// ---------- Simple page router ----------
const homeView = document.getElementById('home-view');
const gamePages = document.querySelectorAll('.game-page');

function showRoute(route) {
  const isHome = !route || route === 'home';
  if (homeView) homeView.style.display = isHome ? '' : 'none';
  gamePages.forEach((page) => {
    page.classList.toggle('active', !isHome && page.id === route);
  });
  window.scrollTo({ top: 0 });
  window.dispatchEvent(new CustomEvent('routechange', { detail: { route } }));
}

function routeFromHash() {
  return window.location.hash.replace('#', '') || 'home';
}

document.querySelectorAll('[data-route]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const route = el.dataset.route;
    window.location.hash = route === 'home' ? '' : route;
    showRoute(route);
  });
});

window.addEventListener('hashchange', () => showRoute(routeFromHash()));
showRoute(routeFromHash());

// ---------- Mobile nav toggle ----------
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ================================================================
// MEMORY GAME
// ================================================================
const memoryBoard = document.getElementById('memory-board');

if (memoryBoard) {
  const EMOJIS = ['🐶', '🐱', '🦁', '🐸', '🐵', '🦄', '🐢', '🐝'];
  const movesEl = document.getElementById('memory-moves');
  const winEl = document.getElementById('memory-win');
  const restartBtn = document.getElementById('memory-restart');

  let cards = [];
  let flipped = [];
  let matchedCount = 0;
  let moves = 0;
  let lock = false;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildMemoryBoard() {
    memoryBoard.innerHTML = '';
    cards = shuffle([...EMOJIS, ...EMOJIS]);
    flipped = [];
    matchedCount = 0;
    moves = 0;
    lock = false;
    movesEl.textContent = '0';
    winEl.hidden = true;

    cards.forEach((emoji, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.index = String(index);
      card.dataset.emoji = emoji;
      card.innerHTML = `
        <span class="face face-front">${emoji}</span>
        <span class="face face-back">❓</span>
      `;
      card.addEventListener('click', () => onCardClick(card));
      memoryBoard.appendChild(card);
    });
  }

  function onCardClick(card) {
    if (lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flipped.length === 2) return;

    card.classList.add('flipped');
    flipped.push(card);

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = String(moves);
      const [a, b] = flipped;
      if (a.dataset.emoji === b.dataset.emoji) {
        a.classList.add('matched');
        b.classList.add('matched');
        flipped = [];
        matchedCount += 2;
        if (matchedCount === cards.length) {
          winEl.hidden = false;
        }
      } else {
        lock = true;
        setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          lock = false;
        }, 800);
      }
    }
  }

  restartBtn.addEventListener('click', buildMemoryBoard);
  buildMemoryBoard();
}

// ================================================================
// SPOT THE DIFFERENCE GAME
// ================================================================
const diffPanelLeft = document.getElementById('diff-panel-left');

if (diffPanelLeft) {
  const diffPanelRight = document.getElementById('diff-panel-right');
  const sceneNumEl = document.getElementById('diff-scene-num');
  const sceneMaxEl = document.getElementById('diff-scene-max');
  const foundEl = document.getElementById('diff-found');
  const totalEl = document.getElementById('diff-total');
  const activeEl = document.getElementById('diff-active');
  const doneEl = document.getElementById('diff-done');
  const messageEl = document.getElementById('diff-message');
  const nextBtn = document.getElementById('diff-next');
  const progressFill = document.getElementById('diff-next-fill');
  const restartBtn = document.getElementById('diff-restart');
  let advanceTimeout = null;

  const SCENES = [
    {
      name: 'onderwater',
      left: [
        ['🐠', 15, 20, 2.2], ['🐟', 40, 15, 2], ['🐡', 70, 25, 2.4], ['🦈', 85, 50, 3],
        ['🐙', 20, 60, 2.6], ['⭐', 50, 70, 1.8], ['🪸', 10, 85, 2.2], ['🌊', 60, 10, 1.6],
        ['🐚', 35, 80, 1.8], ['🦀', 75, 80, 2], ['🫧', 55, 40, 1.4], ['🐬', 90, 15, 2.2],
      ],
      right: [
        ['🐟', 15, 20, 2.2], ['🐟', 40, 15, 2], ['🐡', 70, 25, 2.4],
        ['🐙', 20, 60, 2.6], ['⭐', 50, 45, 1.8], ['🪸', 10, 85, 2.2], ['🌊', 60, 10, 1.6],
        ['🐚', 35, 80, 3.2], ['🦀', 75, 80, 2], ['🫧', 55, 40, 1.4], ['🐬', 90, 15, 2.2, true],
      ],
      diffs: [
        { lx: 15, ly: 20, rx: 15, ry: 20, r: 9 },
        { lx: 85, ly: 50, rx: 85, ry: 50, r: 9 },
        { lx: 50, ly: 70, rx: 50, ry: 45, r: 9 },
        { lx: 35, ly: 80, rx: 35, ry: 80, r: 10 },
        { lx: 90, ly: 15, rx: 90, ry: 15, r: 9 },
      ],
    },
    {
      name: 'ruimte',
      left: [
        ['🚀', 20, 70, 2.6], ['🪐', 70, 20, 2.8], ['⭐', 15, 20, 1.6], ['⭐', 40, 10, 1.4],
        ['🌟', 85, 15, 1.8], ['👽', 50, 60, 2.4], ['🌙', 30, 40, 2.2], ['☄️', 80, 75, 2],
        ['🛸', 60, 85, 2.2], ['⭐', 90, 50, 1.4], ['🪨', 10, 55, 1.8], ['⭐', 25, 85, 1.4],
      ],
      right: [
        ['🚀', 20, 70, 2.6, true], ['⭐', 15, 20, 1.6], ['⭐', 40, 10, 1.4],
        ['🌟', 85, 15, 1.8], ['👽', 55, 35, 2.4], ['🌙', 30, 40, 2.2], ['🔥', 80, 75, 2],
        ['🛸', 60, 85, 2.2], ['⭐', 90, 50, 1.4], ['🪨', 10, 55, 1.8], ['⭐', 25, 85, 3],
      ],
      diffs: [
        { lx: 20, ly: 70, rx: 20, ry: 70, r: 9 },
        { lx: 70, ly: 20, rx: 70, ry: 20, r: 9 },
        { lx: 50, ly: 60, rx: 55, ry: 35, r: 9 },
        { lx: 80, ly: 75, rx: 80, ry: 75, r: 9 },
        { lx: 25, ly: 85, rx: 25, ry: 85, r: 10 },
      ],
    },
    {
      name: 'boerderij',
      left: [
        ['🐄', 20, 60, 2.6], ['🐖', 45, 70, 2.2], ['🐓', 70, 55, 2], ['🐑', 15, 30, 2.2],
        ['🚜', 60, 25, 2.6], ['🌻', 85, 70, 2], ['🌾', 30, 85, 1.8], ['🐴', 80, 35, 2.4],
        ['🐔', 50, 45, 1.8], ['🍎', 10, 75, 1.6], ['☀️', 90, 10, 2], ['🌳', 5, 15, 2.4],
      ],
      right: [
        ['🐂', 20, 60, 2.6], ['🐖', 45, 70, 2.2], ['🐓', 70, 55, 2], ['🐑', 15, 30, 2.2],
        ['🌻', 85, 70, 2], ['🌾', 30, 85, 1.8], ['🐴', 75, 60, 2.4],
        ['🐔', 50, 45, 1.8], ['🍎', 10, 75, 1.6], ['☀️', 90, 10, 3.4], ['🌳', 5, 15, 2.4, true],
      ],
      diffs: [
        { lx: 20, ly: 60, rx: 20, ry: 60, r: 9 },
        { lx: 60, ly: 25, rx: 60, ry: 25, r: 9 },
        { lx: 80, ly: 35, rx: 75, ry: 60, r: 9 },
        { lx: 90, ly: 10, rx: 90, ry: 10, r: 10 },
        { lx: 5, ly: 15, rx: 5, ry: 15, r: 9 },
      ],
    },
  ];

  let sceneIndex = 0;
  let foundCount = 0;
  let found = [];

  function renderPanel(panelEl, items) {
    panelEl.innerHTML = '';
    items.forEach(([emoji, x, y, size, flip]) => {
      const el = document.createElement('div');
      el.className = 'diff-item';
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.fontSize = `${size}em`;
      if (flip) el.style.transform = 'translate(-50%, -50%) scaleX(-1)';
      el.textContent = emoji;
      panelEl.appendChild(el);
    });
  }

  function addMarker(panelEl, x, y) {
    const marker = document.createElement('div');
    marker.className = 'diff-marker';
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    panelEl.appendChild(marker);
  }

  function handleClick(e, side) {
    const scene = SCENES[sceneIndex];
    const panelEl = side === 'left' ? diffPanelLeft : diffPanelRight;
    const rect = panelEl.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    scene.diffs.forEach((d, i) => {
      if (found[i]) return;
      const tx = side === 'left' ? d.lx : d.rx;
      const ty = side === 'left' ? d.ly : d.ry;
      const dist = Math.hypot(clickX - tx, clickY - ty);
      if (dist <= d.r) {
        found[i] = true;
        foundCount++;
        foundEl.textContent = String(foundCount);
        addMarker(diffPanelLeft, d.lx, d.ly);
        addMarker(diffPanelRight, d.rx, d.ry);
        if (foundCount === scene.diffs.length) {
          messageEl.textContent = '🎉 Prachtig! Je hebt alle verschillen gevonden!';
          messageEl.style.color = 'var(--green)';
          nextBtn.hidden = false;
          startAutoAdvanceBar(progressFill);
          advanceTimeout = setTimeout(goToNextScene, 2500);
        }
      }
    });
  }

  diffPanelLeft.addEventListener('click', (e) => handleClick(e, 'left'));
  diffPanelRight.addEventListener('click', (e) => handleClick(e, 'right'));

  function newScene() {
    if (sceneIndex >= SCENES.length) {
      activeEl.hidden = true;
      doneEl.hidden = false;
      return;
    }

    const scene = SCENES[sceneIndex];
    sceneNumEl.textContent = String(sceneIndex + 1);
    sceneMaxEl.textContent = String(SCENES.length);
    totalEl.textContent = String(scene.diffs.length);
    foundCount = 0;
    found = [];
    foundEl.textContent = '0';
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    renderPanel(diffPanelLeft, scene.left);
    renderPanel(diffPanelRight, scene.right);
  }

  function goToNextScene() {
    sceneIndex++;
    newScene();
  }

  function restartAll() {
    sceneIndex = 0;
    activeEl.hidden = false;
    doneEl.hidden = true;
    newScene();
  }

  nextBtn.addEventListener('click', goToNextScene);
  restartBtn.addEventListener('click', restartAll);

  newScene();
}

// ================================================================
// SHADOW MATCHING GAME
// ================================================================
const silhouettesEl = document.getElementById('shadow-silhouettes');

if (silhouettesEl) {
  const animalsEl = document.getElementById('shadow-animals');
  const foundEl = document.getElementById('shadow-found');
  const totalEl = document.getElementById('shadow-total');
  const movesEl = document.getElementById('shadow-moves');
  const restartBtn = document.getElementById('shadow-restart');
  const winEl = document.getElementById('shadow-win');

  const ANIMALS = ['🐶', '🐱', '🐮', '🐑', '🐔', '🦆', '🐸', '🐰'];

  let matchedCount = 0;
  let moves = 0;
  let selectedSilhouette = null;
  let lock = false;

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildBoard() {
    silhouettesEl.innerHTML = '';
    animalsEl.innerHTML = '';
    matchedCount = 0;
    moves = 0;
    selectedSilhouette = null;
    lock = false;
    foundEl.textContent = '0';
    totalEl.textContent = String(ANIMALS.length);
    movesEl.textContent = '0';
    winEl.hidden = true;

    shuffle(ANIMALS).forEach((emoji) => {
      const tile = document.createElement('div');
      tile.className = 'shadow-tile silhouette';
      tile.dataset.emoji = emoji;
      tile.innerHTML = `<span class="shadow-emoji">${emoji}</span>`;
      tile.addEventListener('click', () => onSilhouetteClick(tile));
      silhouettesEl.appendChild(tile);
    });

    shuffle(ANIMALS).forEach((emoji) => {
      const tile = document.createElement('div');
      tile.className = 'shadow-tile';
      tile.dataset.emoji = emoji;
      tile.innerHTML = `<span class="shadow-emoji">${emoji}</span>`;
      tile.addEventListener('click', () => onAnimalClick(tile));
      animalsEl.appendChild(tile);
    });
  }

  function onSilhouetteClick(tile) {
    if (lock || tile.classList.contains('matched')) return;
    if (selectedSilhouette) selectedSilhouette.classList.remove('selected');
    if (selectedSilhouette === tile) {
      selectedSilhouette = null;
      return;
    }
    selectedSilhouette = tile;
    tile.classList.add('selected');
  }

  function onAnimalClick(tile) {
    if (lock || tile.classList.contains('matched') || !selectedSilhouette) return;
    moves++;
    movesEl.textContent = String(moves);

    if (tile.dataset.emoji === selectedSilhouette.dataset.emoji) {
      tile.classList.add('matched');
      selectedSilhouette.classList.add('matched');
      selectedSilhouette.classList.remove('selected');
      selectedSilhouette = null;
      matchedCount++;
      foundEl.textContent = String(matchedCount);
      if (matchedCount === ANIMALS.length) {
        winEl.hidden = false;
      }
    } else {
      lock = true;
      tile.classList.add('wrong');
      setTimeout(() => {
        tile.classList.remove('wrong');
        if (selectedSilhouette) selectedSilhouette.classList.remove('selected');
        selectedSilhouette = null;
        lock = false;
      }, 600);
    }
  }

  restartBtn.addEventListener('click', buildBoard);
  buildBoard();
}

// ================================================================
// CATCH THE STARS GAME
// ================================================================
const starsCanvas = document.getElementById('stars-canvas');

if (starsCanvas) {
  const ctx = starsCanvas.getContext('2d');
  const scoreEl = document.getElementById('stars-score');
  const timeEl = document.getElementById('stars-time');
  const overlay = document.getElementById('stars-overlay');
  const startBtn = document.getElementById('stars-start');
  const restartBtn = document.getElementById('stars-restart');

  const GAME_TIME = 30;
  const LEVEL_CONFIG = {
    makkelijk: { speedMult: 1 / 3, spawnIntervalMult: 2, basketWidth: 120, ramp: 0 },
    gewoon: { speedMult: 1, spawnIntervalMult: 1, basketWidth: 70, ramp: 1 },
    moeilijk: { speedMult: 1.5, spawnIntervalMult: 0.67, basketWidth: 70, ramp: 1 },
  };
  const SPAWN_INTERVAL_BASE = 700;
  let level = LEVEL_CONFIG.gewoon;
  let width, height;
  let basketX = 0;
  let basketWidth = level.basketWidth;
  const basketHeight = 26;
  let stars = [];
  let score = 0;
  let missed = 0;
  let timeLeft = GAME_TIME;
  let running = false;
  let rafId = null;
  let timerId = null;
  let lastSpawn = 0;

  const missedEl = document.getElementById('stars-missed');
  const levelButtons = document.querySelectorAll('.stars-level');
  levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (running) return;
      levelButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      level = LEVEL_CONFIG[btn.dataset.level];
      basketWidth = level.basketWidth;
    });
  });

  function resizeCanvas() {
    const rect = starsCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    starsCanvas.width = rect.width * dpr;
    starsCanvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width;
    height = rect.height;
    if (basketX === 0) basketX = width / 2;
  }

  function spawnStar() {
    stars.push({
      x: Math.random() * (width - 20) + 10,
      y: -20,
      speed: (1.5 + Math.random() * 2 + Math.min(6, score * 0.05) * level.ramp) * level.speedMult,
      size: 18 + Math.random() * 10,
    });
  }

  function setBasketFromClientX(clientX) {
    const rect = starsCanvas.getBoundingClientRect();
    basketX = Math.min(width - basketWidth / 2, Math.max(basketWidth / 2, clientX - rect.left));
  }

  starsCanvas.addEventListener('mousemove', (e) => {
    if (!running) return;
    setBasketFromClientX(e.clientX);
  });

  starsCanvas.addEventListener('touchmove', (e) => {
    if (!running) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) setBasketFromClientX(touch.clientX);
  }, { passive: false });

  starsCanvas.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) setBasketFromClientX(touch.clientX);
  });

  function drawBasket() {
    ctx.font = `${basketHeight + 20}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧺', basketX, height - basketHeight);
  }

  function drawStar(star) {
    ctx.font = `${star.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', star.x, star.y);
  }

  function loop(timestamp) {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    if (timestamp - lastSpawn > SPAWN_INTERVAL_BASE * level.spawnIntervalMult) {
      spawnStar();
      lastSpawn = timestamp;
    }

    stars.forEach((star) => { star.y += star.speed; });

    const basketTop = height - basketHeight * 1.6;
    stars = stars.filter((star) => {
      if (star.y > basketTop && star.y < height && Math.abs(star.x - basketX) < basketWidth / 2 + star.size / 2) {
        score++;
        scoreEl.textContent = String(score);
        return false;
      }
      if (star.y >= height + 30) {
        missed++;
        missedEl.textContent = String(missed);
        return false;
      }
      return true;
    });

    stars.forEach(drawStar);
    drawBasket();

    rafId = requestAnimationFrame(loop);
  }

  function tickTimer() {
    timeLeft--;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      endGame();
    }
  }

  function startGame() {
    resizeCanvas();
    score = 0;
    missed = 0;
    timeLeft = GAME_TIME;
    stars = [];
    lastSpawn = 0;
    basketX = width / 2;
    scoreEl.textContent = '0';
    missedEl.textContent = '0';
    timeEl.textContent = String(GAME_TIME);
    overlay.hidden = true;
    running = true;
    rafId = requestAnimationFrame(loop);
    timerId = setInterval(tickTimer, 1000);
  }

  function endGame() {
    running = false;
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    overlay.hidden = false;
    overlay.innerHTML = `<div style="text-align:center;color:#fff;">
      <p style="font-size:1.4rem;font-weight:bold;">🎉 Klaar! Score: ${score} — Gemist: ${missed}</p>
      <button id="stars-play-again" class="btn btn-big">🔄 Speel opnieuw</button>
    </div>`;
    document.getElementById('stars-play-again').addEventListener('click', startGame);
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', () => {
    running = false;
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    startGame();
  });

  window.addEventListener('resize', () => {
    if (!running) resizeCanvas();
  });

  window.addEventListener('routechange', (e) => {
    if (e.detail.route === 'sterren' && !running) resizeCanvas();
  });

  resizeCanvas();
}

// ================================================================
// WORD GUESS GAME
// ================================================================
const guessEmojiEl = document.getElementById('guess-emoji');

if (guessEmojiEl) {
  const ANIMALS = [
    { emoji: '🐶', word: 'HOND' },
    { emoji: '🐱', word: 'KAT' },
    { emoji: '🦁', word: 'LEEUW' },
    { emoji: '🐸', word: 'KIKKER' },
    { emoji: '🐵', word: 'AAP' },
    { emoji: '🦄', word: 'EENHOORN' },
    { emoji: '🐢', word: 'SCHILDPAD' },
    { emoji: '🐝', word: 'BIJ' },
    { emoji: '🐘', word: 'OLIFANT' },
    { emoji: '🐟', word: 'VIS' },
  ];

  const setupEl = document.getElementById('guess-setup');
  const playEl = document.getElementById('guess-play');
  const countInput = document.getElementById('guess-count-input');
  const startSetupBtn = document.getElementById('guess-start');
  const countEl = document.getElementById('guess-count');
  const scoreEl = document.getElementById('guess-score');
  const wrongStatEl = document.getElementById('guess-wrong');
  const activeEl = document.getElementById('guess-active');
  const doneEl = document.getElementById('guess-done');
  const finalScoreEl = document.getElementById('guess-final-score');
  const finalMaxEl = document.getElementById('guess-final-max');
  const restartRoundBtn = document.getElementById('guess-restart');
  const wordEl = document.getElementById('guess-word');
  const lettersEl = document.getElementById('guess-letters');
  const messageEl = document.getElementById('guess-message');
  const nextBtn = document.getElementById('guess-next');
  const progressFill = document.getElementById('guess-next-fill');
  let advanceTimeout = null;

  clampInputRange(countInput, 1, 99);

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let current = null;
  let revealed = [];
  let roundHadError = false;
  let score = 0;
  let wrongTotal = 0;
  let correctCount = 0;
  let sumIndex = 0;
  let sumsPerRound = 10;

  const animalPicker = makePicker(ANIMALS);
  function pickAnimal() {
    return animalPicker.next();
  }

  function renderWord() {
    wordEl.innerHTML = '';
    current.word.split('').forEach((letter, i) => {
      const slot = document.createElement('div');
      slot.className = 'guess-slot';
      slot.textContent = revealed[i] ? letter : '';
      wordEl.appendChild(slot);
    });
  }

  function renderLetters() {
    lettersEl.innerHTML = '';
    ALPHABET.forEach((letter) => {
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.addEventListener('click', () => handleGuess(letter, btn));
      lettersEl.appendChild(btn);
    });
  }

  function handleGuess(letter, btn) {
    btn.disabled = true;
    if (current.word.includes(letter)) {
      btn.classList.add('correct');
      current.word.split('').forEach((l, i) => {
        if (l === letter) revealed[i] = true;
      });
      renderWord();
      if (revealed.every(Boolean)) {
        if (!roundHadError) {
          score++;
          correctCount++;
          scoreEl.textContent = String(score);
        }
        messageEl.textContent = '🎉 Goed geraden!';
        messageEl.style.color = 'var(--green)';
        lettersEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
        nextBtn.hidden = false;
        startAutoAdvanceBar(progressFill);
        advanceTimeout = setTimeout(newRound, 2000);
      }
    } else {
      btn.classList.add('wrong');
      roundHadError = true;
      wrongTotal++;
      wrongStatEl.textContent = String(wrongTotal);
      messageEl.textContent = `"${letter}" zit niet in het woord, probeer nog eens`;
      messageEl.style.color = 'var(--pink)';
    }
  }

  function newRound() {
    if (sumIndex >= sumsPerRound) {
      activeEl.hidden = true;
      doneEl.hidden = false;
      finalScoreEl.textContent = String(correctCount);
      finalMaxEl.textContent = String(sumsPerRound);
      setDoneMessage(correctCount / sumsPerRound, 'guess-done-emoji', 'guess-done-title');
      return;
    }

    sumIndex++;
    countEl.textContent = String(sumIndex);
    current = pickAnimal();
    revealed = current.word.split('').map(() => false);
    roundHadError = false;
    guessEmojiEl.textContent = current.emoji;
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    renderWord();
    renderLetters();
  }

  function startRound() {
    sumsPerRound = Math.min(99, Math.max(1, Number(countInput.value) || 10));
    document.getElementById('guess-max').textContent = String(sumsPerRound);
    score = 0;
    wrongTotal = 0;
    correctCount = 0;
    sumIndex = 0;
    scoreEl.textContent = '0';
    wrongStatEl.textContent = '0';
    setupEl.hidden = true;
    playEl.hidden = false;
    activeEl.hidden = false;
    doneEl.hidden = true;
    animalPicker.reset();
    newRound();
  }

  function backToSetup() {
    playEl.hidden = true;
    setupEl.hidden = false;
  }

  startSetupBtn.addEventListener('click', startRound);
  nextBtn.addEventListener('click', newRound);
  restartRoundBtn.addEventListener('click', backToSetup);

  window.addEventListener('routechange', (e) => {
    if (e.detail.route !== 'raad' && !playEl.hidden) backToSetup();
  });
}

// ================================================================
// REKENOEFENING (splitsen, optellen, aftrekken tot 20)
// ================================================================
const rekenProblemEl = document.getElementById('reken-problem');

if (rekenProblemEl) {
  const setupEl = document.getElementById('reken-setup');
  const playEl = document.getElementById('reken-play');
  const modeButtons = document.querySelectorAll('.reken-mode');
  const maxInput = document.getElementById('reken-max-input');
  const countInput = document.getElementById('reken-count-input');
  clampInputRange(countInput, 1, 99);
  clampInputRange(maxInput, 1, 99);
  const startBtn = document.getElementById('reken-start');
  const scoreEl = document.getElementById('reken-score');
  const countEl = document.getElementById('reken-count');
  const wrongStatEl = document.getElementById('reken-wrong');
  const activeEl = document.getElementById('reken-active');
  const doneEl = document.getElementById('reken-done');
  const finalScoreEl = document.getElementById('reken-final-score');
  const finalMaxEl = document.getElementById('reken-final-max');
  const restartBtn = document.getElementById('reken-restart');
  const formEl = document.getElementById('reken-form');
  const answerEl = document.getElementById('reken-answer');
  const messageEl = document.getElementById('reken-message');
  const nextBtn = document.getElementById('reken-next');
  const progressFill = document.getElementById('reken-next-fill');
  let advanceTimeout = null;

  let mode = null;
  let maxNumber = 20;
  let sumsPerRound = 10;
  let answer = null;
  let score = 0;
  let wrongTotal = 0;
  let correctCount = 0;
  let sumIndex = 0;
  let answered = false;
  let hadErrorThisProblem = false;
  let usedProblems = new Set();

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function newProblem() {
    if (sumIndex >= sumsPerRound) {
      activeEl.hidden = true;
      doneEl.hidden = false;
      finalScoreEl.textContent = String(correctCount);
      finalMaxEl.textContent = String(sumsPerRound);
      setDoneMessage(correctCount / sumsPerRound, 'reken-done-emoji', 'reken-done-title');
      return;
    }

    sumIndex++;
    countEl.textContent = String(sumIndex);
    answered = false;
    hadErrorThisProblem = false;
    answerEl.disabled = false;
    answerEl.value = '';
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    answerEl.focus();

    let signature;
    let attempts = 0;
    do {
      attempts++;
      if (mode === 'splitsen') {
        const total = randInt(Math.ceil(maxNumber / 2), maxNumber);
        const left = randInt(1, total - 1);
        const right = total - left;
        const hideLeft = Math.random() < 0.5;
        answer = hideLeft ? left : right;
        signature = `splitsen:${total}:${hideLeft}`;
        rekenProblemEl.innerHTML = `<div class="split-tree">
          <div class="split-top">${total}</div>
          <div class="split-children"><span>${hideLeft ? '?' : left}</span><span>${hideLeft ? right : '?'}</span></div>
        </div>`;
      } else if (mode === 'optellen') {
        const a = randInt(2, maxNumber - 1);
        const b = randInt(1, maxNumber - a);
        answer = a + b;
        signature = `optellen:${a}:${b}`;
        rekenProblemEl.textContent = `${a} + ${b} = ?`;
      } else {
        const a = randInt(2, maxNumber);
        const b = randInt(1, a);
        answer = a - b;
        signature = `aftrekken:${a}:${b}`;
        rekenProblemEl.textContent = `${a} - ${b} = ?`;
      }
    } while (usedProblems.has(signature) && attempts < 30);
    usedProblems.add(signature);
  }

  function checkAnswer(e) {
    e.preventDefault();
    if (answered) return;
    const given = Number(answerEl.value);
    if (answerEl.value === '' || Number.isNaN(given)) return;

    if (given === answer) {
      answered = true;
      answerEl.disabled = true;
      if (!hadErrorThisProblem) {
        score += 1;
        correctCount++;
        scoreEl.textContent = String(score);
      }
      messageEl.textContent = '🎉 Helemaal goed!';
      messageEl.style.color = 'var(--green)';
      nextBtn.hidden = false;
      startAutoAdvanceBar(progressFill);
      advanceTimeout = setTimeout(newProblem, 2000);
    } else {
      hadErrorThisProblem = true;
      wrongTotal++;
      wrongStatEl.textContent = String(wrongTotal);
      messageEl.textContent = `${given} is niet juist, probeer nog eens`;
      messageEl.style.color = 'var(--pink)';
      answerEl.value = '';
      answerEl.focus();
    }
  }

  function startRound() {
    sumsPerRound = Math.min(99, Math.max(1, Number(countInput.value) || 10));
    maxNumber = Math.min(99, Math.max(4, Number(maxInput.value) || 20));
    document.getElementById('reken-max').textContent = String(sumsPerRound);
    score = 0;
    wrongTotal = 0;
    correctCount = 0;
    sumIndex = 0;
    scoreEl.textContent = '0';
    wrongStatEl.textContent = '0';
    setupEl.hidden = true;
    playEl.hidden = false;
    activeEl.hidden = false;
    doneEl.hidden = true;
    usedProblems = new Set();
    newProblem();
  }

  function backToSetup() {
    playEl.hidden = true;
    setupEl.hidden = false;
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      startBtn.disabled = false;
    });
  });

  startBtn.addEventListener('click', startRound);
  formEl.addEventListener('submit', checkAnswer);
  nextBtn.addEventListener('click', newProblem);
  restartBtn.addEventListener('click', backToSetup);

  window.addEventListener('routechange', (e) => {
    if (e.detail.route !== 'rekenen' && !playEl.hidden) backToSetup();
  });
}

// ================================================================
// LETTERS INVULLEN
// ================================================================
const lettersWordEl = document.getElementById('letters-word');

if (lettersWordEl) {
  const WORDS = [
    { before: 'b', after: 'r', correct: 'uu', options: ['u', 'uu', 'ui'] },
    { before: 'paa', after: '', correct: 'rd', options: ['rf', 'rd', 'sr'] },
    { before: 'n', after: 't', correct: 'oo', options: ['o', 'oo', 'aa'] },
    { before: 'b', after: 'k', correct: 'ee', options: ['ie', 'ee', 'ei'] },
    { before: 'h', after: 'l', correct: 'ee', options: ['ee', 'eu', 'uu'] },
    { before: 'ju', after: '', correct: 'f', options: ['v', 'r', 'f'] },
    { before: '', after: 'oen', correct: 'sch', options: ['cht', 'sch', 'ch'] },
    { before: 'z', after: 's', correct: 'e', options: ['e', 'ee'] },
    { before: 'p', after: 'r', correct: 'ee', options: ['e', 'ee'] },
    { before: 'r', after: 'k', correct: 'u', options: ['u', 'uu'] },
    { before: 'd', after: 'r', correct: 'uu', options: ['u', 'uu'] },
    { before: 'st', after: 'r', correct: 'uu', options: ['u', 'uu'] },
    { before: 'va', after: '', correct: 'ng', options: ['rd', 'ng', 'gk'] },
    { before: '', after: 'ijpen', correct: 'gr', options: ['kl', 'tl', 'gr'] },
    { before: 'ba', after: '', correct: 'nk', options: ['ns', 'kn', 'nk'] },
    { before: 'b', after: 'd', correct: 'e', options: ['e', 'ee'] },
    { before: 'g', after: 'k', correct: 'e', options: ['e', 'ee'] },
    { before: 'm', after: 'r', correct: 'ee', options: ['e', 'ee'] },
    { before: 'w', after: 'r', correct: 'ee', options: ['e', 'ee'] },
    { before: 'h', after: 'k', correct: 'e', options: ['e', 'ee'] },
    { before: 'd', after: 'k', correct: 'e', options: ['e', 'ee'] },
    { before: 'n', after: 'm', correct: 'ee', options: ['e', 'ee'] },
    { before: 'n', after: 'st', correct: 'e', options: ['e', 'ee'] },
    { before: 'g', after: 'n', correct: 'ee', options: ['e', 'ee'] },
    { before: 'r', after: 'p', correct: 'ee', options: ['e', 'ee'] },
    { before: 'r', after: 'k', correct: 'e', options: ['e', 'ee'] },
    { before: 'b', after: 'r', correct: 'ee', options: ['e', 'ee'] },
    { before: 'b', after: 'rg', correct: 'e', options: ['e', 'ee'] },
    { before: 'f', after: 'st', correct: 'ee', options: ['e', 'ee'] },
    { before: 'd', after: 'n', correct: 'u', options: ['u', 'uu'] },
    { before: 'k', after: 'rk', correct: 'u', options: ['u', 'uu'] },
    { before: 'h', after: 't', correct: 'u', options: ['u', 'uu'] },
    { before: 'v', after: 'r', correct: 'uu', options: ['u', 'uu'] },
    { before: 'p', after: 't', correct: 'u', options: ['u', 'uu'] },
    { before: 'm', after: 'r', correct: 'uu', options: ['u', 'uu'] },
    { before: 'r', after: 'st', correct: 'u', options: ['u', 'uu'] },
    { before: 'k', after: 's', correct: 'u', options: ['u', 'uu'] },
    { before: 'l', after: 's', correct: 'u', options: ['u', 'uu'] },
    { before: 'sch', after: 'r', correct: 'uu', options: ['u', 'uu'] },
  ];

  const setupEl = document.getElementById('letters-setup');
  const playEl = document.getElementById('letters-play');
  const countInput = document.getElementById('letters-count-input');
  const startSetupBtn = document.getElementById('letters-start');
  const countEl = document.getElementById('letters-count');
  const scoreEl = document.getElementById('letters-score');
  const wrongStatEl = document.getElementById('letters-wrong');
  const activeEl = document.getElementById('letters-active');
  const doneEl = document.getElementById('letters-done');
  const finalScoreEl = document.getElementById('letters-final-score');
  const finalMaxEl = document.getElementById('letters-final-max');
  const restartRoundBtn = document.getElementById('letters-restart');
  const optionsEl = document.getElementById('letters-options');
  const messageEl = document.getElementById('letters-message');
  const nextBtn = document.getElementById('letters-next');
  const progressFill = document.getElementById('letters-next-fill');
  let advanceTimeout = null;

  clampInputRange(countInput, 1, 99);

  let current = null;
  let score = 0;
  let wrongTotal = 0;
  let correctCount = 0;
  let sumIndex = 0;
  let sumsPerRound = 10;
  let answered = false;
  let hadErrorThisWord = false;

  const wordPicker = makePicker(WORDS);
  function pickWord() {
    return wordPicker.next();
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderWord(filled) {
    const blank = filled || '___';
    lettersWordEl.innerHTML = `${current.before}<span class="blank">${blank}</span>${current.after}`;
  }

  function handleChoice(option, btn) {
    if (answered) return;

    if (option === current.correct) {
      answered = true;
      optionsEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
      btn.classList.add('correct');
      if (!hadErrorThisWord) {
        score += 1;
        correctCount++;
        scoreEl.textContent = String(score);
      }
      messageEl.textContent = '🎉 Juist!';
      messageEl.style.color = 'var(--green)';
      renderWord(current.correct);
      nextBtn.hidden = false;
      startAutoAdvanceBar(progressFill);
      advanceTimeout = setTimeout(newWord, 2000);
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      hadErrorThisWord = true;
      wrongTotal++;
      wrongStatEl.textContent = String(wrongTotal);
      messageEl.textContent = `"${option}" is niet juist, probeer nog eens`;
      messageEl.style.color = 'var(--pink)';
    }
  }

  function newWord() {
    if (sumIndex >= sumsPerRound) {
      activeEl.hidden = true;
      doneEl.hidden = false;
      finalScoreEl.textContent = String(correctCount);
      finalMaxEl.textContent = String(sumsPerRound);
      setDoneMessage(correctCount / sumsPerRound, 'letters-done-emoji', 'letters-done-title');
      return;
    }

    sumIndex++;
    countEl.textContent = String(sumIndex);
    current = pickWord();
    answered = false;
    hadErrorThisWord = false;
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    renderWord(null);
    optionsEl.innerHTML = '';
    shuffle(current.options).forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => handleChoice(option, btn));
      optionsEl.appendChild(btn);
    });
  }

  function startRound() {
    sumsPerRound = Math.min(99, Math.max(1, Number(countInput.value) || 10));
    document.getElementById('letters-max').textContent = String(sumsPerRound);
    score = 0;
    wrongTotal = 0;
    correctCount = 0;
    sumIndex = 0;
    scoreEl.textContent = '0';
    wrongStatEl.textContent = '0';
    setupEl.hidden = true;
    playEl.hidden = false;
    activeEl.hidden = false;
    doneEl.hidden = true;
    wordPicker.reset();
    newWord();
  }

  function backToSetup() {
    playEl.hidden = true;
    setupEl.hidden = false;
  }

  startSetupBtn.addEventListener('click', startRound);
  nextBtn.addEventListener('click', newWord);
  restartRoundBtn.addEventListener('click', backToSetup);

  window.addEventListener('routechange', (e) => {
    if (e.detail.route !== 'letters' && !playEl.hidden) backToSetup();
  });
}

// ================================================================
// ZINNEN VORMEN
// ================================================================
const zinnenSentenceEl = document.getElementById('zinnen-sentence');

if (zinnenSentenceEl) {
  const SENTENCES = [
    { before: 'De kat ', after: ' een muis.', correct: 'eet', options: ['eet', 'vaart', 'zingt'] },
    { before: 'Hij speelt met de ', after: '.', correct: 'bal', options: ['bal', 'wolk', 'brood'] },
    { before: '', after: ' zit in de trein.', correct: 'Roel', options: ['Roel', 'Zout', 'Ziet'] },
    { before: 'Piet gaat naar ', after: '.', correct: 'huis', options: ['huis', 'hooi', 'mooi'] },
    { before: 'Mijn ', after: ' is lief.', correct: 'juf', options: ['juf', 'tafel', 'fiets'] },
    { before: 'De pauw is een ', after: '.', correct: 'dier', options: ['dier', 'touw', 'stoel'] },
    { before: 'Zij ', after: ' soep.', correct: 'kookt', options: ['kookt', 'springt', 'leest'] },
    { before: 'De soep is ', after: '.', correct: 'heet', options: ['heet', 'groen', 'hoog'] },
    { before: 'De ', after: ' valt van de boom.', correct: 'appel', options: ['appel', 'koe', 'tafel'] },
    { before: 'Aap rijmt op ', after: '.', correct: 'schaap', options: ['schaap', 'huis', 'bal'] },
    { before: 'De zon schijnt aan de ', after: '.', correct: 'hemel', options: ['hemel', 'grond', 'tafel'] },
    { before: 'Wij gaan naar het ', after: ' zwemmen.', correct: 'zwembad', options: ['zwembad', 'dak', 'bos'] },
    { before: 'De hond ', after: ' hard.', correct: 'blaft', options: ['blaft', 'zingt', 'leest'] },
    { before: 'Ik lees een ', after: ' boek.', correct: 'leuk', options: ['leuk', 'snel', 'hoog'] },
    { before: 'De vis zwemt in het ', after: '.', correct: 'water', options: ['water', 'vuur', 'zand'] },
  ];

  const setupEl = document.getElementById('zinnen-setup');
  const playEl = document.getElementById('zinnen-play');
  const countInput = document.getElementById('zinnen-count-input');
  const startSetupBtn = document.getElementById('zinnen-start');
  const countEl = document.getElementById('zinnen-count');
  const scoreEl = document.getElementById('zinnen-score');
  const wrongStatEl = document.getElementById('zinnen-wrong');
  const activeEl = document.getElementById('zinnen-active');
  const doneEl = document.getElementById('zinnen-done');
  const finalScoreEl = document.getElementById('zinnen-final-score');
  const finalMaxEl = document.getElementById('zinnen-final-max');
  const restartRoundBtn = document.getElementById('zinnen-restart');
  const optionsEl = document.getElementById('zinnen-options');
  const messageEl = document.getElementById('zinnen-message');
  const nextBtn = document.getElementById('zinnen-next');
  const progressFill = document.getElementById('zinnen-next-fill');
  let advanceTimeout = null;

  clampInputRange(countInput, 1, 99);

  let current = null;
  let score = 0;
  let wrongTotal = 0;
  let correctCount = 0;
  let sumIndex = 0;
  let sumsPerRound = 10;
  let answered = false;
  let hadErrorThisSentence = false;

  const sentencePicker = makePicker(SENTENCES);
  function pickSentence() {
    return sentencePicker.next();
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderSentence(filled) {
    const blank = filled || '___';
    zinnenSentenceEl.innerHTML = `${current.before}<span class="blank">${blank}</span>${current.after}`;
  }

  function handleChoice(option, btn) {
    if (answered) return;

    if (option === current.correct) {
      answered = true;
      optionsEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
      btn.classList.add('correct');
      if (!hadErrorThisSentence) {
        score += 1;
        correctCount++;
        scoreEl.textContent = String(score);
      }
      messageEl.textContent = '🎉 Juist!';
      messageEl.style.color = 'var(--green)';
      renderSentence(current.correct);
      nextBtn.hidden = false;
      startAutoAdvanceBar(progressFill);
      advanceTimeout = setTimeout(newSentence, 2000);
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      hadErrorThisSentence = true;
      wrongTotal++;
      wrongStatEl.textContent = String(wrongTotal);
      messageEl.textContent = `"${option}" is niet juist, probeer nog eens`;
      messageEl.style.color = 'var(--pink)';
    }
  }

  function newSentence() {
    if (sumIndex >= sumsPerRound) {
      activeEl.hidden = true;
      doneEl.hidden = false;
      finalScoreEl.textContent = String(correctCount);
      finalMaxEl.textContent = String(sumsPerRound);
      setDoneMessage(correctCount / sumsPerRound, 'zinnen-done-emoji', 'zinnen-done-title');
      return;
    }

    sumIndex++;
    countEl.textContent = String(sumIndex);
    current = pickSentence();
    answered = false;
    hadErrorThisSentence = false;
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    renderSentence(null);
    optionsEl.innerHTML = '';
    shuffle(current.options).forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => handleChoice(option, btn));
      optionsEl.appendChild(btn);
    });
  }

  function startRound() {
    sumsPerRound = Math.min(99, Math.max(1, Number(countInput.value) || 10));
    document.getElementById('zinnen-max').textContent = String(sumsPerRound);
    score = 0;
    wrongTotal = 0;
    correctCount = 0;
    sumIndex = 0;
    scoreEl.textContent = '0';
    wrongStatEl.textContent = '0';
    setupEl.hidden = true;
    playEl.hidden = false;
    activeEl.hidden = false;
    doneEl.hidden = true;
    sentencePicker.reset();
    newSentence();
  }

  function backToSetup() {
    playEl.hidden = true;
    setupEl.hidden = false;
  }

  startSetupBtn.addEventListener('click', startRound);
  nextBtn.addEventListener('click', newSentence);
  restartRoundBtn.addEventListener('click', backToSetup);

  window.addEventListener('routechange', (e) => {
    if (e.detail.route !== 'zinnen' && !playEl.hidden) backToSetup();
  });
}
