(()=>{
 const videos=[...document.querySelectorAll('video[data-poster]')];
 const prepare=v=>{
  if(v.dataset.poster&&!v.getAttribute('poster'))v.poster=v.dataset.poster;
  const source=v.querySelector('source[data-src]');
  if(source&&!source.getAttribute('src')){source.src=source.dataset.src;v.load();}
 };
 if(!('IntersectionObserver' in window)){videos.forEach(prepare);return;}
 const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(isIntersecting){prepare(target);observer.unobserve(target);}
 }),{rootMargin:'1000px 0px'});
 videos.forEach(v=>observer.observe(v));
})();
