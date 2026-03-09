/* ============================================================
   Dartboard — SVG generator & click handler
   ============================================================ */

class Dartboard {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.cx  = 200;
    this.cy  = 200;

    // Numbers in clockwise order starting from top (20 at top)
    this.numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

    // Radii
    this.R = {
      bull:        13,   // double bull
      outerBull:   31,   // single bull
      tripleInner: 97,
      tripleOuter: 108,
      doubleInner: 160,
      doubleOuter: 172,
      label:       185,
    };

    this.clickHandler = null;
    this._render();
  }

  // ── Geometry ────────────────────────────────────────────────
  _toXY(r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [
      this.cx + r * Math.cos(rad),
      this.cy + r * Math.sin(rad),
    ];
  }

  _arcPath(r1, r2, a1, a2) {
    const [x1, y1] = this._toXY(r2, a1);
    const [x2, y2] = this._toXY(r2, a2);
    const [x3, y3] = this._toXY(r1, a2);
    const [x4, y4] = this._toXY(r1, a1);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return (
      `M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2} ` +
      `L ${x3} ${y3} A ${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`
    );
  }

  // ── SVG element helpers ─────────────────────────────────────
  _makePath(d, fill, id, dataset) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    el.setAttribute('fill', fill);
    el.setAttribute('stroke', '#0a0a0a');
    el.setAttribute('stroke-width', '0.6');
    if (id) el.id = id;
    if (dataset) Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
    return el;
  }

  _makeCircle(r, fill, id, dataset) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('cx', this.cx);
    el.setAttribute('cy', this.cy);
    el.setAttribute('r', r);
    el.setAttribute('fill', fill);
    el.setAttribute('stroke', '#0a0a0a');
    el.setAttribute('stroke-width', '0.6');
    if (id) el.id = id;
    if (dataset) Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
    return el;
  }

  _makeText(x, y, content, size = 11) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('dominant-baseline', 'middle');
    el.setAttribute('fill', '#ffffff');
    el.setAttribute('font-size', size);
    el.setAttribute('font-weight', 'bold');
    el.setAttribute('font-family', 'Nunito, sans-serif');
    el.setAttribute('pointer-events', 'none');
    el.textContent = content;
    return el;
  }

  // ── Render ──────────────────────────────────────────────────
  _render() {
    this.svg.innerHTML = '';
    const R = this.R;

    // Outer black ring + wire ring
    const outerRing = this._makeCircle(R.doubleOuter + 6, '#1a1a1a');
    this.svg.appendChild(outerRing);

    this.numbers.forEach((num, i) => {
      const a1 = i * 18 - 9;   // segment start angle
      const a2 = a1 + 18;      // segment end angle
      const isEven = i % 2 === 0;

      const singleFill = isEven ? '#f5deb3' : '#1a1a1a';  // wheat / dark
      const ringFill   = isEven ? '#c0392b' : '#27ae60';  // red  / green

      // Inner single (outerBull → tripleInner)
      this.svg.appendChild(this._makePath(
        this._arcPath(R.outerBull, R.tripleInner, a1, a2),
        singleFill,
        `seg-${num}-s-inner`,
        { number: num, multiplier: 1 }
      ));

      // Triple ring
      this.svg.appendChild(this._makePath(
        this._arcPath(R.tripleInner, R.tripleOuter, a1, a2),
        ringFill,
        `seg-${num}-t`,
        { number: num, multiplier: 3 }
      ));

      // Outer single (tripleOuter → doubleInner)
      this.svg.appendChild(this._makePath(
        this._arcPath(R.tripleOuter, R.doubleInner, a1, a2),
        singleFill,
        `seg-${num}-s-outer`,
        { number: num, multiplier: 1 }
      ));

      // Double ring
      this.svg.appendChild(this._makePath(
        this._arcPath(R.doubleInner, R.doubleOuter, a1, a2),
        ringFill,
        `seg-${num}-d`,
        { number: num, multiplier: 2 }
      ));

      // Number label
      const midAngle = (a1 + a2) / 2;
      const [lx, ly] = this._toXY(R.label, midAngle);
      this.svg.appendChild(this._makeText(lx, ly, num, 12));
    });

    // Outer bull (25, single = 1× value) — stored as number 25 multiplier 1
    this.svg.appendChild(this._makeCircle(
      R.outerBull, '#27ae60', 'seg-bull-ob',
      { number: 25, multiplier: 1 }
    ));

    // Inner bull (bull, double = 2× value) — stored as number 25 multiplier 2
    this.svg.appendChild(this._makeCircle(
      R.bull, '#c0392b', 'seg-bull-ib',
      { number: 25, multiplier: 2 }
    ));

    // Bull label
    this.svg.appendChild(this._makeText(this.cx, this.cy, '●', 9));

    // Wire overlay (thin circles for visual)
    const wireRadii = [R.outerBull, R.tripleInner, R.tripleOuter, R.doubleInner, R.doubleOuter];
    wireRadii.forEach(r => {
      const w = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      w.setAttribute('cx', this.cx);
      w.setAttribute('cy', this.cy);
      w.setAttribute('r', r);
      w.setAttribute('fill', 'none');
      w.setAttribute('stroke', '#2a2a2a');
      w.setAttribute('stroke-width', '1.5');
      w.setAttribute('pointer-events', 'none');
      this.svg.appendChild(w);
    });

    // Click listener
    this.svg.addEventListener('click', e => {
      const target = e.target.closest('[data-number]');
      if (!target || !this.clickHandler) return;
      const number     = parseInt(target.dataset.number);
      const multiplier = parseInt(target.dataset.multiplier);
      this._animateHit(target);
      this.clickHandler(number, multiplier);
    });
  }

  // ── Hit animation ────────────────────────────────────────────
  _animateHit(el) {
    el.classList.remove('seg-hit');
    // Force reflow so re-adding class restarts animation
    void el.offsetWidth;
    el.classList.add('seg-hit');
    setTimeout(() => el.classList.remove('seg-hit'), 600);
  }

  // ── Public API ───────────────────────────────────────────────
  setClickHandler(fn) {
    this.clickHandler = fn;
  }

  /**
   * Highlight specific numbers (array of ints) with a glow.
   * highlightDoubles: if true, only glow the double ring of those numbers.
   */
  highlight(numbers, highlightDoubles = false) {
    this.clearHighlights();
    if (!numbers || numbers.length === 0) return;

    this.svg.querySelectorAll('[data-number]').forEach(el => {
      const n  = parseInt(el.dataset.number);
      const m  = parseInt(el.dataset.multiplier);
      if (!numbers.includes(n)) return;
      if (highlightDoubles && m !== 2) return;
      el.style.filter = 'brightness(1.6) drop-shadow(0 0 6px #FFE66D)';
    });
  }

  clearHighlights() {
    this.svg.querySelectorAll('[data-number]').forEach(el => {
      el.style.filter = '';
    });
  }

  /** Dim segments NOT in the active list */
  dimOthers(activeNumbers) {
    this.svg.querySelectorAll('[data-number]').forEach(el => {
      const n = parseInt(el.dataset.number);
      el.style.opacity = activeNumbers.includes(n) ? '' : '0.28';
    });
  }

  resetDim() {
    this.svg.querySelectorAll('[data-number]').forEach(el => {
      el.style.opacity = '';
    });
  }
}
