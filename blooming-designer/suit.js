const back = document.querySelector('.back-link');
const referrer = document.referrer ? new URL(document.referrer) : null;
const homePath = new URL('index.html', location.href).pathname;
if (referrer && referrer.origin === location.origin &&
    (referrer.pathname === homePath || referrer.pathname === homePath.replace(/index\.html$/, ''))) {
  back.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.back();
  });
}
