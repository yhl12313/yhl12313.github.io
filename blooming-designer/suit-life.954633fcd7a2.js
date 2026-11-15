/* Play once in the reading viewport; retain the finished poster and revealed copy. */
(() => {
 const story=document.querySelector('.life-story');
 if(!story)return;
 const figure=story.querySelector('.life-dissolve'),slides=[...figure.querySelectorAll('.life-slide')],caption=story.querySelector('.life-caption');
 if(!('IntersectionObserver' in window)){slides.at(-1).classList.add('is-visible');story.classList.add('life-copy-visible');return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,cross=reduced?0:600;
 const first=600,firstDone=first+cross,second=firstDone+1200,secondDone=second+cross,third=secondDone+1200,last=third+cross;
 let visible=false,started=false,elapsed=0,previous=0,step=0,done=false;
 story.classList.add('life-ready');caption.setAttribute('aria-hidden','true');story.dataset.lifeStep='original';
 function draw(now){
  if(done)return;
  if(previous&&visible&&!document.hidden)elapsed+=Math.min(now-previous,100);
  previous=now;
  if(elapsed>=first&&step<1){slides[1].classList.add('is-visible');story.dataset.lifeStep='1-transition';step=1;}
  if(elapsed>=firstDone&&!story.classList.contains('life-copy-visible')){story.classList.add('life-copy-visible');caption.removeAttribute('aria-hidden');story.dataset.lifeStep='1';}
  if(elapsed>=second&&step<2){slides[2].classList.add('is-visible');story.dataset.lifeStep='2-transition';step=2;}
  if(elapsed>=secondDone&&step===2)story.dataset.lifeStep='2';
  if(elapsed>=third&&step<3){slides[3].classList.add('is-visible');story.dataset.lifeStep='3-transition';step=3;}
  if(elapsed>=last){done=true;story.dataset.lifeStep='3';observer.disconnect();return;}
  requestAnimationFrame(draw);
 }
 const observer=new IntersectionObserver(entries=>{
  const e=entries[0];visible=e.isIntersecting&&e.intersectionRect.height>=Math.min(e.boundingClientRect.height*.4,innerHeight*.35);
  if(visible&&!started){started=true;Promise.allSettled(slides.map(img=>img.decode())).then(()=>requestAnimationFrame(draw));}
 },{threshold:[0,.1,.2,.3,.4,.5,.6,.8,1]});
 observer.observe(figure);
})();
