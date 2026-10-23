import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { WaxShell } from './wax.js';
import { WaxAudio } from './wax-audio.js';


const $ = s => document.querySelector(s);
const stage = $('#stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true}); }
catch { $('#loading').textContent='3D 화면을 열 수 없어요. WebGL을 지원하는 브라우저에서 다시 열어 주세요.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
stage.append(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32,1,.1,50);
camera.position.set(0,1.9,8.2); camera.lookAt(0,1.55,0);
scene.add(new THREE.HemisphereLight(0xffffff,0xb4b8c2,3));
const key = new THREE.DirectionalLight(0xffffff,3.5); key.position.set(-3,6,5);scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff,1.6);fill.position.set(4,2,-3);scene.add(fill);
const root = new THREE.Group();scene.add(root);
const shadowTex = document.createElement('canvas'); shadowTex.width=128;shadowTex.height=128;
const ctx=shadowTex.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
gradient.addColorStop(0,'rgba(74,84,51,.27)');gradient.addColorStop(.45,'rgba(74,84,51,.12)');gradient.addColorStop(1,'rgba(74,84,51,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(4.4,2.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowTex),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.03;scene.add(shadow);
let meshes=[], mode='pinch', softness=1, interaction=null, audio, loadId=0;
let wax=null;
const waxStrength=1.2;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
const point=new THREE.Vector3(), normal=new THREE.Vector3(), delta=new THREE.Vector3();
const plane=new THREE.Plane(), planeHit=new THREE.Vector3();
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=Math.max(7.2,7.6/(w/h));camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function unlockAudio(){try{audio??=new AudioContext();document.body.dataset.audioState=audio.state;audio.onstatechange=()=>{document.body.dataset.audioState=audio.state;};if(audio.state!=='running')audio.resume().catch(()=>{});}catch{document.body.dataset.audioState='unavailable';}}
document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
function tone(release=false){unlockAudio();if(!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(release?480:330,audio.currentTime);o.frequency.exponentialRampToValueAtTime(release?260:640,audio.currentTime+.16);g.gain.setValueAtTime(.11,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.24);o.connect(g).connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(audio.currentTime+.25);}catch{}}
const waxAudio=new WaxAudio(()=>{unlockAudio();return audio;});



function crackle(intensity,count=1){waxAudio.crack(intensity,count);}
function particles(x=stage.clientWidth/2,y=stage.clientHeight/2){if(reduced)return;const host=$('#fx');for(let i=0;i<5;i++){const el=document.createElement('span');el.className='particle';el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+(i%2?'<circle cx="12" cy="12" r="3"/>':'<path d="M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z"/>')+'</svg>';el.style.cssText=`left:${x+(Math.random()-.5)*65}px;top:${y+40}px;--dx:${(Math.random()-.5)*130}px;animation-delay:${i*.04}s`;host.append(el);setTimeout(()=>el.remove(),1200);}}
function disposeModel(model,withTextures=true){const resources=new Set();model.traverse(obj=>{if(!obj.isMesh)return;resources.add(obj.geometry);for(const material of [obj.material].flat()){resources.add(material);if(withTextures)for(const value of Object.values(material))if(value?.isTexture)resources.add(value);}});for(const resource of resources)resource.dispose();}
function resetModel(){interaction=null;root.rotation.set(0,0,0);root.scale.set(1,1,1);root.position.set(0,0,0);meshes.forEach(m=>{m.mesh.geometry.attributes.position.array.set(m.base);m.rest.set(m.base);m.velocity.fill(0);m.mesh.geometry.attributes.position.needsUpdate=true;m.mesh.geometry.computeVertexNormals();});wax?.reset();}
function loadModel(name,label){
  document.body.dataset.character=name; $('#fx').replaceChildren();

  const request=++loadId;resetModel();wax?.dispose();wax=null;disposeModel(root);root.clear();meshes=[];stage.dataset.ready='false';stage.dataset.model=name;
  $('#loading').textContent='모델 불러오는 중…';$('#loading').classList.remove('hide');
  stage.setAttribute('aria-label',`${label}. 드래그로 꼬집기, 누르기 모드에서 길게 누르기. 왁뿌볼 모드에서는 눌러 겉 껍질 깨기, 속 모델은 누른 부위만 변형.`);
  $('.play-area').setAttribute('aria-label',`${label} 3D 놀이터`);
  document.querySelectorAll('.character').forEach(btn=>{const selected=btn.dataset.model===name;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));});
  new GLTFLoader().load(`./assets/${name}.glb`,gltf=>{
  if(request!==loadId){disposeModel(gltf.scene);return;}
  const model=gltf.scene;model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=3.45/Math.max(size.x,size.y);
  model.traverse(obj=>{if(!obj.isMesh)return;const geometry=obj.geometry.clone();geometry.applyMatrix4(obj.matrixWorld);geometry.translate(-center.x,-box.min.y,-center.z);geometry.scale(scale,scale,scale);const mesh=new THREE.Mesh(geometry,obj.material.clone());mesh.material.roughness=.85;mesh.material.metalness=0;root.add(mesh);meshes.push({mesh,base:geometry.attributes.position.array.slice(),rest:geometry.attributes.position.array.slice(),velocity:new Float32Array(geometry.attributes.position.array.length)});});
  wax=new WaxShell(root,meshes,()=>{},crackle,{chiikawa:{coating:0xffc1dc,edge:0xbd5c8b},usagi:{coating:0xffe7a0,edge:0xad8500}}[name]);wax.auto=false;wax.setActive(mode==='wax');
  disposeModel(model,false);$('#loading').classList.add('hide');stage.dataset.ready='true';
},undefined,error=>{if(request!==loadId)return;console.error(error);$('#loading').textContent='불러오지 못했어요. 모델을 다시 선택해 주세요.';});
}
document.querySelectorAll('.character').forEach(btn=>btn.addEventListener('click',()=>loadModel(btn.dataset.model,btn.textContent.trim())));
loadModel('chiikawa','치이카와');
function cast(e){const r=stage.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects([...meshes.map(m=>m.mesh),...(mode==='wax'&&wax?wax.targets():[])],false)[0];}
stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||!meshes.length||interaction)return;
  const hit=cast(e);if(!hit)return;
  stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);
  interaction={id:e.pointerId,startX:e.clientX,lastX:e.clientX,startY:e.clientY,started:performance.now(),kind:mode};
  {
    root.worldToLocal(point.copy(hit.point));normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);normal.transformDirection(new THREE.Matrix4().copy(root.matrixWorld).invert());delta.set(0,0,0);
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),hit.point);interaction.origin=hit.point.clone();
    if(mode==='wax')waxAudio.touch();else tone();
  }
});
stage.addEventListener('pointermove',e=>{
  if(!interaction){const hit=cast(e);stage.style.cursor=hit?'grab':'default';return;}
  if(interaction.id!==e.pointerId)return;

  cast(e);if(ray.ray.intersectPlane(plane,planeHit)){
    const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();delta.copy(planeHit).applyMatrix4(inverse).sub(interaction.origin.clone().applyMatrix4(inverse));delta.clampLength(0,1.3);
  }
});
function release(e){if(!interaction||e&&interaction.id!==e.pointerId)return;if(interaction.kind==='wax'){for(const m of meshes){m.rest.set(m.mesh.geometry.attributes.position.array);m.velocity.fill(0);m.mesh.geometry.computeBoundingSphere();}waxAudio.touch();}else{tone(true);const r=stage.getBoundingClientRect();particles(e?e.clientX-r.left:undefined,e?e.clientY-r.top:undefined);}interaction=null;}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);window.addEventListener('blur',()=>release());
document.querySelectorAll('.mode').forEach(btn=>btn.addEventListener('click',()=>{resetModel();mode=btn.dataset.mode;wax?.setActive(mode==='wax');document.querySelectorAll('.mode').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});$('.softness').hidden=mode==='wax';stage.dataset.mode=mode;stage.style.cursor='grab';}));

function strengthLabel(){$('#strength-min').textContent=mode==='wax'?'약하게':'탱글';$('#strength-max').textContent=mode==='wax'?'세게':'흐물';$('#softness-label').textContent=mode==='wax'?'누르는 힘':'말랑함';$('#soft-label').value=mode==='wax'?(softness<.7?'약하게':softness>1.2?'세게':'보통'):(softness<.7?'탱글탱글':softness>1.2?'흐물흐물':'말랑말랑');}
document.querySelectorAll('.mode').forEach(btn=>btn.addEventListener('click',strengthLabel));
$('#softness').addEventListener('input',e=>{softness=+e.target.value;strengthLabel();});

$('#reset').addEventListener('click',resetModel);
let last=performance.now(),frame=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.032);last=now;frame++;
  const force=mode==='wax'?waxStrength:softness;
  wax?.update(dt,now,interaction?.kind==='wax',point,force);
  if(wax&&mode==='wax'){stage.dataset.waxBroken=String(wax.broken);stage.dataset.waxDamage=wax.pressure.toFixed(3);stage.dataset.waxPanels=String(wax.parts.length);waxAudio.knead(wax.exposed,interaction?.kind==='wax',now);}
  root.position.y=reduced?0:Math.sin(now*.0015)*.025;
  let maxDist=0;
  for(const m of meshes){const a=m.mesh.geometry.attributes.position.array,b=mode==='wax'?m.rest:m.base,v=m.velocity;for(let i=0;i<a.length;i+=3){let tx=b[i],ty=b[i+1],tz=b[i+2];
    if(interaction){
      const dx=tx-point.x,dy=ty-point.y,dz=tz-point.z;const radius=.73+force*.13;const w=Math.exp(-(dx*dx+dy*dy+dz*dz)/(radius*radius)*2.7);
      if(interaction.kind==='pinch'){tx+=(delta.x+normal.x*.18)*w*force;ty+=(delta.y+normal.y*.18)*w*force;tz+=(delta.z+normal.z*.18)*w*force;}
      else{const depth=Math.min(.6,(now-interaction.started)/1100+.12)*force;tx-=normal.x*depth*w;ty-=normal.y*depth*w;tz-=normal.z*depth*w;}
    }
    for(let k=0;k<3;k++){const target=k===0?tx:k===1?ty:tz;v[i+k]+=((target-a[i+k])*210-v[i+k]*(reduced?30:13))*dt;a[i+k]+=v[i+k]*dt;maxDist=Math.max(maxDist,Math.abs(a[i+k]-m.base[i+k]));}
  }m.mesh.geometry.attributes.position.needsUpdate=true;if(frame%2===0)m.mesh.geometry.computeVertexNormals();}
  stage.dataset.deformation=maxDist.toFixed(3);renderer.render(scene,camera);
}
requestAnimationFrame(animate);














