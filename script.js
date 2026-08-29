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
  let width, height;
  let basketX = 0;
  const basketWidth = 70;
  const basketHeight = 26;
  let stars = [];
  let score = 0;
  let timeLeft = GAME_TIME;
  let running = false;
  let rafId = null;
  let timerId = null;
  let lastSpawn = 0;

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
      speed: 1.5 + Math.random() * 2 + Math.min(6, score * 0.05),
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

    if (timestamp - lastSpawn > 700) {
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
      return star.y < height + 30;
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
    timeLeft = GAME_TIME;
    stars = [];
    lastSpawn = 0;
    basketX = width / 2;
    scoreEl.textContent = '0';
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
      <p style="font-size:1.4rem;font-weight:bold;">🎉 Klaar! Score: ${score}</p>
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

  const wordEl = document.getElementById('guess-word');
  const lettersEl = document.getElementById('guess-letters');
  const messageEl = document.getElementById('guess-message');
  const nextBtn = document.getElementById('guess-next');

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let current = null;
  let revealed = [];
  let wrongCount = 0;

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
        messageEl.textContent = '🎉 Goed geraden!';
        messageEl.style.color = 'var(--green)';
        lettersEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
      }
    } else {
      btn.classList.add('wrong');
      wrongCount++;
      messageEl.textContent = 'Probeer nog eens!';
      messageEl.style.color = 'var(--pink)';
    }
  }

  function newRound() {
    current = pickAnimal();
    revealed = current.word.split('').map(() => false);
    wrongCount = 0;
    guessEmojiEl.textContent = current.emoji;
    messageEl.textContent = '';
    renderWord();
    renderLetters();
  }

  nextBtn.addEventListener('click', newRound);
  newRound();
}
