/* ============================================================
   Killer Darts Game Logic
   Rules:
   1. Each player is randomly assigned a unique number (1–20)
   2. Each player starts with 5 lives
   3. Must hit the DOUBLE of your own number to become a "Killer"
   4. Once a Killer, any dart hitting another player's number
      removes 1 life from that player (regardless of single/double/triple)
   5. A player with 0 lives is eliminated
   6. Last player standing wins
   ============================================================ */

class KillerGame {
  constructor(players) {
    this.players  = players;
    this.type     = 'killer';
    this.MAX_LIVES = 5;

    this.currentPlayerIndex = 0;
    this.dartsThisRound     = [];
    this.winner             = null;

    // Assign unique random numbers 1–20 to each player
    const pool    = this._shuffle([...Array(20)].map((_, i) => i + 1));
    this.assigned = {};   // playerId → number
    this.killer   = {};   // playerId → bool
    this.lives    = {};   // playerId → int

    players.forEach((p, i) => {
      this.assigned[p.id] = pool[i];
      this.killer[p.id]   = false;
      this.lives[p.id]    = this.MAX_LIVES;
    });

    // Reverse lookup: number → playerId
    this._numToPlayer = {};
    players.forEach(p => (this._numToPlayer[this.assigned[p.id]] = p.id));
  }

  get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _alivePlayers() {
    return this.players.filter(p => this.lives[p.id] > 0);
  }

  recordHit(number, multiplier) {
    if (this.winner) return { recorded: false, message: '' };
    if (this.dartsThisRound.length >= 3) {
      return { recorded: false, message: 'End your turn first!' };
    }

    const pid = this.currentPlayer.id;

    // ── Phase 1: Become a Killer ────────────────────────────
    if (!this.killer[pid]) {
      const myNum = this.assigned[pid];
      if (number === myNum && multiplier === 2) {
        // Hit your own double → become killer!
        this.killer[pid] = true;
        this.dartsThisRound.push({
          number, multiplier,
          display: `💀 Hit D-${myNum} — YOU'RE A KILLER!`,
          effect: 'became_killer',
        });
        return { recorded: true, message: '💀 You\'re a Killer now!' };
      } else {
        // Wrong segment
        const myLabel = `D-${myNum}`;
        this.dartsThisRound.push({
          number, multiplier,
          display: `✗ Need ${myLabel} to become Killer`,
          effect: 'miss',
        });
        return { recorded: true, message: `Need Double ${myNum}` };
      }
    }

    // ── Phase 2: Killer action ──────────────────────────────
    // Check if the number belongs to another player
    const targetPid = this._numToPlayer[number];

    if (!targetPid || targetPid === pid) {
      // Hit own number or unassigned — no effect
      this.dartsThisRound.push({
        number, multiplier,
        display: `— No target hit`,
        effect: 'miss',
      });
      return { recorded: true, message: 'No target' };
    }

    // Check if target is already eliminated
    if (this.lives[targetPid] <= 0) {
      this.dartsThisRound.push({
        number, multiplier,
        display: `— ${this._playerName(targetPid)} already out`,
        effect: 'miss',
      });
      return { recorded: true, message: 'Already eliminated' };
    }

    // Remove 1 life per dart (regardless of multiplier)
    const livesLost = 1;
    this.lives[targetPid] = Math.max(0, this.lives[targetPid] - livesLost);
    const eliminated = this.lives[targetPid] === 0;

    const targetName = this._playerName(targetPid);
    this.dartsThisRound.push({
      number, multiplier,
      display: eliminated
        ? `💥 ${targetName} eliminated!`
        : `🎯 Hit ${targetName} (${this.lives[targetPid]}❤ left)`,
      effect: eliminated ? 'eliminated' : 'hit',
      targetPid,
    });

    // Check win condition
    const alive = this._alivePlayers();
    if (alive.length === 1) {
      this.winner = alive[0];
      return { recorded: true, message: `🏆 ${this.winner.name} wins!` };
    }

    return {
      recorded: true,
      message: eliminated ? `${targetName} eliminated!` : `${targetName} -1 ❤`,
    };
  }

  _playerName(pid) {
    const p = this.players.find(p => p.id === pid);
    return p ? p.name : '?';
  }

  undoLastDart() {
    if (this.dartsThisRound.length === 0) return false;
    const last = this.dartsThisRound.pop();
    const pid  = this.currentPlayer.id;

    if (last.effect === 'became_killer') {
      this.killer[pid] = false;
    } else if (last.effect === 'hit' || last.effect === 'eliminated') {
      this.lives[last.targetPid] = Math.min(this.MAX_LIVES, this.lives[last.targetPid] + 1);
    }
    this.winner = null;
    return true;
  }

  endTurn() {
    this.dartsThisRound = [];
    // Skip to next alive player
    let next = (this.currentPlayerIndex + 1) % this.players.length;
    let safety = 0;
    while (this.lives[this.players[next].id] <= 0 && safety < this.players.length) {
      next = (next + 1) % this.players.length;
      safety++;
    }
    this.currentPlayerIndex = next;
  }

  /** Numbers to highlight on the board (all assigned numbers) */
  getAllAssignedNumbers() {
    return Object.values(this.assigned);
  }

  getState() {
    return {
      players:    this.players,
      assigned:   this.assigned,
      killer:     this.killer,
      lives:      this.lives,
      maxLives:   this.MAX_LIVES,
      currentPid: this.currentPlayer.id,
      darts:      this.dartsThisRound,
      winner:     this.winner,
    };
  }
}
