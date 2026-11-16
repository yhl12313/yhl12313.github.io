const back=document.querySelector('.back-link');
const home=new URL('index.html',location.href);
if(document.referrer){const referrer=new URL(document.referrer);if(referrer.origin===location.origin&&(referrer.pathname===home.pathname||referrer.pathname===home.pathname.slice(0,-10))){back.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});}}
const topButton=document.querySelector('.back-to-top'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function syncTop(){const visible=scrollY>Math.min(innerHeight*.5,320);topButton.classList.toggle('is-visible',visible);topButton.disabled=!visible;}
topButton.addEventListener('click',()=>scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'}));
let topFrame=0;function queueTop(){if(topFrame)return;topFrame=requestAnimationFrame(()=>{topFrame=0;syncTop()})}addEventListener('scroll',queueTop,{passive:true});addEventListener('resize',queueTop,{passive:true});syncTop();

;
/* Scroll-led, one-shot sequences from the supplied CATCHTABLE reference video. */
(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window)||preference.matches)return;
 const callbacks=new Map();
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||entry.intersectionRect.height<Math.min(entry.boundingClientRect.height*.22,innerHeight*.24))continue;
   const play=callbacks.get(entry.target);if(!play)continue;
   observer.unobserve(entry.target);callbacks.delete(entry.target);play();
  }
 },{threshold:[0,.1,.2,.3,.4,.5,.7,1],rootMargin:'0px 0px -6% 0px'});
 function once(target,play){if(target){callbacks.set(target,play);observer.observe(target);}}
 function node(id){return document.querySelector('[data-design-node="'+id+'"]');}
 function prepare(target,kind,delay=0){
  if(!target)return;
  target.classList.add('ct-motion-item',kind);
  target.style.setProperty('--ct-motion-delay',delay+'ms');
 }
 function play(target){if(target)target.classList.add('ct-motion-played');}

 // Keep the existing gentle reveals outside the reference's animated diagrams.
 document.querySelectorAll('[data-reveal]:not(.research-export)').forEach(target=>{
  target.classList.add('case-reveal');once(target,()=>target.classList.add('is-visible'));
 });
 document.querySelectorAll('.research-export').forEach(figure=>{
  const bars=['327:4102','327:4104','327:4106','327:4108'].map(id=>figure.querySelector('[data-design-node="'+id+'"]>path')).filter(Boolean);
  if(bars.length){
   bars.forEach((bar,i)=>prepare(bar,'ct-motion-bar',i*110));
   const value=node('327:4113');prepare(value,'ct-motion-fade',1000);
   once(figure,()=>{bars.forEach(play);play(value);});
  }else{
   const groups=[node('327:4164'),node('327:4207'),node('327:4163')];
   groups.forEach((group,i)=>prepare(group,'ct-motion-fade',i*230));
   once(figure,()=>groups.forEach(play));
  }
 });

 // Each issue starts when its own explanation reaches the reading viewport.
 const connectors=[...document.querySelectorAll('.problem-analysis>.diagram-connector')];
 const calloutIds=[['4253','4254','4256','4255'],[],['4252'],['4257'],['4258'],['4259'],['4260']];
 document.querySelectorAll('.issue-card').forEach((card,i)=>{
  const highlights=calloutIds[i].map(id=>document.querySelector('.problem-analysis>.diagram-highlight img[src="assets/catchtable-hires-327-'+id+'.webp"]')?.parentElement).filter(Boolean);
  if(i===4){const crop=document.querySelector('.diagram-error-crop');if(crop)highlights.push(crop);}
  highlights.forEach(target=>prepare(target,'ct-motion-fade'));
  prepare(connectors[i],'ct-motion-line',160);
  prepare(card,'ct-motion-copy',420);
  once(card,()=>{highlights.forEach(play);play(connectors[i]);play(card);});
 });

 // Animate inside the SVG marker's static placement, retaining its native transform.
 const positioning=document.querySelector('.positioning-grid');
 if(positioning){
  const figures=[...positioning.querySelectorAll(':scope>figure')];
  const marker=node('358:2004')?.querySelector('image');
  const previous=node('358:2003');
  const axes=[node('358:1995'),node('358:1996')];
  figures.forEach(figure=>prepare(figure,'ct-motion-fade',350));
  axes.forEach((axis,i)=>prepare(axis,i?'ct-motion-axis-x':'ct-motion-axis-y',700));
  prepare(previous,'ct-motion-fade',1450);
  prepare(marker,'ct-motion-marker',1250);
  once(figures[0],()=>{positioning.classList.add('ct-position-played');play(figures[0]);});
  once(figures[1],()=>{play(figures[1]);axes.forEach(play);play(previous);play(marker);});
 }
 document.body.classList.add('ct-reference-motion');
 preference.addEventListener('change',event=>{
  if(!event.matches)return;
  observer.disconnect();callbacks.clear();document.body.classList.remove('ct-reference-motion');
  document.querySelectorAll('.case-reveal').forEach(target=>target.classList.add('is-visible'));
 });
})();

/* Gather and spread the existing individual exports, on tablet/desktop only. */
(() => {
 const board=document.querySelector('[data-individual-frame="358:2341"]');
 if(!board||!('IntersectionObserver' in window))return;
 const images=[...board.querySelectorAll('img')];
 const tablet=matchMedia('(min-width:768px)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let observer,resizeObserver,holdTimer,finishTimer,played=false;
 let lastWidth=0,lastHeight=0;
 const enabled=()=>tablet.matches&&!reduced.matches;
 function measure(){
  lastWidth=board.clientWidth;lastHeight=board.clientHeight;
  const positions=images.map((image,i)=>({x:lastWidth*.5-image.offsetLeft-image.offsetWidth*.5+(i%3-1)*lastWidth*.006,y:lastHeight*.5-image.offsetTop-image.offsetHeight*.5+(Math.floor(i/3)%3-1)*lastHeight*.012}));
  images.forEach((image,i)=>{
   image.style.setProperty('--component-gather-x',positions[i].x+'px');
   image.style.setProperty('--component-gather-y',positions[i].y+'px');
   image.style.setProperty('--component-spread-delay',(i%5*22)+'ms');
  });
 }
 function finish(){
  clearTimeout(holdTimer);clearTimeout(finishTimer);
  observer?.disconnect();resizeObserver?.disconnect();
  board.classList.remove('ct-components-ready','ct-components-spreading');
  images.forEach(image=>{
   image.style.removeProperty('--component-gather-x');
   image.style.removeProperty('--component-gather-y');
   image.style.removeProperty('--component-spread-delay');
  });
  board.dataset.componentsMotion=played?'settled':'static';
 }
 function prepare(){
  if(!enabled()){finish();return;}
  if(played||board.classList.contains('ct-components-ready'))return;
  measure();board.classList.add('ct-components-ready');board.dataset.componentsMotion='gathered';
  observer=new IntersectionObserver(entries=>{
   const entry=entries[0];
   if(!entry.isIntersecting||entry.intersectionRect.height<Math.min(entry.boundingClientRect.height*.28,innerHeight*.3))return;
   played=true;observer.disconnect();
   Promise.allSettled(images.map(image=>image.decode())).then(()=>{
    if(!enabled()||!board.classList.contains('ct-components-ready'))return;
    holdTimer=setTimeout(()=>{
     board.classList.add('ct-components-spreading');board.dataset.componentsMotion='spreading';
     finishTimer=setTimeout(finish,1300);
    },450);
   });
  },{threshold:[0,.15,.25,.28,.3,.4,.6,1],rootMargin:'0px 0px -8% 0px'});
  observer.observe(board);
  if('ResizeObserver' in window){
   resizeObserver=new ResizeObserver(()=>{
    if(Math.abs(board.clientWidth-lastWidth)<1&&Math.abs(board.clientHeight-lastHeight)<1)return;
    if(played)finish();else measure();
   });
   resizeObserver.observe(board);
  }
 }
 tablet.addEventListener('change',prepare);
 reduced.addEventListener('change',prepare);
 prepare();
})();

;
(()=>{const media=matchMedia('(min-width:768px)');const videos=[...document.querySelectorAll('.service-video')],visible=new Set();function update(v){if(media.matches&&!document.hidden&&visible.has(v)){if(!v.getAttribute('src')){v.src=v.dataset.src;v.load()}if(!v.ended)v.play().catch(()=>{})}else v.pause()}const io=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting,intersectionRatio})=>{if(isIntersecting&&intersectionRatio>=.25)visible.add(target);else visible.delete(target);update(target)})},{threshold:[0,.25]});videos.forEach(v=>io.observe(v));document.addEventListener('visibilitychange',()=>videos.forEach(update));media.addEventListener('change',()=>videos.forEach(update))})();