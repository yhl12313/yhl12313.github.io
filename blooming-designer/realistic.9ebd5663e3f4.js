(()=>{
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const video=document.querySelector('video[data-src]');
  const desktop=matchMedia('(min-width:768px)');
  let inView=false;
  function syncVideo(){
    if(inView&&!document.hidden&&!reduced.matches&&desktop.matches){
      if(!video.getAttribute('src')){video.src=video.dataset.src;video.load()}
      video.play().catch(()=>{});
    }else video.pause();
  }
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncVideo()},{threshold:0,rootMargin:'100px 0px'}).observe(video);
  document.addEventListener('visibilitychange',syncVideo);
  reduced.addEventListener('change',syncVideo);
  desktop.addEventListener('change',syncVideo);
  const marquee=document.querySelector('.marquee-track');
  let marqueeVisible=false;
  function syncMarquee(){marquee.style.animationPlayState=marqueeVisible&&!document.hidden?'running':'paused'}
  new IntersectionObserver(entries=>{marqueeVisible=entries[0].isIntersecting;syncMarquee()}).observe(marquee.parentElement);
  document.addEventListener('visibilitychange',syncMarquee);
  const top=document.querySelector('.back-to-top');let pending=false;
  function updateTop(){pending=false;const visible=scrollY>Math.min(innerHeight*.5,320);top.classList.toggle('is-visible',visible);top.disabled=!visible}
  addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateTop)}},{passive:true});
  top.addEventListener('click',()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));updateTop();

  // Match the SUIT detail's one-shot reading reveal: 18px, 500ms, 80ms wait.
  if(!desktop.matches||reduced.matches||!('IntersectionObserver' in window))return;
  const targets=[...document.querySelectorAll('.hero,.project-overview .copy,.project-facts,.section-label,.section-heading .copy,.image-marquee,.example .copy,.example img,.visual-card,.motion-story video,.motion-story .copy,.type-poster .copy,.final-poster')];
  const pendingTargets=new Set(targets),timers=new Map();let observer,resizeFrame=0;
  targets.forEach(n=>n.classList.add('reading-reveal'));
  function show(n){n.classList.add('reading-visible');pendingTargets.delete(n);observer?.unobserve(n);clearTimeout(timers.get(n));timers.delete(n)}
  function rebuild(){
    observer?.disconnect();timers.forEach(clearTimeout);timers.clear();
    if(!desktop.matches||reduced.matches){targets.forEach(show);removeEventListener('resize',queueRebuild);return}
    observer=new IntersectionObserver(entries=>{
      for(const e of entries){
        if(!pendingTargets.has(e.target))continue;
        clearTimeout(timers.get(e.target));timers.delete(e.target);
        if(e.isIntersecting&&e.intersectionRect.height>0)timers.set(e.target,setTimeout(()=>show(e.target),80));
      }
    },{rootMargin:'0px 0px -'+Math.round(innerHeight*.12)+'px 0px',threshold:0});
    pendingTargets.forEach(n=>observer.observe(n));
  }
  function queueRebuild(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(rebuild)}
  addEventListener('resize',queueRebuild,{passive:true});desktop.addEventListener('change',rebuild);reduced.addEventListener('change',rebuild);rebuild();
})();
