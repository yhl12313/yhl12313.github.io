(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const film=document.querySelector('.film-scroll'),player=film.querySelector('iframe');
 const load=v=>{if(!v.src){v.src=v.dataset.src;v.load()}};
 const videos=document.querySelectorAll('video');
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const v=e.target;if(e.isIntersecting){load(v);v.play().catch(()=>{})}else v.pause()}},{rootMargin:'200px 0px',threshold:0});
 videos.forEach(v=>observer.observe(v));
 if(!reduce){const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.story .heading-row,.story-image,.object-group figure,.credits').forEach(e=>{e.classList.add('reveal');reveal.observe(e)})}
 let queued=false,playing=false,hideY=null;const hideBack=()=>{document.body.classList.add('film-playing');hideY=scrollY},showBack=()=>{document.body.classList.remove('film-playing');hideY=null};
 const command=func=>{if(player.src)player.contentWindow?.postMessage(JSON.stringify({event:'command',func,args:[]}), 'https://www.youtube.com')};
 const mobileFilm=matchMedia('(max-width:767px)');
 function update(){queued=false;const r=film.getBoundingClientRect(),travel=film.offsetHeight-innerHeight,mobile=mobileFilm.matches,p=mobile?1:Math.max(0,Math.min(1,-r.top/Math.max(1,travel)*2));film.style.setProperty('--progress',p);const active=(mobile?(r.top<innerHeight*.7&&r.bottom>innerHeight*.3):(p>=.98&&r.bottom>0&&r.top<=0))&&!document.hidden;
 if(active&&!playing){if(!player.src)player.src='https://www.youtube.com/embed/'+player.dataset.videoId+'?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0&origin='+encodeURIComponent(location.origin);else command('playVideo');playing=true;hideBack()}else if(!active&&playing){command('pauseVideo');playing=false;showBack()}}
 addEventListener('scroll',()=>{if(hideY!==null&&Math.abs(scrollY-hideY)>8)showBack();if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update);addEventListener('wheel',()=>{if(hideY!==null&&playing&&Math.abs(scrollY-hideY)<=8)showBack()},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause());update()});update();
})();
(()=>{const top=document.querySelector('.back-to-top');if(!top)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)');let pending=false;
function updateTop(){pending=false;const visible=scrollY>Math.min(innerHeight*.5,320);top.classList.toggle('is-visible',visible);top.disabled=!visible}
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateTop)}},{passive:true});
top.addEventListener('click',()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));updateTop()})();
