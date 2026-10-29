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
  // Two readable crowns, with a small number of ribs per rounded petal.
  for (let layer = 0; layer < 2; layer++) {
    for (let petal = 0; petal < 8; petal++) {
      const ribs = layer === 0 ? 5 : 3;
      for (let line = 0; line < ribs; line++) {
        const angle = petal * Math.PI / 4 + layer * Math.PI / 8;
        const contour = 1 - line * .058;
        const points = [];
        for (let step = 0; step <= 96; step++) {
          const t = step / 96;
          const reach = Math.pow(Math.sin(Math.PI * t), .82);
          const radial = reach * contour * (layer === 0 ? 1 : .58);
          const lateral = Math.sin(t * Math.PI * 2) * reach * .31 * contour * (layer === 0 ? 1 : .58);
          points.push({ radial, lateral, z: reach * (.04 + layer * .065), t });
        }
        curves.push({points,angle,layer,delay:layer * .08 + petal * .009,
          alpha:line === 0 ? .8 : .32,weight:line === 0 ? .85 : .6});
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
    const still = reducedMotion.matches, clock = still ? 3 : age;
    hero.dataset.bloomPhase = clock < .16 ? 'anticipation' : clock < .85 ? 'burst' : clock < 2.1 ? 'forming' : 'open';
    const scale = Math.min(width * .36, height * .4);
    const cx = width / 2, cy = height / 2 - 4;
    const rx = -.12 + tiltY * .12, ry = tiltX * .14;
    const crx = Math.cos(rx), srx = Math.sin(rx), cry = Math.cos(ry), sry = Math.sin(ry);
    for (const curve of curves) {
      const local = Math.max(0, clock - curve.delay);
      const p = clamp((local - .16) / .54);
      let spread;
      if (local < .16) spread = .045 - smooth(local / .16) * .02;
      else if (local < .7) spread = .025 + (1 - Math.pow(1 - p, 4)) * 1.115;
      else {
        const settle = clamp((local - .7) / 1.2);
        spread = 1 + .14 * Math.exp(-settle * 4) * Math.cos(settle * 8) * (1 - smooth(settle));
      }
      const widthOpen = smooth((local - .26) / .6);
      const breathing = still ? 1 : 1 + Math.sin(time * .85 + curve.layer * .6) * .012 * smooth((age - 1.3) / 1);
      const cs = Math.cos(curve.angle), sn = Math.sin(curve.angle);
      context.beginPath();
      curve.points.forEach((point, i) => {
        const radial = point.radial * spread * breathing;
        const lateral = point.lateral * spread * (.06 + widthOpen * .94);
        const x = radial * cs - lateral * sn, y = radial * sn + lateral * cs;
        const z = point.z * widthOpen;
        const yy = y * crx - z * srx, zz = y * srx + z * crx;
        const xx = x * cry + zz * sry;
        const depth = -x * sry + zz * cry;
        const perspective = 1 / (1 + depth * .12);
        const px = cx + xx * scale * perspective, py = cy + yy * scale * perspective;
        if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.strokeStyle = 'rgba(0,0,0,' + curve.alpha + ')';
      context.lineWidth = curve.weight; context.stroke();
    }
    // A quiet central disc makes the radial structure read as a flower.
    const core = .012 + smooth((clock - .4) / .7) * .027;
    context.beginPath();
    context.arc(cx, cy, scale * core, 0, Math.PI * 2);
    context.fillStyle = '#111'; context.fill();
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
