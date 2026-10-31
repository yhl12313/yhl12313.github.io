(() => {
  const key = 'blooming-designer:scroll';
  const navigation = performance.getEntriesByType('navigation')[0];
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(key)); } catch {}
  const shouldRestore = navigation?.type === 'reload' && saved &&
    saved.url === location.pathname + location.search && Number.isFinite(saved.y);
  let pending = !!shouldRestore;
  const originalUrl = location.href;
  const originalRestoration = history.scrollRestoration;
  function putHashBack() {
    if (location.href !== originalUrl) history.replaceState(history.state, '', originalUrl);
  }
  if (pending) {
    history.scrollRestoration = 'manual';
    // A stale #bloom or #about must not override the actual pre-refresh position.
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    const cancel = () => { pending = false; putHashBack(); history.scrollRestoration = originalRestoration; };
    ['wheel','touchstart','pointerdown','keydown'].forEach(type =>
      addEventListener(type, cancel, {once:true, passive:true}));
    addEventListener('load', async () => {
      await document.fonts.ready;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!pending) return;
        window.scrollTo({left:saved.x || 0, top:saved.y, behavior:'instant'});
        putHashBack();
        pending = false;
        history.scrollRestoration = originalRestoration;
      }));
    }, {once:true});
  }
  addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        url:location.pathname + location.search, x:scrollX, y:scrollY
      }));
    } catch {}
  });
})();