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

    // Radii — playing field scaled to ~78% of viewBox radius so the
    // number ring (135→193) is wide enough for large, readable labels.
    this.R = {
      bull:            10,
      outerBull:       24,
      tripleInner:     76,
      tripleOuter:     84,
      doubleInner:    125,
      doubleOuter:    134,
      numberBandInner: 135,
      numberBandOuter: 193,
      label:           164,   // midpoint of number band
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
    if (id)      el.id = id;
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
    if (id)      el.id = id;
    if (dataset) Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
    return el;
  }

  _makeText(x, y, content, size, color, strokeColor) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('dominant-baseline', 'middle');
    el.setAttribute('fill', color || '#ffffff');
    el.setAttribute('font-size', size || 11);
    el.setAttribute('font-weight', '900');
    el.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
    el.setAttribute('pointer-events', 'none');
    if (strokeColor) {
      el.setAttribute('stroke', strokeColor);
      el.setAttribute('stroke-width', '2.5');
      el.setAttribute('paint-order', 'stroke fill');
    }
    el.textContent = content;
    return el;
  }

  // ── Render ──────────────────────────────────────────────────
  _render() {
    this.svg.innerHTML = '';
    const R = this.R;

    // Full board background
    const bg = this._makeCircle(R.numberBandOuter + 4, '#111111');
    this.svg.appendChild(bg);

    this.numbers.forEach((num, i) => {
      const a1 = i * 18 - 9;
      const a2 = a1 + 18;
      const isEven = i % 2 === 0;

      const singleFill = isEven ? '#f5deb3' : '#1a1a1a';
      const ringFill   = isEven ? '#c0392b' : '#27ae60';

      // Inner single
      this.svg.appendChild(this._makePath(
        this._arcPath(R.outerBull, R.tripleInner, a1, a2),
        singleFill, `seg-${num}-s-inner`, { number: num, multiplier: 1 }
      ));
      // Triple ring
      this.svg.appendChild(this._makePath(
        this._arcPath(R.tripleInner, R.tripleOuter, a1, a2),
        ringFill, `seg-${num}-t`, { number: num, multiplier: 3 }
      ));
      // Outer single
      this.svg.appendChild(this._makePath(
        this._arcPath(R.tripleOuter, R.doubleInner, a1, a2),
        singleFill, `seg-${num}-s-outer`, { number: num, multiplier: 1 }
      ));
      // Double ring
      this.svg.appendChild(this._makePath(
        this._arcPath(R.doubleInner, R.doubleOuter, a1, a2),
        ringFill, `seg-${num}-d`, { number: num, multiplier: 2 }
      ));

      // ── Number band ─────────────────────────────────────────
      // Alternating cream / dark to match the segment below — real dartboard style.
      // Cream sectors get black text; dark sectors get white text.
      const bandFill  = isEven ? '#e8d5a3' : '#1a1a1a';
      const textColor = isEven ? '#111111' : '#ffffff';

      const bandSeg = this._makePath(
        this._arcPath(R.numberBandInner, R.numberBandOuter, a1, a2),
        bandFill, null, null
      );
      bandSeg.setAttribute('stroke', '#000');
      bandSeg.setAttribute('stroke-width', '1');
      bandSeg.setAttribute('pointer-events', 'none');
      this.svg.appendChild(bandSeg);

      // Number label
      const midAngle = (a1 + a2) / 2;
      const [lx, ly] = this._toXY(R.label, midAngle);
      // strokeColor only on dark backgrounds so white text pops
      this.svg.appendChild(
        this._makeText(lx, ly, num, 19, textColor, isEven ? null : '#000')
      );
    });

    // Outer bull
    this.svg.appendChild(this._makeCircle(
      R.outerBull, '#27ae60', 'seg-bull-ob', { number: 25, multiplier: 1 }
    ));
    // Inner bull
    this.svg.appendChild(this._makeCircle(
      R.bull, '#c0392b', 'seg-bull-ib', { number: 25, multiplier: 2 }
    ));

    // Wire rings
    [R.outerBull, R.tripleInner, R.tripleOuter, R.doubleInner, R.doubleOuter, R.numberBandOuter].forEach(r => {
      const w = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      w.setAttribute('cx', this.cx);
      w.setAttribute('cy', this.cy);
      w.setAttribute('r', r);
      w.setAttribute('fill', 'none');
      w.setAttribute('stroke', '#222');
      w.setAttribute('stroke-width', '1.5');
      w.setAttribute('pointer-events', 'none');
      this.svg.appendChild(w);
    });

    // Divider lines between number sectors
    this.numbers.forEach((num, i) => {
      const a = i * 18 - 9;
      const [x1, y1] = this._toXY(R.numberBandInner, a);
      const [x2, y2] = this._toXY(R.numberBandOuter, a);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#000');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('pointer-events', 'none');
      this.svg.appendChild(line);
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
    void el.offsetWidth;
    el.classList.add('seg-hit');
    setTimeout(() => el.classList.remove('seg-hit'), 600);
  }

  // ── Public API ───────────────────────────────────────────────
  setClickHandler(fn) { this.clickHandler = fn; }

  highlight(numbers, highlightDoubles = false) {
    this.clearHighlights();
    if (!numbers || numbers.length === 0) return;
    this.svg.querySelectorAll('[data-number]').forEach(el => {
      const n = parseInt(el.dataset.number);
      const m = parseInt(el.dataset.multiplier);
      if (!numbers.includes(n)) return;
      if (highlightDoubles && m !== 2) return;
      el.style.filter = 'brightness(1.6) drop-shadow(0 0 6px #FFE66D)';
    });
  }

  clearHighlights() {
    this.svg.querySelectorAll('[data-number]').forEach(el => { el.style.filter = ''; });
  }

  dimOthers(activeNumbers) {
    this.svg.querySelectorAll('[data-number]').forEach(el => {
      const n = parseInt(el.dataset.number);
      el.style.opacity = activeNumbers.includes(n) ? '' : '0.28';
    });
  }

  resetDim() {
    this.svg.querySelectorAll('[data-number]').forEach(el => { el.style.opacity = ''; });
  }
}
