/* ============================================================
   Around the World Game Logic
   - Players must hit 1 → 2 → ... → 20 → Bull (25) in order
   - Each dart: if it hits their current target, they advance
   - First to hit Bull after completing 1–20 wins
   ============================================================ */

class ATWGame {
  constructor(players) {
    this.players  = players;
    this.type     = 'atw';
    this.SEQUENCE = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25];

    this.currentPlayerIndex = 0;
    this.dartsThisRound     = [];
    this.winner             = null;

    // progress[playerId] = index into SEQUENCE (0 = needs to hit 1)
    this.progress = {};
    players.forEach(p => (this.progress[p.id] = 0));
  }

  get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  currentTarget(pid) {
    const idx = this.progress[pid];
    return idx < this.SEQUENCE.length ? this.SEQUENCE[idx] : null;
  }

  progressPercent(pid) {
    return Math.round((this.progress[pid] / this.SEQUENCE.length) * 100);
  }

  recordHit(number, multiplier) {
    if (this.winner) return { recorded: false, message: '' };
    if (this.dartsThisRound.length >= 3) {
      return { recorded: false, message: 'End your turn first!' };
    }

    const pid    = this.currentPlayer.id;
    const target = this.currentTarget(pid);
    const hit    = (number === target);
    const label  = number === 25 ? 'Bull' : String(number);

    if (hit) {
      this.progress[pid]++;
      const newTarget = this.currentTarget(pid);

      this.dartsThisRound.push({
        number, multiplier, hit: true,
        display: `✓ Hit ${label}!`,
      });

      // Win?
      if (newTarget === null) {
        this.winner = this.currentPlayer;
        return { recorded: true, message: `🎉 WINNER!` };
      }
      const nextLabel = newTarget === 25 ? 'Bull' : String(newTarget);
      return { recorded: true, message: `Hit! Next: ${nextLabel}` };
    } else {
      this.dartsThisRound.push({
        number, multiplier, hit: false,
        display: `✗ ${label} (need ${target === 25 ? 'Bull' : target})`,
      });
      return { recorded: true, message: `Need ${target === 25 ? 'Bull' : target}` };
    }
  }

  undoLastDart() {
    if (this.dartsThisRound.length === 0) return false;
    const last = this.dartsThisRound.pop();
    if (last.hit) {
      this.progress[this.currentPlayer.id]--;
    }
    this.winner = null;
    return true;
  }

  endTurn() {
    this.dartsThisRound = [];
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  getState() {
    return {
      players:    this.players,
      progress:   this.progress,
      sequence:   this.SEQUENCE,
      currentPid: this.currentPlayer.id,
      darts:      this.dartsThisRound,
      winner:     this.winner,
    };
  }
}
