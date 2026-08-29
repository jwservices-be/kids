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
// CONNECT THE DOTS GAME
// ================================================================
const dotsCanvas = document.getElementById('dots-canvas');

if (dotsCanvas) {
  const ctx = dotsCanvas.getContext('2d');
  const nextNumEl = document.getElementById('dots-next-num');
  const messageEl = document.getElementById('dots-message');
  const nextBtn = document.getElementById('dots-next');
  const progressFill = document.getElementById('dots-next-fill');
  let advanceTimeout = null;

  const SHAPES = [
    {
      name: 'ster',
      points: [
        [50, 10], [59.4, 37.06], [88.04, 37.64], [65.22, 54.94], [73.51, 82.36],
        [50, 66], [26.49, 82.36], [34.78, 54.94], [11.96, 37.64], [40.6, 37.06],
      ],
    },
    {
      name: 'huis',
      points: [
        [20, 90], [80, 90], [80, 45], [50, 10], [20, 45],
      ],
    },
    {
      name: 'vis',
      points: [
        [10, 50], [35, 25], [60, 20], [85, 30], [100, 50], [85, 70], [60, 80], [35, 75],
      ],
    },
    {
      name: 'hart',
      points: [
        [50, 30], [35, 10], [15, 25], [10, 45], [30, 70], [50, 90], [70, 70], [90, 45], [85, 25], [65, 10],
      ],
    },
    {
      name: 'bloem',
      points: [
        [80, 45], [58.49, 53.49], [50, 75], [41.51, 53.49], [20, 45], [41.51, 36.51], [50, 15], [58.49, 36.51],
      ],
    },
    {
      name: 'zon',
      points: [
        [50, 8], [63, 27.48], [86.37, 29], [76, 50], [86.37, 71], [63, 72.52],
        [50, 92], [37, 72.52], [13.63, 71], [24, 50], [13.63, 29], [37, 27.48],
      ],
    },
    {
      name: 'boom',
      points: [
        [50, 10], [65, 35], [80, 35], [68, 55], [85, 55], [70, 75], [60, 75],
        [60, 90], [40, 90], [40, 75], [30, 75], [15, 55], [32, 55], [20, 35], [35, 35],
      ],
    },
    {
      name: 'vlinder',
      points: [
        [50, 50], [20, 20], [35, 45], [15, 70], [50, 58], [85, 70], [65, 45], [80, 20],
      ],
    },
    {
      name: 'ballon',
      points: [
        [50, 10], [71.2, 18.8], [80, 40], [71.2, 61.2], [50, 70], [28.8, 61.2], [20, 40], [28.8, 18.8],
        [35, 78], [50, 90], [42, 96],
      ],
    },
    {
      name: 'ijsje',
      points: [
        [30, 40], [35, 15], [50, 10], [65, 15], [70, 40], [50, 90],
      ],
    },
    {
      name: 'appel',
      points: [
        [50, 20], [74.75, 30.25], [85, 55], [74.75, 79.75], [50, 90],
        [25.25, 79.75], [15, 55], [25.25, 30.25], [48, 15], [60, 8],
      ],
    },
    {
      name: 'kat',
      points: [
        [15, 20], [28, 45], [20, 60], [30, 85], [70, 85], [80, 60],
        [72, 45], [85, 20], [65, 35], [50, 30], [35, 35],
      ],
    },
    {
      name: 'hond',
      points: [
        [15, 35], [25, 55], [20, 70], [30, 88], [70, 88], [80, 70],
        [75, 55], [85, 35], [65, 25], [50, 20], [35, 25],
      ],
    },
    {
      name: 'boot',
      points: [
        [20, 80], [80, 80], [65, 95], [35, 95], [50, 80], [50, 20], [80, 65], [52, 80],
      ],
    },
    {
      name: 'paraplu',
      points: [
        [10, 55], [25, 25], [50, 15], [75, 25], [90, 55], [50, 55], [50, 80], [65, 90],
      ],
    },
  ];

  let width, height;
  let current = null;
  let nextIndex = 0;

  function pickShape() {
    let next;
    do {
      next = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    } while (current && next.name === current.name && SHAPES.length > 1);
    return next;
  }

  function resizeCanvas() {
    const rect = dotsCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dotsCanvas.width = rect.width * dpr;
    dotsCanvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width;
    height = rect.height;
    draw();
  }

  function toAbs(point) {
    const margin = 30;
    return [
      margin + (point[0] / 100) * (width - margin * 2),
      margin + (point[1] / 100) * (height - margin * 2),
    ];
  }

  function draw() {
    if (!current || !width) return;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < nextIndex; i++) {
      const [x, y] = toAbs(current.points[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    current.points.forEach((point, i) => {
      const [x, y] = toAbs(point);
      const isDone = i < nextIndex;
      const isNext = i === nextIndex;
      ctx.beginPath();
      ctx.arc(x, y, isNext ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = isDone ? '#6BCB77' : isNext ? '#FFD93D' : '#B983FF';
      ctx.fill();

      if (!isDone) {
        ctx.fillStyle = '#2E2A4A';
        ctx.font = 'bold 13px "Comic Sans MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x, y - 16);
      }
    });
  }

  function handlePick(clientX, clientY) {
    if (!current || nextIndex >= current.points.length) return;
    const rect = dotsCanvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    const [tx, ty] = toAbs(current.points[nextIndex]);
    const dist = Math.hypot(clickX - tx, clickY - ty);

    if (dist <= 26) {
      nextIndex++;
      draw();
      if (nextIndex >= current.points.length) {
        nextNumEl.textContent = '🎉';
        messageEl.textContent = '🎉 Prachtig! Je hebt de tekening voltooid!';
        messageEl.style.color = 'var(--green)';
        nextBtn.hidden = false;
        startAutoAdvanceBar(progressFill);
        advanceTimeout = setTimeout(newShape, 2500);
      } else {
        nextNumEl.textContent = String(nextIndex + 1);
      }
    }
  }

  dotsCanvas.addEventListener('click', (e) => handlePick(e.clientX, e.clientY));
  dotsCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) handlePick(touch.clientX, touch.clientY);
  }, { passive: false });

  function newShape() {
    current = pickShape();
    nextIndex = 0;
    nextNumEl.textContent = '1';
    messageEl.textContent = '';
    nextBtn.hidden = true;
    if (advanceTimeout) clearTimeout(advanceTimeout);
    resetAutoAdvanceBar(progressFill);
    draw();
  }

  nextBtn.addEventListener('click', newShape);

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('routechange', (e) => {
    if (e.detail.route === 'stippen') resizeCanvas();
  });

  newShape();
  resizeCanvas();
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

  function pickAnimal() {
    let next;
    do {
      next = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    } while (current && next.word === current.word && ANIMALS.length > 1);
    return next;
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
  clampInputRange(maxInput, 11, 999);
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

    if (mode === 'splitsen') {
      const total = randInt(Math.ceil(maxNumber / 2), maxNumber);
      const left = randInt(1, total - 1);
      const right = total - left;
      const hideLeft = Math.random() < 0.5;
      answer = hideLeft ? left : right;
      rekenProblemEl.innerHTML = `<div class="split-tree">
        <div class="split-top">${total}</div>
        <div class="split-children"><span>${hideLeft ? '?' : left}</span><span>${hideLeft ? right : '?'}</span></div>
      </div>`;
    } else if (mode === 'optellen') {
      const a = randInt(2, maxNumber - 1);
      const b = randInt(1, maxNumber - a);
      answer = a + b;
      rekenProblemEl.textContent = `${a} + ${b} = ?`;
    } else {
      const a = randInt(2, maxNumber);
      const b = randInt(1, a);
      answer = a - b;
      rekenProblemEl.textContent = `${a} - ${b} = ?`;
    }
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
    maxNumber = Math.min(999, Math.max(11, Number(maxInput.value) || 20));
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
  ];

  const scoreEl = document.getElementById('letters-score');
  const wrongStatEl = document.getElementById('letters-wrong');
  const optionsEl = document.getElementById('letters-options');
  const messageEl = document.getElementById('letters-message');
  const nextBtn = document.getElementById('letters-next');
  const progressFill = document.getElementById('letters-next-fill');
  let advanceTimeout = null;

  let current = null;
  let score = 0;
  let wrongTotal = 0;
  let answered = false;
  let hadErrorThisWord = false;

  function pickWord() {
    let next;
    do {
      next = WORDS[Math.floor(Math.random() * WORDS.length)];
    } while (current && next === current && WORDS.length > 1);
    return next;
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

  nextBtn.addEventListener('click', newWord);
  newWord();
}
