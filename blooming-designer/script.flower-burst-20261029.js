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
  let age = 0, last = null, time = 0, pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
  const curves = [];
  // Four interleaved crowns: twisting ribbon petals with independently opening ribs.
  for (let layer = 0; layer < 4; layer++) {
    const petals = 11 + layer;
    for (let petal = 0; petal < petals; petal++) {
      for (let line = 0; line < 7; line++) {
        const points = [];
        const angle = petal * Math.PI * 2 / petals + layer * .39 + (line - 3) * .025;
        for (let step = 0; step <= 112; step++) {
          const t = step / 112, wave = Math.sin(Math.PI * t);
          const reach = Math.pow(wave, .78);
          const contour = .74 + line * .043;
          const r = reach * contour * (1 - layer * .13);
          const twist = angle + Math.sin(t * Math.PI * 2) * (.38 + layer * .08);
          const side = Math.sin(t * Math.PI * 2) * reach * (.26 + layer * .035) * contour;
          points.push({
            x: r * Math.cos(twist) - side * Math.sin(twist),
            y: r * Math.sin(twist) + side * Math.cos(twist),
            z: wave * (.16 + layer * .1) + Math.sin(t * Math.PI * 2 + angle) * wave * .23,
            bud: reach * (1 - layer * .1), t
          });
        }
        curves.push({ points, delay: layer * .09 + petal * .009, layer,
          alpha: .14 + line * .027, weight: .55, turn: angle * .1 });
      }
    }
  }
  // Fine toroidal filaments thread through the petals, giving the flower a woven core.
  for (let strand = 0; strand < 48; strand++) {
    const points = [], phase = strand * Math.PI * 2 / 48;
    for (let step = 0; step <= 144; step++) {
      const t = step / 144 * Math.PI * 2;
      const radius = .56 + .22 * Math.cos(3 * t + phase);
      const angle = 2 * t + phase;
      points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle),
        z: .26 * Math.sin(3 * t + phase), bud: .65 + .2 * Math.sin(t), t: step / 144 });
    }
    curves.push({ points, delay: .2 + strand * .003, layer: 4,
      alpha: .1 + (strand % 4) * .018, weight: .45, turn: phase * .08 });
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
    const still = reducedMotion.matches;
    const clock = still ? 3 : age;
    hero.dataset.bloomPhase = clock < .24 ? 'anticipation' : clock < .85 ? 'burst' : clock < 2.7 ? 'forming' : 'open';
    const scale = Math.min(width * .37, height * .4);
    const life = still ? 0 : smooth((age - 1.4) / 1.3);
    const rx = -.44 + tiltY * .32 + Math.sin(time * .37) * .19 * life;
    const ry = .12 + tiltX * .4 + Math.sin(time * .29) * .26 * life;
    const crx = Math.cos(rx), srx = Math.sin(rx), cry = Math.cos(ry), sry = Math.sin(ry);
    const cx = width / 2, cy = height / 2 - 4;
    function project(x, y, z) {
      const yy = y * crx - z * srx, zz = y * srx + z * crx;
      const xx = x * cry + zz * sry, depth = -x * sry + zz * cry;
      const perspective = 1 / (1 + depth * .2);
      return [cx + xx * scale * perspective, cy + yy * scale * perspective];
    }
    for (const curve of curves) {
      const local = Math.max(0, clock - curve.delay * .35);
      const launch = clamp((local - .24) / .52);
      const settle = smooth((local - .76) / 1.72);
      // Anticipation -> explosive stretch -> overshoot -> damped follow-through.
      let spread, squash;
      if (local < .24) {
        const compress = smooth(local / .24);
        spread = .075 - compress * .045; squash = 1 + compress * .5;
      } else if (local < .76) {
        const punch = 1 - Math.pow(1 - launch, 4);
        spread = .03 + punch * 1.48; squash = 1.5 - punch * .75;
      } else {
        const u = (local - .76) / 1.72;
        spread = 1 + .51 * Math.exp(-u * 4.5) * Math.cos(u * 8) * (1 - smooth(u));
        squash = 1 - .25 * Math.exp(-u * 5) * Math.cos(u * 9) * (1 - smooth(u));
      }
      const scatter = Math.sin(Math.PI * launch) * (1 - settle);
      const after = still ? 0 : Math.exp(-Math.max(0, local - .76) * 2) * Math.sin(Math.max(0, local - .76) * 12) * (1 - settle);
      const rotation = (still ? 0 : time * .055) * (curve.layer % 2 ? -.6 : 1)
        + (1 - settle) * (2.2 + curve.turn) * (1 - launch) + after * .24;
      const cs = Math.cos(rotation), sn = Math.sin(rotation);
      const sway = Math.sin(time * .85 + curve.turn * 9) * .07 * life;
      context.beginPath();
      curve.points.forEach((point, i) => {
        const ripple = still ? 0 : Math.sin(point.t * 9 - time * 1.2 + curve.turn * 7) * .055 * life;
        const arc = Math.sin(point.t * Math.PI);
        const breadth = 1 + sway + ripple;
        let x = point.x * spread * breadth;
        let y = point.y * spread * squash * (1 - ripple);
        let z = point.z * smooth(launch) + point.bud * (1 - smooth(launch)) * 1.3;
        // Unequal curved flight paths break the enclosing circular silhouette.
        x += Math.cos(curve.turn * 12) * arc * scatter * .44;
        y += Math.sin(curve.turn * 12) * arc * scatter * .44;
        z += Math.sin(point.t * 6.28 + curve.turn * 9) * (scatter * .5 + after * .24);
        z += Math.sin(time * .7 + point.t * 7 + curve.layer) * arc * .12 * life;
        const p = project(x * cs - y * sn, x * sn + y * cs, z);
        if (i === 0) context.moveTo(p[0], p[1]); else context.lineTo(p[0], p[1]);
      });
      const burstWeight = 1 + scatter * .5;
      context.strokeStyle = 'rgba(0,0,0,' + curve.alpha * (1 - scatter * .42) + ')';
      context.lineWidth = curve.weight * burstWeight;
      context.stroke();
    }
    // Outward filaments lead the bloom, then dissolve as the petals find their form.
    if (!still && age > .22 && age < 2.4) {
      for (let i = 0; i < 76; i++) {
        const t = clamp((age - .22 - (i % 9) * .018) / 1.7);
        if (t <= 0 || t >= 1) continue;
        const fly = 1 - Math.pow(1 - t, 3);
        const angle = i * 2.399963;
        context.beginPath();
        for (let k = 0; k <= 28; k++) {
          const u = k / 28;
          const radius = (.08 + fly * (1.25 + (i % 7) * .075)) * (1 - u * .3);
          const bend = angle + (1 - u) * fly * .64 + Math.sin(u * Math.PI) * .2;
          const p = project(Math.cos(bend) * radius, Math.sin(bend) * radius,
            Math.sin(angle * 3 + u * 2) * .26 * fly);
          if (k === 0) context.moveTo(p[0], p[1]); else context.lineTo(p[0], p[1]);
        }
        context.strokeStyle = 'rgba(0,0,0,' + Math.sin(Math.PI * t) * (1 - t) * .24 + ')';
        context.lineWidth = .55; context.stroke();
      }
    }
  }
  function animate(now) {
    frame = null;
    const dt = last === null ? 0 : Math.max(0, (now - last) / 1000);
    last = now; age += dt; time += dt;
    tiltX += (pointerX - tiltX) * .045; tiltY += (pointerY - tiltY) * .045;
    draw();
    if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; last = null;
    replay.hidden = reducedMotion.matches;
    if (reducedMotion.matches) { time = 0; tiltX = 0; tiltY = 0; draw(); }
    else if (visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  hero.addEventListener('pointermove', event => {
    const box = hero.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width * 2 - 1;
    pointerY = (event.clientY - box.top) / box.height * 2 - 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  replay.addEventListener('click', () => { age = 0; time = 0; sync(); });
  new ResizeObserver(size).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  size(); sync();
})();
