(()=>{
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const video=document.querySelector('video[data-src]');
  const desktop=matchMedia('(min-width:768px)');
  // Request the poster shortly before it can be seen, not on initial page load.
  if(video.dataset.poster){
    const posterObserver=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){video.poster=video.dataset.poster;posterObserver.disconnect()}
    },{rootMargin:'1000px 0px',threshold:0});posterObserver.observe(video);
  }
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
  const targets=[...document.querySelectorAll('.section-label,.section-heading .copy,.image-marquee,.example .copy,.example img,.visual-card,.motion-story video,.motion-story .copy,.type-poster .copy,.final-poster')];
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

;(()=>{
// Source states: Figma 459:708 / 459:709. Time is in milliseconds.
const TYPE_HOLD=1200,TYPE_MOVE=1600,TYPE_CYCLE=2*(TYPE_HOLD+TYPE_MOVE);
function extremeEase(x){
  if(x<=0)return 0;if(x>=1)return 1;
  // Exact inverse of cubic-bezier(1,0,0,1): x=.5+4*(u-.5)^3.
  const u=.5+Math.cbrt((x-.5)/4);
  return u*u*(3-2*u);
}
function typeMotionAt(time){
  const t=((time%TYPE_CYCLE)+TYPE_CYCLE)%TYPE_CYCLE;
  let amount=0,cohesion=false,phase='dispersion-hold',progress=0;
  if(t>=TYPE_HOLD&&t<TYPE_HOLD+TYPE_MOVE){
    phase='contract';progress=(t-TYPE_HOLD)/TYPE_MOVE;
    amount=extremeEase(progress);cohesion=progress>=.5;
  }else if(t>=TYPE_HOLD+TYPE_MOVE&&t<2*TYPE_HOLD+TYPE_MOVE){
    phase='cohesion-hold';amount=1;cohesion=true;
  }else if(t>=2*TYPE_HOLD+TYPE_MOVE){
    phase='expand';progress=(t-2*TYPE_HOLD-TYPE_MOVE)/TYPE_MOVE;
    amount=1-extremeEase(progress);cohesion=progress<.5;
  }
  const holdRemaining=phase==='dispersion-hold'?TYPE_HOLD-t:phase==='cohesion-hold'?2*TYPE_HOLD+TYPE_MOVE-t:0;
  return {phase,progress,amount,holdRemaining,spacing:2.69-2.73*amount,gap:1-amount,
    title:cohesion?'응집':'분산',caption:cohesion?'메워지는틈':'벌어지는틈'};
}

const typeStage=document.querySelector('.type-poster');
if(typeStage){
  const title=typeStage.querySelector('[data-type-line="title"]');
  const caption=typeStage.querySelector('[data-type-line="caption"]');
  const mq=matchMedia('(min-width:768px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let elapsed=0,last=null,raf=0,wakeTimer=0,visible=false,fontsReady=false;
  let previousSpacing,previousGap,previousPhase;
  function paint(time){
    const state=typeMotionAt(time);
    if(state.spacing!==previousSpacing){typeStage.style.setProperty('--type-spacing',state.spacing+'em');previousSpacing=state.spacing}
    if(state.gap!==previousGap){typeStage.style.setProperty('--type-gap',state.gap+'em');previousGap=state.gap}
    if(title.textContent!==state.title){title.textContent=state.title;caption.textContent=state.caption}
    if(state.phase!==previousPhase){typeStage.dataset.motionPhase=state.phase;previousPhase=state.phase}
    return state;
  }
  function frame(now){
    raf=0;if(last!==null)elapsed+=now-last;last=now;
    const state=paint(elapsed);
    if(state.holdRemaining>0)wakeTimer=setTimeout(()=>{wakeTimer=0;raf=requestAnimationFrame(frame)},state.holdRemaining);
    else raf=requestAnimationFrame(frame);
  }
  function sync(){
    cancelAnimationFrame(raf);clearTimeout(wakeTimer);raf=0;wakeTimer=0;
    if(last!==null)elapsed+=performance.now()-last;last=null;
    const enabled=mq.matches&&!reduce.matches;
    if(!enabled){paint(0);return}
    if(visible&&!document.hidden&&fontsReady)raf=requestAnimationFrame(frame);
  }
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;sync();
  },{threshold:[0,.15]}).observe(typeStage);
  document.addEventListener('visibilitychange',sync);
  mq.addEventListener('change',sync);reduce.addEventListener('change',sync);
  document.fonts.ready.then(()=>{fontsReady=true;sync()});paint(0);sync();
}

})();
