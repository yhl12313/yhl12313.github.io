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
