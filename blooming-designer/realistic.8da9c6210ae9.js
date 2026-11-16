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
})();
