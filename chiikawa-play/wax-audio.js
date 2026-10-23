// User-requested recording grains from the reference's publicly loaded library.
export class WaxAudio {
  constructor(getContext){this.getContext=getContext;this.buffers={};this.last={};this.nextTick=0;this.voices=0;this.error=null;this.ready=this.load();}
  async load(){try{
    const manifest=await fetch('./assets/audio/manifest.json').then(r=>{if(!r.ok)throw Error('Audio manifest');return r.json();});
    const decoder=new OfflineAudioContext(1,1,44100),tasks=[];
    for(const [library,groups] of Object.entries(manifest))for(const [level,files] of Object.entries(groups)){
      const key=library+'/'+level;this.buffers[key]=[];
      for(const file of files)tasks.push((async()=>{const response=await fetch(`./assets/audio/${library}/${file}`);if(!response.ok)throw Error('Audio grain');const decoded=await decoder.decodeAudioData(await response.arrayBuffer());this.buffers[key].push(decoded);})());
    }
    await Promise.all(tasks);document.body.dataset.waxAudio='recordings-ready';
  }catch(error){this.error=error;document.body.dataset.waxAudio='unavailable';console.error('Wax recordings could not load',error);}}
  play(key,{gain=.22,rate=1,delay=0}={}){
    const options=this.buffers[key];if(!options?.length||this.voices>=10)return false;
    const context=this.getContext();if(!context||context.state!=='running')return false;
    let index=Math.floor(Math.random()*options.length);if(options.length>1&&index===this.last[key])index=(index+1)%options.length;this.last[key]=index;
    const source=context.createBufferSource(),volume=context.createGain();source.buffer=options[index];source.playbackRate.value=rate;
    if(!this.master){this.master=context.createDynamicsCompressor();this.master.threshold.value=-12;this.master.knee.value=12;this.master.ratio.value=3;this.master.attack.value=.003;this.master.release.value=.08;this.master.connect(context.destination);}
    volume.gain.value=gain*2;source.connect(volume).connect(this.master);source.start(context.currentTime+delay);this.voices++;
    document.body.dataset.waxAudioPlayed=String(this.played=(this.played||0)+1);document.body.dataset.waxAudioLast=key;
    source.onended=()=>{this.voices--;source.disconnect();volume.disconnect();};return true;
  }
  crack(intensity=.3,count=1){
    const context=this.getContext();if(!context)return;
    const now=context.currentTime,level=intensity<.42?'soft':intensity<.76?'mid':'hard';
    const ticks=Math.min(count>10?6:4,Math.max(1,Math.ceil(count*.5)));
    for(let i=0;i<ticks;i++){
      const at=Math.max(now,this.nextTick);this.nextTick=at+(intensity<.42?.22:.055)+Math.random()*.035;
      this.play('waxball/'+(count>10&&i===0?'burst':level),{gain:.18+intensity*.16,rate:.94+Math.random()*.12,delay:Math.min(.35,at-now)});
    }
    this.nextTick=Math.min(this.nextTick,now+.4);
  }
  touch(){this.play('squishy/soft',{gain:.11,rate:.62});}
  knead(exposed,moving,now){if(!moving||exposed<.04||now-(this.lastKnead||0)<230)return;this.lastKnead=now;this.play('squishy/soft',{gain:.08+exposed*.14,rate:.54+Math.random()*.14});}
}


