const back=document.querySelector('.back-link');
const referrer=document.referrer?new URL(document.referrer):null;
const homePath=new URL('index.html',location.href).pathname;
if(referrer&&referrer.origin===location.origin&&(referrer.pathname===homePath||referrer.pathname===homePath.replace(/index\.html$/,''))){back.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});}
// Scale the original exported diagrams without altering SVG root dimensions.
const observer=new ResizeObserver(entries=>{for(const {target,contentRect} of entries){if(target.classList.contains('glyph-box'))target.style.setProperty('--guide-scale',contentRect.width/287.641);else if(target.classList.contains('suit-word'))target.style.setProperty('--word-scale',contentRect.width/312.379);else{const img=target.querySelector('img');target.style.setProperty('--measure-scale',contentRect.width/Number(img.getAttribute('width')));}}});
document.querySelectorAll('.glyph-box,.suit-word,.measure').forEach(node=>observer.observe(node));

const backToTop=document.querySelector('.back-to-top');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function syncBackToTop(){const visible=scrollY>Math.min(innerHeight*.5,320);backToTop.hidden=false;backToTop.classList.toggle('is-visible',visible);backToTop.disabled=!visible;}
backToTop.addEventListener('click',()=>scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'}));
addEventListener('scroll',syncBackToTop,{passive:true});addEventListener('resize',syncBackToTop,{passive:true});syncBackToTop();


// Reveal whole characters without changing line breaks or specimen geometry.
const specimen=document.querySelector('.type-specimen');
if(specimen&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const label=specimen.textContent;
 const characters=[];
 const fragment=document.createDocumentFragment();
 for(const node of [...specimen.childNodes]){
  if(node.nodeType===Node.TEXT_NODE){
   for(const character of Array.from(node.textContent)){
    const span=document.createElement('span');
    span.className='specimen-character';span.textContent=character;span.setAttribute('aria-hidden','true');
    characters.push(span);fragment.append(span);
   }
  }else fragment.append(node.cloneNode(true));
 }
 specimen.setAttribute('aria-label',label);specimen.replaceChildren(fragment);
 const revealObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  revealObserver.disconnect();
  let started;
  function reveal(now){
   if(started===undefined)started=now;
   const visible=Math.min(characters.length,Math.floor((now-started)/55)+1);
   for(let i=0;i<visible;i++)characters[i].classList.add('is-written');
   if(visible<characters.length)requestAnimationFrame(reveal);
  }
  requestAnimationFrame(reveal);
 },{threshold:0,rootMargin:'0px 0px -10% 0px'});
 revealObserver.observe(specimen);
}
