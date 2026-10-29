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
  // Each petal is a family of closed contours, forming a fine wire surface.
  for (let layer = 0; layer < 3; layer++) {
    for (let petal = 0; petal < 9; petal++) {
      for (let line = 0; line < 7; line++) {
        const points = [];
        const angle = petal * Math.PI * 2 / 9 + layer * .24 + (line - 3) * .014;
        for (let step = 0; step <= 88; step++) {
          const t = step / 88;
          const reach = Math.pow(Math.sin(Math.PI * t), .88);
          const contour = .76 + line * .04;
          const r = reach * contour * (1 - layer * .19);
          const side = Math.sin(t * Math.PI * 2) * reach * .23 * contour;
          points.push({ x: r * Math.cos(angle) - side * Math.sin(angle),
            y: r * Math.sin(angle) + side * Math.cos(angle),
            z: Math.sin(Math.PI * t) * (.1 + layer * .13) + Math.sin(t * Math.PI * 2) * .1,
            bud: reach * (1 - layer * .13) });
        }
        curves.push({ points, delay: layer * .1 + petal * .018, layer, line });
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
  function draw() {
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width * .36, height * .43);
    const rx = -.37 + tiltY * .22, ry = tiltX * .25;
    const spin = time * .018;
    const cx = width / 2, cy = height / 2 - 4;
    const opened = reducedMotion.matches ? 1 : Math.min(age / 4.6, 1);
    for (const curve of curves) {
      const p = Math.max(0, Math.min(1, (opened - curve.delay * .28) / (1 - curve.delay * .28)));
      const ease = p * p * (3 - 2 * p);
      const spread = .065 + ease * .935;
      context.beginPath();
      curve.points.forEach((point, i) => {
        const breath = reducedMotion.matches ? 1 : 1 + Math.sin(time * .55 + curve.layer * .7) * .012 * ease;
        const x = point.x * spread * breath;
        const y = point.y * spread * breath;
        const z = point.z * ease + point.bud * (1 - ease) * .95;
        const a = x * Math.cos(spin) - y * Math.sin(spin);
        const b = x * Math.sin(spin) + y * Math.cos(spin);
        const yy = b * Math.cos(rx) - z * Math.sin(rx);
        const zz = b * Math.sin(rx) + z * Math.cos(rx);
        const xx = a * Math.cos(ry) + zz * Math.sin(ry);
        const depth = -a * Math.sin(ry) + zz * Math.cos(ry);
        const perspective = 1 / (1 + depth * .22);
        const px = cx + xx * scale * perspective, py = cy + yy * scale * perspective;
        if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.strokeStyle = 'rgba(0,0,0,' + (.24 + curve.line * .055 + curve.layer * .035) + ')';
      context.lineWidth = .65;
      context.stroke();
    }
  }
  function animate(now) {
    frame = null;
    const dt = last === null ? 0 : Math.min((now - last) / 1000, .05);
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
  replay.addEventListener('click', () => { age = 0; sync(); });
  new ResizeObserver(size).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  size(); sync();
})();
