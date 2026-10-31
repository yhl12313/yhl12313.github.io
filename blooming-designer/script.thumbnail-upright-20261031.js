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

// One shared angle keeps all eight cards at the same angular speed.
const collage = document.querySelector('.collage');
const orbitTiles = [...collage.querySelectorAll('.tile')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = matchMedia('(max-width: 1024px), (min-width: 600px) and (max-width: 1366px) and (orientation: portrait), (horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)');
const compactOrbit = matchMedia('(max-width: 599px) and (orientation: portrait)');
const segmentedViewport = matchMedia('(horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)');
const orbitDuration = 32000;
let orbitElapsed = 0;
let orbitFrame = null;
let previousFrameTime = null;
// Use the actual browser window height, including desktop windows with browser chrome.
function fitHeroToViewport() {
  const hero = collage.parentElement;
  if (compactOrbit.matches && !segmentedViewport.matches) {
    hero.style.removeProperty('height');
    hero.style.removeProperty('overflow');
    collage.style.removeProperty('width');
    collage.style.removeProperty('height');
    return;
  }
  const style = getComputedStyle(hero);
  const viewportHeight = parseFloat(style.getPropertyValue('--hero-viewport-height')) || window.innerHeight;
  hero.style.height = viewportHeight + 'px';
  const availableHeight = Math.max(0, viewportHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
  collage.style.height = '';
  const aspect = 740 / 1200;
  const enlargedWidth = Math.min(hero.clientWidth, availableHeight / aspect) * (mobileLayout.matches ? 1 : 1.125);
  collage.style.width = enlargedWidth + 'px';
  hero.style.height = Math.max(viewportHeight, enlargedWidth * aspect + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) + 'px';
  hero.style.overflow = 'clip';
}
fitHeroToViewport();
addEventListener('resize', fitHeroToViewport, { passive: true });
let orbitWidth = collage.clientWidth;
let motionReady = false;
let bloomElapsed = 0;
const bloomDuration = 2000;

// Align the full-resolution artwork to physical pixels during movement.
const snapToPixel = value => Math.round(value * devicePixelRatio) / devicePixelRatio;

// Each thumbnail grows from one shared center, then joins the existing orbit.
function petalProgress(tile, index) {
  const p = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (bloomElapsed - index * 65 - 80) / 1250));
  const open = 1 - Math.pow(1 - p, 3);
  tile.style.setProperty('--petal-scale', .08 + open * .92);
  tile.style.setProperty('--petal-turn', '0deg');
  tile.style.opacity = Math.min(1, p * 5);
  return open;
}

function positionMobileOrbit(angle) {
  // The mobile composition shows the right side of a ring cropped by the viewport.
  // Orbit each artwork's center; scale the reveal around that same center.
  const centerX = collage.clientWidth * -.03;
  const centerY = collage.clientWidth * .875;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  orbitTiles.forEach((tile, index) => {
    const open = petalProgress(tile, index);
    const x = tile.offsetLeft + tile.offsetWidth / 2 - centerX;
    const y = tile.offsetTop + tile.offsetHeight / 2 - centerY;
    const dx = x * cos - y * sin - x;
    const dy = x * sin + y * cos - y;
    const finalX = tile.offsetLeft + tile.offsetWidth / 2 + dx;
    const finalY = tile.offsetTop + tile.offsetHeight / 2 + dy;
    tile.style.setProperty('--mobile-x', snapToPixel(dx + (collage.clientWidth * .5 - finalX) * (1 - open)) + 'px');
    tile.style.setProperty('--mobile-y', snapToPixel(dy + (collage.clientHeight * .5 - finalY) * (1 - open)) + 'px');
  });
}

function positionOrbit() {
  const angle = -orbitElapsed / orbitDuration * Math.PI * 2;
  if (compactOrbit.matches && !segmentedViewport.matches) {
    positionMobileOrbit(reducedMotion.matches ? 0 : angle + Math.PI);
    return;
  }
  const width = snapToPixel(orbitWidth * 280 / 1200);
  const height = snapToPixel(width * 299.819 / 386.059);
  collage.style.setProperty('--orbit-width', width + 'px');
  collage.style.setProperty('--orbit-height', height + 'px');
  const bounds = collage.getBoundingClientRect();
  orbitTiles.forEach((tile, index) => {
    const open = petalProgress(tile, index);
    tile.style.setProperty('--mobile-x', '0px');
    tile.style.setProperty('--mobile-y', '0px');
    const phase = angle - index * Math.PI / 4;
    const left = orbitWidth / 2 + Math.cos(phase) * orbitWidth * 266.666667 / 1200 * open - width / 2;
    const top = orbitWidth * 370 / 1200 + Math.sin(phase) * orbitWidth * 250 / 1200 * open - height / 2;
    tile.style.setProperty('--orbit-left', (snapToPixel(bounds.left + left) - bounds.left) + 'px');
    tile.style.setProperty('--orbit-top', (snapToPixel(bounds.top + top) - bounds.top) + 'px');
    tile.style.transformOrigin = '50% 50%';
  });
}

function animateOrbit(time) {
  if (previousFrameTime !== null) {
    const elapsed = time - previousFrameTime;
    const openingRemaining = Math.max(0, bloomDuration - bloomElapsed);
    bloomElapsed = Math.min(bloomDuration, bloomElapsed + elapsed);
    // Let the radial opening finish before starting the orbit.
    orbitElapsed = (orbitElapsed + Math.max(0, elapsed - openingRemaining)) % orbitDuration;
  }
  previousFrameTime = time;
  positionOrbit();
  orbitFrame = requestAnimationFrame(animateOrbit);
}

function syncOrbitPlayback() {
  if (orbitFrame !== null) cancelAnimationFrame(orbitFrame);
  orbitFrame = null;
  previousFrameTime = null;
  const playState = document.hidden ? 'paused' : 'running';
  collage.style.animationPlayState = playState;
  orbitTiles.forEach(tile => { tile.style.animationPlayState = playState; });
  positionOrbit();
  if (motionReady && !reducedMotion.matches && !document.hidden) orbitFrame = requestAnimationFrame(animateOrbit);
}

positionOrbit();
// Begin together only once the original artwork has decoded, including on refresh.
Promise.all([...collage.querySelectorAll('img')].map(img => img.decode().catch(() => {}))).then(() => {
  motionReady = true;
  collage.classList.add('is-orbiting');
  syncOrbitPlayback();
});
reducedMotion.addEventListener('change', syncOrbitPlayback);
mobileLayout.addEventListener('change', () => { fitHeroToViewport(); syncOrbitPlayback(); syncBackToTop(); });
compactOrbit.addEventListener('change', () => { fitHeroToViewport(); syncOrbitPlayback(); });
segmentedViewport.addEventListener('change', () => { fitHeroToViewport(); syncOrbitPlayback(); });
document.addEventListener('visibilitychange', syncOrbitPlayback);
const orbitResizeObserver = new ResizeObserver(() => {
  orbitWidth = collage.clientWidth;
  collage.style.setProperty('--hero-width', collage.parentElement.clientWidth + 'px');
  positionOrbit();
});
orbitResizeObserver.observe(collage);
orbitResizeObserver.observe(collage.parentElement);



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
