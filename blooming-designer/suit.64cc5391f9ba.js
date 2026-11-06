const back=document.querySelector('.back-link');
const referrer=document.referrer?new URL(document.referrer):null;
const homePath=new URL('index.html',location.href).pathname;
if(referrer&&referrer.origin===location.origin&&(referrer.pathname===homePath||referrer.pathname===homePath.replace(/index\.html$/,''))){back.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});}
// Scale the original exported diagrams without altering SVG root dimensions.
const observer=new ResizeObserver(entries=>{for(const {target,contentRect} of entries){if(target.classList.contains('glyph-box'))target.style.setProperty('--guide-scale',contentRect.width/287.641);else if(target.classList.contains('suit-word'))target.style.setProperty('--word-scale',contentRect.width/312.379);else{const img=target.querySelector('img');target.style.setProperty('--measure-scale',contentRect.width/Number(img.getAttribute('width')));}}});
document.querySelectorAll('.glyph-box,.suit-word').forEach(node=>observer.observe(node));

const backToTop=document.querySelector('.back-to-top');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function syncBackToTop(){const visible=scrollY>Math.min(innerHeight*.5,320);backToTop.hidden=false;backToTop.classList.toggle('is-visible',visible);backToTop.disabled=!visible;}
backToTop.addEventListener('click',()=>scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'}));
addEventListener('scroll',syncBackToTop,{passive:true});addEventListener('resize',syncBackToTop,{passive:true});syncBackToTop();


// Type Hangul through initial consonant, vowel, and final consonant composition.
const specimen=document.querySelector('.type-specimen');
if(specimen&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const initials=Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
 const steps=[],fragment=document.createDocumentFragment();
 const label=specimen.innerText;
 for(const node of [...specimen.childNodes]){
  if(node.nodeType!==Node.TEXT_NODE){fragment.append(node.cloneNode(true));continue;}
  for(const character of node.textContent.match(/--|[\s\S]/gu)||[]){
   const slot=document.createElement('span');
   slot.style.cssText='display:inline-grid;vertical-align:baseline';
   slot.setAttribute('aria-hidden','true');
   const ghost=document.createElement('span');
   ghost.textContent=character;ghost.style.cssText='grid-area:1/1;visibility:hidden';
   const ink=document.createElement('span');
   ink.style.cssText='grid-area:1/1';
   slot.append(ghost,ink);fragment.append(slot);
   const code=character.codePointAt(0)-0xAC00;
   if(code>=0&&code<11172){
    const initial=Math.floor(code/588),vowel=Math.floor(code%588/28),final=code%28;
    steps.push([ink,initials[initial]],[ink,String.fromCodePoint(0xAC00+initial*588+vowel*28)]);
    if(final)steps.push([ink,character]);
   }else steps.push([ink,character]);
  }
 }
 specimen.setAttribute('aria-label',label);specimen.replaceChildren(fragment);
 const revealObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  revealObserver.disconnect();let started,written=0;
  function type(now){
   if(started===undefined)started=now;
   const count=Math.min(steps.length,Math.floor((now-started)/65)+1);
   while(written<count){const [ink,text]=steps[written++];ink.textContent=text;}
   if(written<steps.length)requestAnimationFrame(type);
   
  }
  requestAnimationFrame(type);
 },{threshold:0,rootMargin:'0px 0px -10% 0px'});
 document.fonts.load('500 140px "SUIT Specimen"','디자이너를 위한 ㄷㅈㅇ 0123456789').then(()=>revealObserver.observe(specimen));
}

// Hold each centered glyph for half a second; swap instantly without tweening.
const glyphMetrics={"ㅍ":{"text":"ㅍ","weight":500,"size":240,"x":37.7405,"y":230.9405},"ㄱ":{"text":"ㄱ","weight":500,"size":240,"x":38.9405,"y":231.0605},"ㄴ":{"text":"ㄴ","weight":500,"size":240,"x":36.5405,"y":232.0205},"ㄷ":{"text":"ㄷ","weight":500,"size":240,"x":37.3805,"y":231.5405},"ㅁ":{"text":"ㅁ","weight":500,"size":240,"x":37.8605,"y":231.7805},"ㅂ":{"text":"ㅂ","weight":500,"size":240,"x":38.1005,"y":232.5005},"ㅅ":{"text":"ㅅ","weight":500,"size":240,"x":37.8605,"y":232.0205},"ㅇ":{"text":"ㅇ","weight":500,"size":240,"x":38.8205,"y":232.1405},"ㅈ":{"text":"ㅈ","weight":500,"size":240,"x":37.2605,"y":231.6605},"ㅊ":{"text":"ㅊ","weight":500,"size":240,"x":38.5805,"y":235.3805},"ㅋ":{"text":"ㅋ","weight":500,"size":240,"x":39.3005,"y":231.9005},"ㅌ":{"text":"ㅌ","weight":500,"size":240,"x":36.9005,"y":231.5405},"ㅎ":{"text":"ㅎ","weight":500,"size":240,"x":37.8605,"y":233.7005},"+":{"text":"+","weight":500,"size":240,"x":56.8205,"y":232.5005},"=":{"text":"=","weight":500,"size":240,"x":61.9805,"y":231.5405},"*":{"text":"*","weight":500,"size":240,"x":78.9005,"y":233.7005},"#":{"text":"#","weight":600,"size":180,"x":73.0805,"y":208.8005},"@":{"text":"@","weight":600,"size":180,"x":49.5005,"y":207.0905},">":{"text":">","weight":700,"size":180,"x":90.0905,"y":209.0705},"<":{"text":"<","weight":700,"size":180,"x":83.2505,"y":209.0705},"ㅏ":{"text":"ㅏ","weight":700,"size":180,"x":52.4705,"y":208.5305},"ㅑ":{"text":"ㅑ","weight":700,"size":180,"x":57.3305,"y":208.8005},"ㅓ":{"text":"ㅓ","weight":700,"size":180,"x":66.7805,"y":208.8005},"ㅕ":{"text":"ㅕ","weight":700,"size":180,"x":66.6905,"y":208.5305},"ㅜ":{"text":"ㅜ","weight":700,"size":180,"x":64.6205,"y":194.4905},"ㅠ":{"text":"ㅠ","weight":700,"size":180,"x":65.2505,"y":194.7605},"ㅡ":{"text":"ㅡ","weight":700,"size":180,"x":65.2505,"y":212.4005},"ㅣ":{"text":"ㅣ","weight":700,"size":180,"x":64.4405,"y":208.8905}};
glyphMetrics['ㄹ']={text:'ㄹ',weight:500,size:240,x:37.3805,y:232.0205};
const glyphSequences=[Array.from('ㅍㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅎ'),Array.from('><+=*#@ㅏㅑㅓㅕㅜㅠㅡㅣ')];
const glyphPair=document.querySelector('.glyph-pair');
const glyphReducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
Promise.all([500,600,700].map(weight=>document.fonts.load(weight+' 240px SUIT','ㅍㄱㅏ><+=*#@'))).then(()=>{
 if(!glyphPair)return;
 const ns='http://www.w3.org/2000/svg';
 const texts=[...glyphPair.querySelectorAll('.glyph-p,.glyph-arrow')].map(original=>{
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','287.641');svg.setAttribute('height','287.641');
  svg.setAttribute('viewBox','0 0 287.641 287.641');
  svg.setAttribute('aria-hidden','true');svg.classList.add('glyph-cycle');
  const text=document.createElementNS(ns,'text');
  text.setAttribute('fill','currentColor');text.setAttribute('font-family','SUIT');
  text.style.letterSpacing='0';text.style.fontSynthesis='none';
  svg.append(text);original.replaceWith(svg);return text;
 });
 if(texts.length!==2)return;
 let timer=null,inView=false;
 const currentGlyphs=['ㅍ','>'],bags=[[],[]];
 function nextGlyph(i){
  if(!bags[i].length){
   bags[i]=[...glyphSequences[i]];
   for(let k=bags[i].length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[bags[i][k],bags[i][j]]=[bags[i][j],bags[i][k]];}
   if(bags[i][bags[i].length-1]===currentGlyphs[i])[bags[i][0],bags[i][bags[i].length-1]]=[bags[i][bags[i].length-1],bags[i][0]];
  }
  return bags[i].pop();
 }
 function render(){
  texts.forEach((text,i)=>{
   const glyph=glyphMetrics[currentGlyphs[i]];
   text.textContent=glyph.text;text.setAttribute('font-weight',glyph.weight);
   text.setAttribute('font-size',glyph.size);text.setAttribute('x',glyph.x);text.setAttribute('y',glyph.y);
  });
 }
 function syncGlyphPlayback(){
  clearInterval(timer);timer=null;
  if(inView&&!document.hidden&&!glyphReducedMotion.matches)timer=setInterval(()=>{currentGlyphs.forEach((_,i)=>currentGlyphs[i]=nextGlyph(i));render();},500);
 }
 render();
 const glyphObserver=new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting);syncGlyphPlayback();},{threshold:0});
 glyphObserver.observe(glyphPair);
 document.addEventListener('visibilitychange',syncGlyphPlayback);
 glyphReducedMotion.addEventListener('change',syncGlyphPlayback);
});

// Show Noto Sans tracking and its measured line width in the same animation frame.
const notoSample=document.querySelector('.sample-noto');
const notoSpacingValue=document.querySelector('.noto-spacing-value');
const notoMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
if(notoSample&&notoSpacingValue){
 let notoVisible=false,notoFrame=null,notoStarted=null;
 const ease=t=>t*t*(3-2*t);
 function drawNotoSpacing(percent){
  notoSample.style.setProperty('--noto-tracking',(percent/100)+'em');
  const value=Math.abs(percent)<.05?'0':percent.toFixed(1);
  const label=value+'%';
  if(notoSpacingValue.textContent!==label)notoSpacingValue.textContent=label;
 }
 function tickNoto(now){
  if(notoStarted===null)notoStarted=now;
  const t=(now-notoStarted)%6600;
  let percent=0;
  if(t>=800&&t<3200)percent=-4.8*ease((t-800)/2400);
  else if(t>=3200&&t<5000)percent=-4.8;
  else if(t>=5000)percent=-4.8*(1-ease((t-5000)/1600));
  drawNotoSpacing(percent);notoFrame=requestAnimationFrame(tickNoto);
 }
 function syncNotoPlayback(){
  if(notoFrame!==null)cancelAnimationFrame(notoFrame);
  notoFrame=null;notoStarted=null;
  if(notoVisible&&!document.hidden&&!notoMotionPreference.matches)notoFrame=requestAnimationFrame(tickNoto);
  else if(notoMotionPreference.matches)drawNotoSpacing(0);
 }
 document.fonts.load('500 80px "Noto Sans KR"','네오 그로테스크 산세리프').then(()=>{
  const notoObserver=new IntersectionObserver(entries=>{notoVisible=entries.some(entry=>entry.isIntersecting);syncNotoPlayback();},{threshold:0});
  notoObserver.observe(notoSample);
 });
 document.addEventListener('visibilitychange',syncNotoPlayback);
 notoMotionPreference.addEventListener('change',syncNotoPlayback);
}

/* Start as the section enters view, independently of pointer and screen size. */
{
 const spectrum=document.querySelector('.weight-spectrum');
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(spectrum&&!preference.matches&&'IntersectionObserver' in window){
  spectrum.classList.add('weight-motion-ready');
  document.fonts.load('500 150px "SUIT Variable"','가벼움적절함무거움').catch(()=>{});
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   observer.disconnect();
   spectrum.classList.add('weight-motion-playing');
  },{threshold:0.01});
  spectrum.addEventListener('animationend',event=>{
   if(event.animationName!=='weight-open-heavy')return;
   spectrum.classList.remove('weight-motion-ready','weight-motion-playing');
   spectrum.classList.add('weight-motion-complete');
  });
  observer.observe(spectrum);
 }
}

/* Reveal explanatory body copy once as it enters the viewport. */
{
 const start=document.querySelector('.alignment-copy');
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(start&&!preference.matches&&'IntersectionObserver' in window){
  const paragraphs=[...document.querySelectorAll('.bilingual > p, .reading-grid > article > p, .line-height-grid > article > p')].filter(p=>
   (start.contains(p)||Boolean(start.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_FOLLOWING))&&
   !p.closest('.spacing-intro,.line-height-section .section-intro')
  );
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    entry.target.classList.add('body-copy-visible');
    observer.unobserve(entry.target);
   }
  },{threshold:0.08});
  for(const p of paragraphs){p.classList.add('body-copy-reveal');observer.observe(p);}
  preference.addEventListener('change',event=>{
   if(!event.matches)return;
   observer.disconnect();
   for(const p of paragraphs)p.classList.add('body-copy-visible');
  });
 }
}

/* Keep the weight demonstration moving only while it can be seen. */
{
 const glyph=document.querySelector('.weight-glyph');
 if(glyph&&'IntersectionObserver' in window){
  let visible=false;
  const sync=()=>glyph.classList.toggle('weight-breathe-visible',visible&&!document.hidden);
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();},{threshold:0});
  observer.observe(glyph);
  document.addEventListener('visibilitychange',sync);
 }
}
