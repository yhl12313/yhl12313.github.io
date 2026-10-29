const links = [...document.querySelectorAll('.header nav a')];
const sections = links.map(link => document.querySelector(link.getAttribute('href')));
function updateNavigation() {
  let current = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= innerHeight * .4) current = section;
  links.forEach(link => {
    const active = link.hash === '#' + current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = matchMedia('(max-width: 1024px), (min-width: 600px) and (max-width: 1366px) and (orientation: portrait), (horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)');
// Anchor the biography grid to the portrait seam rather than paragraph height.
const biography = document.querySelector('.about');
const introduction = biography.querySelector('.introduction');
const upperPortrait = biography.querySelector('.portrait:first-child');
function syncBiographyGrid() {
  if (mobileLayout.matches) {
    biography.style.removeProperty('--resume-space');
    return;
  }
  const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
  const baselineOffset = 6.875 * scale; // Original 1280px distance below the portrait seam.
  const space = upperPortrait.getBoundingClientRect().bottom - introduction.getBoundingClientRect().bottom + baselineOffset;
  biography.style.setProperty('--resume-space', Math.max(0, space) + 'px');
}
const biographyObserver = new ResizeObserver(syncBiographyGrid);
[upperPortrait, introduction, biography.querySelector('.identity')].forEach(element => biographyObserver.observe(element));
addEventListener('resize', syncBiographyGrid, { passive: true });
document.fonts.ready.then(syncBiographyGrid);
syncBiographyGrid();

// Follow the viewport after the visitor leaves the top of the page.
const backToTop = document.querySelector('.back-to-top');
function syncBackToTop() {
  backToTop.hidden = !mobileLayout.matches;
  const visible = mobileLayout.matches && window.scrollY > Math.min(window.innerHeight * .5, 320);
  backToTop.classList.toggle('is-visible', visible);
  backToTop.disabled = !visible;
}
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
addEventListener('scroll', syncBackToTop, { passive: true });
addEventListener('resize', syncBackToTop, { passive: true });
syncBackToTop();

(() => {
  const stage = document.querySelector('.flower-stage');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const clamp = x => Math.max(0, Math.min(1,x));
  const ease = x => { const p=clamp(x); return p*p*(3-2*p); };
  const duration = 2.85;
  let width=0, height=0, age=0, last=null, frame=null, visible=true;
  const ribbons=[];
  // Three cupped crowns: every rib is an actual 3D curve, rooted at the center.
  for(let crown=0;crown<3;crown++){
    const ribs=crown===0?16:crown===1?12:8;
    for(let petal=0;petal<9;petal++){
      for(let rib=0;rib<ribs;rib++){
        const angle=petal*Math.PI*2/9+crown*.24;
        const size=[1,.77,.53][crown]*(1-rib*.017);
        const points=[];
        for(let i=0;i<=128;i++){
          const t=i/128, s=Math.sin(Math.PI*t);
          const reach=Math.pow(s,.84);
          points.push({
            r:.018+rib*.00035+reach*size,
            side:Math.sin(t*Math.PI*2)*reach*size*(.32+crown*.025),
            arch:reach*(.09+crown*.105)+Math.sin(t*Math.PI*2)*reach*.12,
            t
          });
        }
        ribbons.push({points,angle,crown,rib,
          delay:crown*.105+((petal*4)%9)*.018+rib*.009,
          length:1.32+rib*.012,
          alpha:rib===0?.57:.16+(rib%4)*.016,
          weight:rib===0?.72:.46
        });
      }
    }
  }
  function resize(){
    const box=stage.getBoundingClientRect();width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function draw(){
    ctx.clearRect(0,0,width,height);
    const clock=reducedMotion.matches?duration:age;
    const formation=ease(clock/duration);
    stage.dataset.bloomPhase=clock>=duration?'complete':clock<.6?'generating':'unfolding';
    const scale=Math.min(width*.37,height*.43);
    const cx=width/2,cy=height/2;
    // Camera and petals travel through depth only during the opening.
    const pitch=-.78+formation*.4, yaw=(1-formation)*.42;
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cyaw=Math.cos(yaw),syaw=Math.sin(yaw);
    const projected=[];
    for(const ribbon of ribbons){
      const local=Math.max(0,clock-ribbon.delay);
      const growth=clamp(local/ribbon.length);
      if(growth===0)continue;
      const drawProgress=1-Math.pow(1-growth,2.3);
      const opening=ease((local-.12)/1.8);
      const fold=(1-opening)*1.33;
      const twist=(1-opening)*(.72+ribbon.crown*.14);
      const theta=ribbon.angle+twist;
      const cs=Math.cos(theta),sn=Math.sin(theta);
      const cf=Math.cos(fold),sf=Math.sin(fold);
      const coords=[];let depthTotal=0;
      for(const point of ribbon.points){
        const lateral=point.side*(.1+.9*opening);
        const radial=point.r*cf;
        const z=point.r*sf+point.arch*opening;
        const x=radial*cs-lateral*sn,y=radial*sn+lateral*cs;
        const py=y*cp-z*sp,pz=y*sp+z*cp;
        const px=x*cyaw+pz*syaw,depth=-x*syaw+pz*cyaw;
        const perspective=1/(1+depth*.32);
        coords.push([cx+px*scale*perspective,cy+py*scale*perspective,depth]);
        depthTotal+=depth;
      }
      projected.push({ribbon,coords,depth:depthTotal/coords.length,progress:drawProgress,
        opacity:ease(local/.12)});
    }
    // Faint rear ribs and darker near ribs make the nested surfaces read in depth.
    projected.sort((a,b)=>b.depth-a.depth);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const item of projected){
      const {ribbon,coords,progress}=item;
      const extent=64*progress,whole=Math.floor(extent),fraction=extent-whole;
      ctx.beginPath();
      for(const direction of [1,-1]){
        const root=direction===1?0:128;
        ctx.moveTo(coords[root][0],coords[root][1]);
        for(let i=1;i<=whole;i++){
          const p=coords[root+i*direction];ctx.lineTo(p[0],p[1]);
        }
        if(fraction>0&&whole<64){
          const p=coords[root+whole*direction],q=coords[root+(whole+1)*direction];
          ctx.lineTo(p[0]+(q[0]-p[0])*fraction,p[1]+(q[1]-p[1])*fraction);
        }
      }
      const depthInk=clamp(.88-item.depth*.5);
      ctx.strokeStyle='rgba(0,0,0,'+ribbon.alpha*depthInk*item.opacity+')';
      ctx.lineWidth=ribbon.weight;ctx.stroke();
    }
  }
  function animate(now){
    frame=null;
    if(last!==null)age=Math.min(duration,age+(now-last)/1000);
    last=now;draw();
    if(age<duration&&visible&&!document.hidden&&!reducedMotion.matches)
      frame=requestAnimationFrame(animate);
  }
  function sync(){
    if(frame!==null)cancelAnimationFrame(frame);
    frame=null;last=null;
    if(reducedMotion.matches||age>=duration)draw();
    else if(visible&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
  document.addEventListener('visibilitychange',sync);
  reducedMotion.addEventListener('change',sync);
  resize();sync();
})();
