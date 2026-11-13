/* Use the same restrained, viewport-led reveal as the other project page. */
const caseMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window&&!caseMotionPreference.matches){
 const caseTargets=document.querySelectorAll('[data-reveal]');
 const caseObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add('is-visible');caseObserver.unobserve(entry.target);}
 },{threshold:.08,rootMargin:'0px 0px -3% 0px'});
 for(const target of caseTargets){target.classList.add('case-reveal');caseObserver.observe(target);}
 caseMotionPreference.addEventListener('change',event=>{if(!event.matches)return;caseObserver.disconnect();for(const target of caseTargets)target.classList.add('is-visible');});
}
