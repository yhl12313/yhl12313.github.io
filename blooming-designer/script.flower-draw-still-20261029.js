const links = [...document.querySelectorAll('.header nav a')];
const sections = links.map(link => document.querySelector(link.getAttribute('href')));
function updateNavigation() {
  let current = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= innerHeight * .4) current = section;
  links.forEach(link => {
    const active = link.hash === '#' + current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = matchMedia('(max-width: 1024px), (min-width: 600px) and (max-width: 1366px) and (orientation: portrait), (horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)');
// Anchor the biography grid to the portrait seam rather than paragraph height.
const biography = document.querySelector('.about');
const introduction = biography.querySelector('.introduction');
const upperPortrait = biography.querySelector('.portrait:first-child');
function syncBiographyGrid() {
  if (mobileLayout.matches) {
    biography.style.removeProperty('--resume-space');
    return;
  }
  const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
  const baselineOffset = 6.875 * scale; // Original 1280px distance below the portrait seam.
  const space = upperPortrait.getBoundingClientRect().bottom - introduction.getBoundingClientRect().bottom + baselineOffset;
  biography.style.setProperty('--resume-space', Math.max(0, space) + 'px');
}
const biographyObserver = new ResizeObserver(syncBiographyGrid);
[upperPortrait, introduction, biography.querySelector('.identity')].forEach(element => biographyObserver.observe(element));
addEventListener('resize', syncBiographyGrid, { passive: true });
document.fonts.ready.then(syncBiographyGrid);
syncBiographyGrid();

// Follow the viewport after the visitor leaves the top of the page.
const backToTop = document.querySelector('.back-to-top');
function syncBackToTop() {
  backToTop.hidden = !mobileLayout.matches;
  const visible = mobileLayout.matches && window.scrollY > Math.min(window.innerHeight * .5, 320);
  backToTop.classList.toggle('is-visible', visible);
  backToTop.disabled = !visible;
}
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
addEventListener('scroll', syncBackToTop, { passive: true });
addEventListener('resize', syncBackToTop, { passive: true });
syncBackToTop();

(() => {
  const hero = document.querySelector('.flower-stage');
  const canvas = hero.querySelector('canvas');
  const context = canvas.getContext('2d');
  const replay = hero.querySelector('.flower-replay');
  if (!context) { replay.hidden = true; return; }
  let width = 0, height = 0, frame = null, visible = true;
  let age = 0, last = null;
  const curves = [];
  // Dense contour families keep two clear crowns while unfolding in offset waves.
  for (let layer = 0; layer < 2; layer++) {
    for (let petal = 0; petal < 8; petal++) {
      const ribs = layer === 0 ? 20 : 12;
      for (let line = 0; line < ribs; line++) {
        const angle = petal * Math.PI / 4 + layer * Math.PI / 8;
        const contour = 1 - line * (layer === 0 ? .019 : .025);
        const points = [];
        for (let step = 0; step <= 96; step++) {
          const t = step / 96;
          const reach = Math.pow(Math.sin(Math.PI * t), .82);
          const radial = .026 + reach * contour * (layer === 0 ? 1 : .61);
          const lateral = Math.sin(t * Math.PI * 2) * reach * .31 * contour * (layer === 0 ? 1 : .58);
          points.push({ radial, lateral, z: reach * (.035 + layer * .09 + line * .002), t });
        }
        curves.push({points,angle,layer,line,
          delay:layer * .13 + ((petal * 3) % 8) * .025 + line * .012,
          duration:1.08 + (petal % 3) * .055 + line * .012,
          alpha:line === 0 ? .65 : .17 + (line % 4) * .018,
          weight:line === 0 ? .75 : .48});
      }
    }
  }
  function size() {
    const box = hero.getBoundingClientRect();
    width = box.width; height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const p = clamp(n); return p * p * (3 - 2 * p); };
  function draw() {
    context.clearRect(0, 0, width, height);
    const still = reducedMotion.matches, clock = still ? 4 : age;
    hero.dataset.bloomPhase = clock < 2.4 ? 'drawing' : 'open';
    const scale = Math.min(width * .36, height * .4);
    const cx = width / 2, cy = height / 2 - 4;
    const rx = -.12, ry = 0;
    const crx = Math.cos(rx), srx = Math.sin(rx), cry = Math.cos(ry), sry = Math.sin(ry);
    for (const curve of curves) {
      const local = Math.max(0, clock - curve.delay);
      const p = clamp(local / curve.duration);
      if (p <= 0) continue;
      // Reveal the actual line from its root; no scaling, spring or overshoot.
      const reveal = 1 - Math.pow(1 - p, 2.2);
      const unfurl = smooth(local / (curve.duration * .85));
      const phase = Math.min(clock, 2.4) * .78 + curve.angle * 1.7 + curve.line * .13 + curve.layer * .9;
      const movement = still ? 0 : 1 - smooth((clock - 1.2) / 1.2);
      const coordinates = curve.points.map(point => {
        const envelope = Math.sin(point.t * Math.PI);
        const bend = still ? 0 : Math.sin(phase + point.t * 3.8) * envelope * .075 * movement;
        const angle = curve.angle + bend + (1 - unfurl) * .065 * (curve.layer ? -1 : 1);
        const cs = Math.cos(angle), sn = Math.sin(angle);
        const flow = still ? 0 : Math.sin(phase + point.t * 5.2) * envelope * .035 * movement;
        const radial = point.radial * (1 + flow);
        const widen = still ? 1 : 1 + Math.sin(phase * .81 + point.t * 4.1) * envelope * .1 * movement;
        const lateral = point.lateral * (.24 + unfurl * .76) * widen;
        const x = radial * cs - lateral * sn, y = radial * sn + lateral * cs;
        const depthWave = still ? 0 : Math.sin(phase * .92 + point.t * 4.6) * envelope * .075 * movement;
        const z = point.z * unfurl + depthWave;
        const yy = y * crx - z * srx, zz = y * srx + z * crx;
        const xx = x * cry + zz * sry, depth = -x * sry + zz * cry;
        const perspective = 1 / (1 + depth * .12);
        return [cx + xx * scale * perspective, cy + yy * scale * perspective];
      });
      // Both edges trace outward together and meet at the petal tip.
      const half = (coordinates.length - 1) / 2;
      const extent = half * reveal;
      const whole = Math.floor(extent), fraction = extent - whole;
      context.beginPath();
      for (const direction of [1,-1]) {
        const start = direction === 1 ? 0 : coordinates.length - 1;
        context.moveTo(coordinates[start][0], coordinates[start][1]);
        for (let i = 1; i <= whole; i++) {
          const q = coordinates[start + i * direction];
          context.lineTo(q[0], q[1]);
        }
        if (fraction > 0 && whole < half) {
          const q = coordinates[start + whole * direction];
          const r = coordinates[start + (whole + 1) * direction];
          context.lineTo(q[0] + (r[0] - q[0]) * fraction, q[1] + (r[1] - q[1]) * fraction);
        }
      }
      context.strokeStyle = 'rgba(0,0,0,' + curve.alpha * smooth(local / .12) + ')';
      context.lineWidth = curve.weight;
      context.lineCap = 'round'; context.lineJoin = 'round';
      context.stroke();
    }
  }
  function animate(now) {
    frame = null;
    const dt = last === null ? 0 : Math.max(0, (now - last) / 1000);
    last = now; age = Math.min(2.4, age + dt);
    draw();
    if (age < 2.4 && visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; last = null;
    replay.hidden = reducedMotion.matches;
    if (reducedMotion.matches) draw();
    else if (age >= 2.4) draw();
    else if (visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  replay.addEventListener('click', () => { age = 0; sync(); });
  new ResizeObserver(size).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  size(); sync();
})();
