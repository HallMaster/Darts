/* ============================================================
   Dart Night! — Main Application Controller
   ============================================================ */

const PLAYER_AVATARS = ['🎯','🏆','⭐','🔥','💎','🎲','🎳','🎪'];
const PLAYER_DEFAULTS = ['Player 1','Player 2','Player 3','Player 4',
                         'Player 5','Player 6','Player 7','Player 8'];

// ── State ────────────────────────────────────────────────────
let selectedGame   = null;   // 'cricket' | 'atw' | '301' | '501' | 'killer'
let playerCount    = 2;
let game           = null;   // active game instance
let board          = null;   // Dartboard instance
let dartsThrown    = 0;      // 0..3 for current turn

// ── Utility ──────────────────────────────────────────────────
function $(id)  { return document.getElementById(id); }
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function buildPlayers() {
  const inputs = document.querySelectorAll('.player-name-input');
  return Array.from(inputs).map((inp, i) => ({
    id:   i,
    name: inp.value.trim() || PLAYER_DEFAULTS[i],
  }));
}

// ── Confetti ─────────────────────────────────────────────────
function launchConfetti() {
  const container = $('confetti-container');
  container.innerHTML = '';
  const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#a8edea','#fff'];
  for (let i = 0; i < 90; i++) {
    const el   = document.createElement('div');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${color};
      width: ${6 + Math.random() * 8}px;
      height: ${10 + Math.random() * 10}px;
      animation-duration: ${2 + Math.random() * 2.5}s;
      animation-delay: ${Math.random() * 1}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    container.appendChild(el);
  }
}

// ── HOME SCREEN ──────────────────────────────────────────────
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedGame = card.dataset.game;
    goToSetup();
  });
});

function goToSetup() {
  playerCount = 2;
  renderSetup();
  show('screen-setup');
}

function renderSetup() {
  const titles = {
    cricket: '🏏 Cricket',
    atw:     '🌍 Around the World',
    '301':   '🔢 301',
    '501':   '🔢 501',
    killer:  '💀 Killer Darts',
  };
  $('setup-game-title').textContent = titles[selectedGame] || 'Setup';
  $('player-count-display').textContent = playerCount;

  $('remove-player').disabled = playerCount <= 2;
  $('add-player').disabled    = playerCount >= 8;

  const list = $('player-names-list');
  // Preserve existing names when count changes
  const existing = Array.from(list.querySelectorAll('.player-name-input')).map(i => i.value);
  list.innerHTML = '';

  for (let i = 0; i < playerCount; i++) {
    const row = document.createElement('div');
    row.className = 'player-name-row';
    row.innerHTML = `
      <span class="player-avatar">${PLAYER_AVATARS[i]}</span>
      <input class="player-name-input" type="text"
             placeholder="${PLAYER_DEFAULTS[i]}"
             value="${existing[i] !== undefined ? existing[i] : ''}"
             maxlength="18" />
    `;
    list.appendChild(row);
  }
}

$('add-player').addEventListener('click', () => {
  if (playerCount < 8) { playerCount++; renderSetup(); }
});
$('remove-player').addEventListener('click', () => {
  if (playerCount > 2) { playerCount--; renderSetup(); }
});
$('setup-back').addEventListener('click', () => show('screen-home'));

$('start-game').addEventListener('click', () => {
  const players = buildPlayers();
  startGame(players);
});

// ── GAME STARTUP ─────────────────────────────────────────────
function startGame(players) {
  dartsThrown = 0;

  switch (selectedGame) {
    case 'cricket': game = new CricketGame(players); break;
    case 'atw':     game = new ATWGame(players);     break;
    case '301':     game = new X01Game(players, 301); break;
    case '501':     game = new X01Game(players, 501); break;
    case 'killer':  game = new KillerGame(players);  break;
  }

  // Init dartboard
  if (!board) {
    board = new Dartboard('dartboard');
  }
  board.setClickHandler(onDartHit);
  board.clearHighlights();
  board.resetDim();

  // Set header title
  const titles = {
    cricket: 'Cricket', atw: 'Around the World',
    '301': '301', '501': '501', killer: 'Killer Darts',
  };
  $('game-title').textContent = titles[selectedGame] || 'Game';

  updateUI();
  show('screen-game');
}

// ── GAME SCREEN ───────────────────────────────────────────────
$('game-back').addEventListener('click', () => {
  if (confirm('Quit the current game?')) show('screen-home');
});

$('end-turn').addEventListener('click', endTurn);
$('undo-dart').addEventListener('click', undoDart);

function onDartHit(number, multiplier) {
  if (!game || game.winner) return;

  const result = game.recordHit(number, multiplier);
  if (!result.recorded) {
    flashMessage(result.message || 'End your turn first!');
    return;
  }

  dartsThrown = Math.min(dartsThrown + 1, 3);
  updateUI();

  if (result.message) flashMessage(result.message);

  if (game.winner) {
    setTimeout(showWinScreen, 900);
    return;
  }

  // Auto end-turn after 3 darts
  if (dartsThrown >= 3) {
    setTimeout(() => {
      endTurn();
    }, 600);
  }
}

function endTurn() {
  if (!game || game.winner) return;
  game.endTurn();
  dartsThrown = 0;
  updateUI();
  flashMessage('');
}

function undoDart() {
  if (!game) return;
  const ok = game.undoLastDart();
  if (ok && dartsThrown > 0) dartsThrown--;
  updateUI();
  flashMessage('');
}

function flashMessage(msg) {
  const el = $('game-message');
  el.textContent = msg;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

// ── UI UPDATE ────────────────────────────────────────────────
function updateUI() {
  if (!game) return;

  // Turn badge
  $('turn-badge').textContent = `${game.currentPlayer.name}'s turn`;

  // Dart pips
  for (let i = 0; i < 3; i++) {
    const pip = $(`pip-${i}`);
    pip.classList.remove('active', 'thrown');
    if (i < dartsThrown)  pip.classList.add('thrown');
    if (i === dartsThrown && dartsThrown < 3) pip.classList.add('active');
  }

  // Score panel
  renderScorePanel();

  // Board highlights
  updateBoardHighlights();

  // Button state
  $('undo-dart').disabled = (game.dartsThisRound && game.dartsThisRound.length === 0);
}

function updateBoardHighlights() {
  board.clearHighlights();
  board.resetDim();

  if (selectedGame === 'cricket') {
    const active = game.getActiveCricketNumbers();
    board.dimOthers(active);
  } else if (selectedGame === 'atw') {
    const pid    = game.currentPlayer.id;
    const target = game.currentTarget(pid);
    if (target !== null) board.highlight([target]);
  } else if (selectedGame === 'killer') {
    const pid = game.currentPlayer.id;
    if (!game.killer[pid]) {
      // highlight their double
      board.highlight([game.assigned[pid]], true);
    } else {
      // highlight all other players' assigned numbers
      const others = game.players
        .filter(p => p.id !== pid && game.lives[p.id] > 0)
        .map(p => game.assigned[p.id]);
      board.highlight(others);
    }
  }
}

// ── SCORE PANEL RENDERERS ─────────────────────────────────────
function renderScorePanel() {
  const panel = $('score-panel');
  switch (selectedGame) {
    case 'cricket': panel.innerHTML = renderCricketPanel(); break;
    case 'atw':     panel.innerHTML = renderATWPanel();     break;
    case '301':
    case '501':     panel.innerHTML = renderX01Panel();     break;
    case 'killer':  panel.innerHTML = renderKillerPanel();  break;
  }
}

// Cricket ─────────────────────────────────────────────────────
function renderCricketPanel() {
  const state = game.getState();
  const { players, hits, scores, numbers, currentPid, darts } = state;

  const numberLabels = numbers.map(n => n === 25 ? 'Bull' : n);

  let html = `<div class="panel-title">Scoreboard</div>`;
  html += `<div style="overflow-x:auto">`;
  html += `<table class="cricket-table">`;

  // Header row
  html += `<tr><th class="player-th">Player</th>`;
  numberLabels.forEach(label => { html += `<th>${label}</th>`; });
  html += `<th>Pts</th></tr>`;

  // Player rows
  players.forEach(p => {
    const isCurrent = p.id === currentPid;
    html += `<tr class="${isCurrent ? 'current-row' : ''}">`;
    html += `<td class="player-name-cell" title="${p.name}">${isCurrent ? '▶ ' : ''}${p.name}</td>`;

    numbers.forEach(n => {
      const closed = game._isClosedForAll(n);
      html += `<td class="${closed ? 'num-closed' : ''}">${game.getHitMark(p.id, n)}</td>`;
    });

    html += `<td class="score-cell">${scores[p.id]}</td>`;
    html += `</tr>`;
  });

  html += `</table></div>`;

  // Dart log
  html += renderDartLog(darts);
  return html;
}

// Around the World ────────────────────────────────────────────
function renderATWPanel() {
  const state = game.getState();
  const { players, progress, currentPid, darts } = state;

  let html = `<div class="panel-title">Progress</div>`;

  players.forEach(p => {
    const isCurrent = p.id === currentPid;
    const target    = game.currentTarget(p.id);
    const pct       = game.progressPercent(p.id);
    const tLabel    = target === 25 ? 'Bull' : target === null ? 'Done!' : String(target);

    html += `<div class="player-card ${isCurrent ? 'current-player' : ''}">`;
    html += `<div class="player-card-header">
               <div class="player-card-name">${isCurrent ? '▶ ' : ''}${p.name}</div>
               <div class="atw-target">${tLabel}</div>
             </div>`;
    html += `<div class="player-card-meta">Target: ${tLabel} (${pct}%)</div>`;
    html += `<div class="atw-progress">
               <div class="atw-progress-bar" style="width:${pct}%"></div>
             </div>`;
    html += `</div>`;
  });

  html += renderDartLog(darts);
  return html;
}

// 301/501 ─────────────────────────────────────────────────────
function renderX01Panel() {
  const state = game.getState();
  const { players, remaining, startScore, currentPid, darts, bust, turnScore } = state;

  let html = `<div class="panel-title">${startScore}</div>`;

  players.forEach(p => {
    const isCurrent = p.id === currentPid;
    html += `<div class="player-card ${isCurrent ? 'current-player' : ''}">`;
    html += `<div class="player-card-header">
               <div class="player-card-name">${isCurrent ? '▶ ' : ''}${p.name}</div>
               <div class="player-card-score">${remaining[p.id]}</div>
             </div>`;
    if (isCurrent && dartsThrown > 0) {
      const indicator = bust ? '💥 BUST' : `Turn: −${turnScore}`;
      html += `<div class="player-card-meta">${indicator}</div>`;
    }
    html += `</div>`;
  });

  html += renderDartLog(darts);
  return html;
}

// Killer Darts ────────────────────────────────────────────────
function renderKillerPanel() {
  const state = game.getState();
  const { players, assigned, killer, lives, maxLives, currentPid, darts } = state;

  let html = `<div class="panel-title">Killer Darts</div>`;

  players.forEach(p => {
    const isCurrent   = p.id === currentPid;
    const isKiller    = killer[p.id];
    const livesLeft   = lives[p.id];
    const eliminated  = livesLeft <= 0;

    html += `<div class="player-card ${isCurrent ? 'current-player' : ''} ${eliminated ? 'eliminated' : ''}">`;
    html += `<div class="player-card-header">`;
    html += `<div class="player-card-name">
               ${isCurrent ? '▶ ' : ''}${p.name}
               <span class="killer-badge ${isKiller ? '' : 'pending'}">
                 ${isKiller ? '💀 KILLER' : `#${assigned[p.id]}`}
               </span>
             </div>`;
    html += `</div>`;

    // Life pips
    html += `<div class="life-pips">`;
    for (let i = 0; i < maxLives; i++) {
      html += `<div class="life-pip ${i >= livesLeft ? 'lost' : ''}"></div>`;
    }
    html += `</div>`;

    if (!isKiller && !eliminated && isCurrent) {
      html += `<div class="player-card-meta" style="margin-top:4px">Hit Double ${assigned[p.id]} to become Killer</div>`;
    }

    html += `</div>`;
  });

  html += renderDartLog(darts);
  return html;
}

// Dart log (shared) ───────────────────────────────────────────
function renderDartLog(darts) {
  if (!darts || darts.length === 0) return '';
  let html = `<div style="margin-top:16px">
    <div class="panel-title">This Turn</div>`;
  darts.forEach((d, i) => {
    html += `<div style="font-size:0.8rem;font-weight:600;color:#636E72;
                padding:3px 0;border-bottom:1px solid #DFE6E9">
               Dart ${i + 1}: ${d.display}
             </div>`;
  });
  html += `</div>`;
  return html;
}

// ── WIN SCREEN ────────────────────────────────────────────────
function showWinScreen() {
  const winner = game.winner;
  $('win-headline').textContent = `🎉 ${winner.name} Wins!`;

  // Subtitle per game
  const subs = {
    cricket: 'Cricket champion!',
    atw:     'Around the World champion!',
    '301':   '301 champion!',
    '501':   '501 champion!',
    killer:  'Last one standing!',
  };
  $('win-subtitle').textContent = subs[selectedGame] || '';

  // Final scores
  $('final-scores').innerHTML = buildFinalScores();

  launchConfetti();
  show('screen-win');
}

function buildFinalScores() {
  let html = '';
  const players = game.players;
  const wid     = game.winner.id;

  switch (selectedGame) {
    case 'cricket': {
      const s = game.getState();
      players.forEach(p => {
        html += `<div class="final-score-row ${p.id === wid ? 'winner-row' : ''}">
                   <span>${p.id === wid ? '🏆 ' : ''}${p.name}</span>
                   <span>${s.scores[p.id]} pts</span>
                 </div>`;
      });
      break;
    }
    case 'atw': {
      const s = game.getState();
      players.forEach(p => {
        html += `<div class="final-score-row ${p.id === wid ? 'winner-row' : ''}">
                   <span>${p.id === wid ? '🏆 ' : ''}${p.name}</span>
                   <span>${game.progressPercent(p.id)}%</span>
                 </div>`;
      });
      break;
    }
    case '301':
    case '501': {
      const s = game.getState();
      players.forEach(p => {
        html += `<div class="final-score-row ${p.id === wid ? 'winner-row' : ''}">
                   <span>${p.id === wid ? '🏆 ' : ''}${p.name}</span>
                   <span>${s.remaining[p.id]} left</span>
                 </div>`;
      });
      break;
    }
    case 'killer': {
      const s = game.getState();
      players.forEach(p => {
        html += `<div class="final-score-row ${p.id === wid ? 'winner-row' : ''}">
                   <span>${p.id === wid ? '🏆 ' : ''}${p.name}</span>
                   <span>${s.lives[p.id] > 0 ? `${s.lives[p.id]}❤` : 'OUT'}</span>
                 </div>`;
      });
      break;
    }
  }
  return html;
}

$('play-again').addEventListener('click', () => {
  const players = game.players;
  startGame(players);
});

$('go-home').addEventListener('click', () => show('screen-home'));
