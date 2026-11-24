(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const film=document.querySelector('.film-scroll'),player=film.querySelector('iframe');
 const load=v=>{if(!v.src){v.src=v.dataset.src;v.load()}};
 const videos=document.querySelectorAll('video');
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const v=e.target;if(e.isIntersecting){load(v);v.play().catch(()=>{})}else v.pause()}},{rootMargin:'200px 0px',threshold:0});
 videos.forEach(v=>observer.observe(v));
 if(!reduce){const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.story .heading-row,.story-image,.object-group figure,.credits').forEach(e=>{e.classList.add('reveal');reveal.observe(e)})}
 let queued=false,playing=false;
 const command=func=>{if(player.src)player.contentWindow?.postMessage(JSON.stringify({event:'command',func,args:[]}), 'https://www.youtube.com')};
 function update(){queued=false;const r=film.getBoundingClientRect(),travel=film.offsetHeight-innerHeight,p=Math.max(0,Math.min(1,-r.top/Math.max(1,travel)*2));film.style.setProperty('--progress',p);const active=p>=.98&&r.bottom>0&&r.top<=0&&!document.hidden;
 if(active&&!playing){if(!player.src)player.src='https://www.youtube.com/embed/'+player.dataset.videoId+'?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0&origin='+encodeURIComponent(location.origin);else command('playVideo');playing=true}else if(!active&&playing){command('pauseVideo');playing=false}}
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update);document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause());update()});update();
})();
