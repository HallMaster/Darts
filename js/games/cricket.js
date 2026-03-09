/* ============================================================
   Cricket Game Logic
   Numbers: 15, 16, 17, 18, 19, 20, Bull (25)
   - Hit each number 3 times to "open" it
   - Once open, score points by hitting it again
     (only if not all players have opened it yet)
   - Win: all numbers opened AND highest score (or tied highest)
   ============================================================ */

class CricketGame {
  constructor(players) {
    this.players  = players;
    this.type     = 'cricket';
    this.NUMBERS  = [20, 19, 18, 17, 16, 15, 25]; // display order
    this.currentPlayerIndex = 0;
    this.dartsThisRound     = [];  // { number, multiplier, scored, display }
    this.winner             = null;

    // hits[playerId][number] = 0..3  (3 = opened)
    // scores[playerId] = int
    this.hits   = {};
    this.scores = {};
    players.forEach(p => {
      this.hits[p.id]   = {};
      this.scores[p.id] = 0;
      this.NUMBERS.forEach(n => (this.hits[p.id][n] = 0));
    });
  }

  get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  recordHit(number, multiplier) {
    if (this.winner) return { recorded: false, message: '' };
    if (this.dartsThisRound.length >= 3) {
      return { recorded: false, message: 'End your turn first!' };
    }

    // Ignore numbers not relevant to cricket
    if (!this.NUMBERS.includes(number)) {
      this.dartsThisRound.push({
        number, multiplier, scored: 0,
        display: `${number} — miss (not cricket)`,
        valid: false,
      });
      return { recorded: true, message: 'Not a cricket number' };
    }

    const pid = this.currentPlayer.id;
    let hitsLeft = multiplier;
    let scored   = 0;
    const prevHits = this.hits[pid][number];

    // Fill up to 3 marks first
    if (prevHits < 3) {
      const toOpen = Math.min(hitsLeft, 3 - prevHits);
      this.hits[pid][number] = Math.min(3, prevHits + hitsLeft);
      hitsLeft -= toOpen;
    }

    // Any remaining count as score (if number still open for scoring)
    if (hitsLeft > 0) {
      const closedForAll = this._isClosedForAll(number);
      if (!closedForAll) {
        scored = number === 25 ? 25 * hitsLeft : number * hitsLeft;
        this.scores[pid] += scored;
      }
    }

    const label = number === 25 ? 'Bull' : String(number);
    const mult  = multiplier === 1 ? '' : multiplier === 2 ? 'D-' : 'T-';
    this.dartsThisRound.push({
      number, multiplier, scored,
      display: `${mult}${label}${scored > 0 ? ` (+${scored})` : ''}`,
      valid: true,
    });

    this._checkWin();
    return { recorded: true, message: scored > 0 ? `+${scored} pts` : '' };
  }

  _isClosedForAll(number) {
    return this.players.every(p => this.hits[p.id][number] >= 3);
  }

  _checkWin() {
    const pid = this.currentPlayer.id;
    // Must have all numbers opened
    const allOpen = this.NUMBERS.every(n => this.hits[pid][n] >= 3);
    if (!allOpen) return;
    // Must have highest or tied score
    const myScore = this.scores[pid];
    const isHighest = this.players.every(p => this.scores[p.id] <= myScore);
    if (isHighest) this.winner = this.currentPlayer;
  }

  undoLastDart() {
    if (this.dartsThisRound.length === 0) return false;
    const last = this.dartsThisRound.pop();
    if (!last.valid) return true;
    const pid = this.currentPlayer.id;
    // Reverse score
    this.scores[pid] -= last.scored;
    // Reverse hits (approximate — works correctly for most cases)
    const n = last.number;
    this.hits[pid][n] = Math.max(0, this.hits[pid][n] - last.multiplier);
    this.winner = null;
    return true;
  }

  endTurn() {
    this.dartsThisRound = [];
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this._checkWin(); // re-check in case of edge cases
  }

  // ── Rendering helpers ────────────────────────────────────────
  getHitMark(pid, number) {
    const h = this.hits[pid][number];
    if (h === 0) return '';
    if (h === 1) return '<span class="hit-mark">╱</span>';
    if (h === 2) return '<span class="hit-mark">✕</span>';
    return '<span class="hit-mark">⊗</span>';
  }

  /** Numbers still active (not closed for all players) */
  getActiveCricketNumbers() {
    return this.NUMBERS.filter(n => !this._isClosedForAll(n));
  }

  getState() {
    return {
      players:     this.players,
      hits:        this.hits,
      scores:      this.scores,
      numbers:     this.NUMBERS,
      currentPid:  this.currentPlayer.id,
      darts:       this.dartsThisRound,
      winner:      this.winner,
    };
  }
}
