const back=document.querySelector('.back-link');
const referrer=document.referrer?new URL(document.referrer):null;
const homePath=new URL('index.html',location.href).pathname;
if(referrer&&referrer.origin===location.origin&&(referrer.pathname===homePath||referrer.pathname===homePath.replace(/index\.html$/,''))){back.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});}
// Scale the original exported diagrams without altering SVG root dimensions.
const observer=new ResizeObserver(entries=>{for(const {target,contentRect} of entries){if(target.classList.contains('glyph-box'))target.style.setProperty('--guide-scale',contentRect.width/287.641);else if(target.classList.contains('suit-word'))target.style.setProperty('--word-scale',contentRect.width/312.379);else{const img=target.querySelector('img');target.style.setProperty('--measure-scale',contentRect.width/Number(img.getAttribute('width')));}}});
document.querySelectorAll('.glyph-box,.suit-word,.measure').forEach(node=>observer.observe(node));
