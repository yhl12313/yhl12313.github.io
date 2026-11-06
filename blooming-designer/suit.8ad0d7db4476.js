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


// Type Hangul through initial consonant, vowel, and final consonant composition.
const specimen=document.querySelector('.type-specimen');
if(specimen&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const originalContent=[...specimen.childNodes].map(node=>node.cloneNode(true));
 const initials=Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
 const steps=[],fragment=document.createDocumentFragment();
 const label=specimen.innerText;
 for(const node of [...specimen.childNodes]){
  if(node.nodeType!==Node.TEXT_NODE){fragment.append(node.cloneNode(true));continue;}
  for(const character of node.textContent.match(/--|[\s\S]/gu)||[]){
   const slot=document.createElement('span');
   slot.style.cssText='display:inline-grid;vertical-align:baseline';
   slot.setAttribute('aria-hidden','true');
   const ghost=document.createElement('span');
   ghost.textContent=character;ghost.style.cssText='grid-area:1/1;visibility:hidden';
   const ink=document.createElement('span');
   ink.style.cssText='grid-area:1/1';
   slot.append(ghost,ink);fragment.append(slot);
   const code=character.codePointAt(0)-0xAC00;
   if(code>=0&&code<11172){
    const initial=Math.floor(code/588),vowel=Math.floor(code%588/28),final=code%28;
    steps.push([ink,initials[initial]],[ink,String.fromCodePoint(0xAC00+initial*588+vowel*28)]);
    if(final)steps.push([ink,character]);
   }else steps.push([ink,character]);
  }
 }
 specimen.setAttribute('aria-label',label);specimen.replaceChildren(fragment);
 const revealObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  revealObserver.disconnect();let started,written=0;
  function type(now){
   if(started===undefined)started=now;
   const count=Math.min(steps.length,Math.floor((now-started)/65)+1);
   while(written<count){const [ink,text]=steps[written++];ink.textContent=text;}
   if(written<steps.length)requestAnimationFrame(type);
   else{specimen.replaceChildren(...originalContent);specimen.removeAttribute('aria-label');}
  }
  requestAnimationFrame(type);
 },{threshold:0,rootMargin:'0px 0px -10% 0px'});
 document.fonts.load('500 140px "SUIT Specimen"','디자이너를 위한 ㄷㅈㅇ 0123456789').then(()=>revealObserver.observe(specimen));
}
