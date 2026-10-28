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
const orbitDuration = 32000;
let orbitElapsed = 0;
let orbitFrame = null;
let previousFrameTime = null;
// Use the actual browser window height, including desktop windows with browser chrome.
function fitHeroToViewport() {
  const hero = collage.parentElement;
  hero.style.height = window.innerHeight + 'px';
  const style = getComputedStyle(hero);
  const availableHeight = Math.max(0, window.innerHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
  const aspect = window.innerWidth <= 760 ? 850 / 1200 : 740 / 1200;
  const enlargedWidth = Math.min(hero.clientWidth, availableHeight / aspect) * 1.25;
  collage.style.width = enlargedWidth + 'px';
  hero.style.height = Math.max(window.innerHeight, enlargedWidth * aspect + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) + 'px';
  hero.style.overflow = 'clip';
}
fitHeroToViewport();
addEventListener('resize', fitHeroToViewport, { passive: true });
let orbitWidth = collage.clientWidth;
let motionReady = false;

// Align the full-resolution artwork to physical pixels during movement.
const snapToPixel = value => Math.round(value * devicePixelRatio) / devicePixelRatio;

function readBloomAngle() {
  // Registered CSS angles serialize to degrees in Chromium; our orbit uses radians.
  const rotation = getComputedStyle(collage).getPropertyValue('--bloom-turn').trim();
  const value = parseFloat(rotation) || 0;
  return rotation.endsWith('deg') ? value * Math.PI / 180 : value;
}

function positionOrbit() {
  // Open through a gentle half-turn, then continue counterclockwise.
  const bloomAngle = motionReady && !reducedMotion.matches
    ? readBloomAngle()
    : 0;
  const angle = bloomAngle - orbitElapsed / orbitDuration * Math.PI * 2;
  const width = snapToPixel(orbitWidth * 280 / 1200);
  const height = snapToPixel(orbitWidth * 240 / 1200);
  collage.style.setProperty('--orbit-width', width + 'px');
  collage.style.setProperty('--orbit-height', height + 'px');
  orbitTiles.forEach((tile, index) => {
    const phase = angle - index * Math.PI / 4;
    const left = orbitWidth / 2 + Math.cos(phase) * orbitWidth * 266.666667 / 1200 - width / 2;
    const top = orbitWidth * 370 / 1200 + Math.sin(phase) * orbitWidth * 250 / 1200 - height / 2;
    tile.style.setProperty('--orbit-left', snapToPixel(left) + 'px');
    tile.style.setProperty('--orbit-top', snapToPixel(top) + 'px');
    tile.style.transformOrigin = `${50 - Math.cos(phase) * 50}% ${50 - Math.sin(phase) * 50}%`;
  });
}

function animateOrbit(time) {
  if (previousFrameTime !== null) orbitElapsed = (orbitElapsed + time - previousFrameTime) % orbitDuration;
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
// Keep the 100ms stagger with an 800ms reveal that settles without overshoot.
orbitTiles.forEach((tile, index) => {
  tile.style.setProperty('--bloom-delay', (200 + index * 100) + 'ms');
});
// Begin together only once the original artwork has decoded, including on refresh.
Promise.all([...collage.querySelectorAll('img')].map(img => img.decode().catch(() => {}))).then(() => {
  motionReady = true;
  collage.classList.add('is-orbiting');
  syncOrbitPlayback();
});
reducedMotion.addEventListener('change', syncOrbitPlayback);
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
  if (innerWidth <= 1024) {
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
