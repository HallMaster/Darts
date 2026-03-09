/* ============================================================
   301 / 501 Game Logic (Straight play — no double in/out)
   - Each player starts at 301 or 501
   - Each dart subtracts its score value
   - Going below 0 = BUST (turn voided, score resets to turn start)
   - Hitting exactly 0 = WIN
   ============================================================ */

class X01Game {
  constructor(players, startScore = 501) {
    this.players    = players;
    this.type       = 'x01';
    this.startScore = startScore;

    this.currentPlayerIndex = 0;
    this.dartsThisRound     = [];
    this.turnStartScore     = startScore;  // score at beginning of this turn
    this.winner             = null;
    this.bust               = false;

    // remaining[playerId] = current score
    this.remaining = {};
    players.forEach(p => (this.remaining[p.id] = startScore));
  }

  get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  recordHit(number, multiplier) {
    if (this.winner) return { recorded: false, message: '' };
    if (this.bust)   return { recorded: false, message: 'You busted! End turn.' };
    if (this.dartsThisRound.length >= 3) {
      return { recorded: false, message: 'End your turn first!' };
    }

    const pid   = this.currentPlayer.id;
    const value = number * multiplier;
    const label = number === 25 ? (multiplier === 2 ? 'Bull' : 'Outer Bull') : String(number);
    const mult  = multiplier === 1 ? '' : multiplier === 2 ? 'D-' : 'T-';

    const newRemaining = this.remaining[pid] - value;

    if (newRemaining < 0) {
      // BUST
      this.bust = true;
      this.dartsThisRound.push({
        number, multiplier, value,
        display: `💥 ${mult}${label} (${value}) — BUST`,
        bust: true,
      });
      return { recorded: true, message: '💥 BUST! End turn.' };
    }

    this.remaining[pid] = newRemaining;
    this.dartsThisRound.push({
      number, multiplier, value,
      display: `${mult}${label} (${value}) → ${newRemaining} left`,
      bust: false,
    });

    if (newRemaining === 0) {
      this.winner = this.currentPlayer;
      return { recorded: true, message: '🎉 WINNER!' };
    }

    return { recorded: true, message: `-${value} → ${newRemaining} left` };
  }

  undoLastDart() {
    if (this.dartsThisRound.length === 0) return false;
    const last = this.dartsThisRound.pop();
    const pid  = this.currentPlayer.id;

    if (this.bust) {
      // Restore to the pre-bust score
      // We need to figure out what score was before the bust dart
      // The bust dart didn't change remaining (since we denied it), so just clear bust flag
      this.bust = false;
    } else if (!last.bust) {
      this.remaining[pid] += last.value;
    }
    this.winner = null;
    this.bust   = false;
    return true;
  }

  endTurn() {
    const pid = this.currentPlayer.id;
    if (this.bust) {
      // Revert to turn start score
      this.remaining[pid] = this.turnStartScore;
    }
    this.bust = false;
    this.dartsThisRound = [];
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    // Save turn start score for new player
    this.turnStartScore = this.remaining[this.currentPlayer.id];
  }

  turnScore() {
    return this.dartsThisRound
      .filter(d => !d.bust)
      .reduce((sum, d) => sum + d.value, 0);
  }

  getState() {
    return {
      players:     this.players,
      remaining:   this.remaining,
      startScore:  this.startScore,
      currentPid:  this.currentPlayer.id,
      darts:       this.dartsThisRound,
      winner:      this.winner,
      bust:        this.bust,
      turnScore:   this.turnScore(),
    };
  }
}
