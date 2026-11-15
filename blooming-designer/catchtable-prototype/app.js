(()=>{'use strict';
const viewport=document.querySelector('#app'),flows=window.FIGMA_FLOWS,historyStack=[];
let current='189:3758',waiting=false,booked=false,timers=[],choice={day:'12',people:'2',time:'오후 7:00'},saved=new Map();
const postBooking={'189:3758':'356:2311','103:854':'356:2219','103:860':'356:2439','210:2230':'356:1959','347:589':'356:2522'};
const $id=(scope,id)=>scope.querySelector('[data-node-id="'+id+'"]');
function resize(){const scale=Math.min(1,(innerHeight-(innerWidth<=900?110:100))/844,(innerWidth<=900?innerWidth-48:innerWidth/2-60)/399);document.documentElement.style.setProperty('--scale',Math.max(.3,scale));}resize();addEventListener('resize',resize);
function toast(text){viewport.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.role='status';el.textContent=text;viewport.append(el);setTimeout(()=>el.remove(),2300);}
function interactive(el,label,fn){if(!el)return;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',label);el.addEventListener('click',e=>{e.stopPropagation();fn(el);});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});}
function findTarget(screen,r){let el=$id(screen,r.id);if(el)return el;const sr=screen.getBoundingClientRect(),scale=sr.width/375,b=r.bounds;let best=null,score=Infinity;for(const n of screen.querySelectorAll('div,button,a')){const q=n.getBoundingClientRect(),d=Math.abs((q.x-sr.x)/scale-b.x)+Math.abs((q.y-sr.y)/scale-b.y)+Math.abs(q.width/scale-b.w)+Math.abs(q.height/scale-b.h);if(d<score){score=d;best=n;}}return score<10?best:null;}
function variant(id){return document.querySelector('[id="variant-'+id+'"]').content.cloneNode(true);}
function show(id,push=true){if(booked&&postBooking[id])id=postBooking[id];if(!document.getElementById('screen-'+id))return;if(push&&current!==id)historyStack.push(current);timers.forEach(clearTimeout);timers=[];current=id;viewport.querySelector('.screen')?.remove();const copy=document.getElementById('screen-'+id).content.cloneNode(true);viewport.prepend(copy);const screen=viewport.querySelector('.screen');screen.classList.add('fade');document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-current',(booked?postBooking[b.dataset.route]:b.dataset.route)===id?'true':'false'));
 const local=flows.reactions.filter(r=>r.screen===id);for(const r of local){const el=findTarget(screen,r);if(!el)continue;for(const reaction of r.reactions){const a=reaction.actions[0];if(!a)continue;if(reaction.trigger?.type==='AFTER_TIMEOUT'){if(a.destinationId==='367:15213')setupBanner(el);continue;}
 let label=(el.innerText||'').trim().replace(/\s+/g,' ');if(a.navigation==='NAVIGATE'){const dest=flows.geometry.find(g=>g.id===a.destinationId);label=label||dest?.name||'화면 이동';interactive(el,label,()=>{if(a.destinationId==='353:1233')choice.time=label;if(a.destinationId==='356:2311'&&current==='353:1233'){booked=true;show(a.destinationId);toast('예약이 완료되었습니다.');}else show(a.destinationId);});}
 else if(a.navigation==='CHANGE_TO'){
 if(['189:3827','189:3830'].includes(a.destinationId)){
 let key=id+':'+r.bounds.x+':'+r.bounds.y;const paint=on=>{el.querySelector('.variant-icon')?.remove();const wrap=document.createElement('span');wrap.className='variant-icon';wrap.inert=true;wrap.setAttribute('aria-hidden','true');wrap.append(variant(on?'189:3827':'189:3830'));el.append(wrap);el.setAttribute('aria-pressed',String(on));};interactive(el,'식당 저장',()=>{let on=saved.has(key)?!saved.get(key):a.destinationId==='189:3827';saved.set(key,on);paint(on);});if(saved.has(key))paint(saved.get(key));else el.setAttribute('aria-pressed',String(a.destinationId==='189:3830'));
 }else if(['210:1996','210:1997'].includes(a.destinationId)){interactive(el,label||'필터 선택',()=>{let on=el.classList.contains('filter-on')?false:el.classList.contains('filter-off')?true:a.destinationId==='210:1996';el.classList.toggle('filter-on',on);el.classList.toggle('filter-off',!on);el.setAttribute('aria-pressed',String(on));});}
 else if(a.destinationId==='344:1157'||a.destinationId==='344:1492'){const group=a.destinationId==='344:1157'?'day':'people';interactive(el,(group==='day'?'6월 ':'')+label,()=>{screen.querySelectorAll('[data-select-group="'+group+'"]').forEach(x=>{x.classList.remove('selected-option');x.setAttribute('aria-pressed','false');});el.dataset.selectGroup=group;el.classList.add('selected-option');el.setAttribute('aria-pressed','true');choice[group]=label.replace('명','');});el.dataset.selectGroup=group;}
 else if(['210:1775','210:1774'].includes(a.destinationId)){const paint=()=>el.replaceChildren(...variant(waiting?'210:1775':'210:1774').firstElementChild.childNodes);interactive(el,'웨이팅 순서 확인',()=>{waiting=!waiting;paint();});if(waiting)paint();}
 }
 }}
 // Fixed navigation and view transitions match the original prototype, including alternate post-reservation screens.
 if(!['315:972','353:1233'].includes(id)){for(const n of screen.querySelectorAll('[data-name="gnb"],[data-name="gnb_nav"],[data-name="gnv_dinning"]'))n.style.zIndex='5';}
 if(id==='315:972'){
 const modal=$id(screen,'344:1552');if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','날짜와 인원 선택');}
 screen.querySelectorAll('[data-name="예약 버튼"]').forEach(el=>{if(!el.hasAttribute('role'))interactive(el,el.textContent.trim(),()=>{choice.time=el.textContent.trim();show('353:1233');});});
 }
 if(id==='353:1233'){
 const date=$id(screen,'355:1714'),people=$id(screen,'355:1740');if(date)date.textContent='2026.06.'+choice.day+' '+choice.time;if(people)people.textContent='매장 식사 '+choice.people+'명';
 screen.querySelectorAll('[data-name="검색 필터"]').forEach(el=>interactive(el,el.textContent.trim(),()=>{const on=el.classList.toggle('selected-option');el.setAttribute('aria-pressed',String(on));}));
 const req=$id(screen,'356:1806');if(req){req.replaceChildren();const input=document.createElement('textarea');input.className='request-input';input.placeholder='매장에 요청할 내용이 있다면 작성해주세요.';input.setAttribute('aria-label','고객 요청사항');req.append(input);}
 }
 if(id==='356:1959'){const row=$id(screen,'I356:2202;210:1179');if(row)row.textContent='2026.06.'+choice.day+' '+choice.time+' '+choice.people+'명';const badge=$id(screen,'I356:2194;210:1599');if(badge)badge.textContent='D-'+Math.max(0,Number(choice.day)-4);}
 document.getElementById('screen-name').textContent=flows.geometry.find(g=>g.id===id)?.name||'홈';
}
function setupBanner(el){const strip=[...el.children].find(n=>n.getBoundingClientRect().width>el.getBoundingClientRect().width*2);if(!strip)return;let pos=0;const next=()=>{if(!document.contains(el))return;pos++;strip.style.transition='translate 1.2s ease-in-out';strip.style.translate=(-351*pos)+'px 0';if(pos===4){timers.push(setTimeout(()=>{pos=0;strip.style.transition='none';strip.style.translate='0 0';timers.push(setTimeout(next,1600));},1200));}else timers.push(setTimeout(next,2800));};timers.push(setTimeout(next,1600));}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.route)));
document.querySelector('#restart').addEventListener('click',()=>{waiting=false;booked=false;saved.clear();historyStack.length=0;show('189:3758',false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&historyStack.length)show(historyStack.pop(),false);});
show(current,false);
})();
