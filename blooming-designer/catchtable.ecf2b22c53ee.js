const back=document.querySelector('.back-link');
const home=new URL('index.html',location.href);
if(document.referrer){const referrer=new URL(document.referrer);if(referrer.origin===location.origin&&(referrer.pathname===home.pathname||referrer.pathname===home.pathname.slice(0,-10))){back.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});}}
const topButton=document.querySelector('.back-to-top'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function syncTop(){const visible=scrollY>Math.min(innerHeight*.5,320);topButton.classList.toggle('is-visible',visible);topButton.disabled=!visible;}
topButton.addEventListener('click',()=>scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'}));
addEventListener('scroll',syncTop,{passive:true});addEventListener('resize',syncTop,{passive:true});syncTop();
