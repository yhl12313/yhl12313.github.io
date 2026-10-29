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
            bud: reach * (1 - layer * .1)
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
        z: .26 * Math.sin(3 * t + phase), bud: .65 + .2 * Math.sin(t) });
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
  function draw() {
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width * .41, height * .44);
    const rx = -.48 + tiltY * .28, ry = .12 + tiltX * .32;
    const spin = time * .035;
    const cx = width / 2, cy = height / 2 - 4;
    const opened = reducedMotion.matches ? 1 : Math.min(age / 2.6, 1);
    for (const curve of curves) {
      const p = Math.max(0, Math.min(1, (opened - curve.delay * .28) / (1 - curve.delay * .28)));
      // A rapid outward sweep settles fully at 2.6 seconds.
      const ease = 1 - Math.pow(1 - p, 3);
      const spread = .025 + ease * .975;
      const breath = reducedMotion.matches ? 1 : 1 + Math.sin(time * .7 + curve.layer * .8) * .018 * ease;
      const turn = spin * (curve.layer % 2 ? -.65 : 1) + (1 - ease) * (1.5 + curve.turn);
      const cs = Math.cos(turn), sn = Math.sin(turn);
      const crx = Math.cos(rx), srx = Math.sin(rx), cry = Math.cos(ry), sry = Math.sin(ry);
      context.beginPath();
      curve.points.forEach((point, i) => {
        const x = point.x * spread * breath;
        const y = point.y * spread * breath;
        const z = point.z * ease + point.bud * (1 - ease) * 1.05;
        const a = x * cs - y * sn, b = x * sn + y * cs;
        const yy = b * crx - z * srx, zz = b * srx + z * crx;
        const xx = a * cry + zz * sry, depth = -a * sry + zz * cry;
        const perspective = 1 / (1 + depth * .24);
        const px = cx + xx * scale * perspective, py = cy + yy * scale * perspective;
        if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.strokeStyle = 'rgba(0,0,0,' + curve.alpha + ')';
      context.lineWidth = curve.weight;
      context.stroke();
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
