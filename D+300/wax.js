import * as THREE from 'three';
import { buildPanels, panelGeometry } from './wax-geometry.js';

export class WaxShell {
  constructor(root,items,onBreak,onCrackle,theme={}){
    this.root=root;this.items=items;this.onBreak=onBreak;this.onCrackle=onCrackle;this.group=new THREE.Group();root.add(this.group);
    this.edgeColor=theme.edge??0x568da4;
    this.material=new THREE.MeshPhysicalMaterial({color:theme.coating??0xa9dbed,transparent:true,opacity:.26,roughness:.3,metalness:0,clearcoat:.7,clearcoatRoughness:.2,side:THREE.DoubleSide,depthWrite:false});this.material.forceSinglePass=true;
    this.parts=[];this.plain=[];this.active=false;this.auto=true;this.pressure=0;this.broken=false;this.grip=0;this.exposed=0;this.reset();
  }
  clear(){for(const part of this.parts){this.group.remove(part.mesh);part.lines.geometry.dispose();part.lines.material.dispose();part.mesh.geometry.dispose();part.mesh.material.dispose();}this.parts=[];for(const mesh of this.plain){this.group.remove(mesh);mesh.geometry.dispose();}this.plain=[];}
  reset(){
    this.clear();this.pressure=0;this.broken=false;this.grip=0;this.exposed=0;this.rebuildAt=0;
    for(const item of this.items){const geometry=item.mesh.geometry.clone(),p=geometry.attributes.position,n=geometry.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.085,p.getY(i)+n.getY(i)*.085,p.getZ(i)+n.getZ(i)*.085);const mesh=new THREE.Mesh(geometry,this.material);mesh.renderOrder=2;this.group.add(mesh);this.plain.push(mesh);}
    this.group.visible=this.active;
  }
  setActive(active){this.active=active;this.reset();}
  targets(){return this.active?(this.parts.length?this.parts.filter(p=>!p.detached).map(p=>p.mesh):this.plain):[];}
  build(point){
    for(const mesh of this.plain)mesh.visible=false;
    for(const panel of buildPanels(this.items,point)){
      const shape=panelGeometry(panel.vertices),mesh=new THREE.Mesh(shape.geometry,this.material.clone());mesh.position.copy(shape.origin);mesh.renderOrder=2;this.group.add(mesh);
      const lines=new THREE.LineSegments(shape.lineGeometry,new THREE.LineBasicMaterial({color:this.edgeColor,transparent:true,opacity:0,depthWrite:false}));lines.renderOrder=3;mesh.add(lines);
      this.parts.push({...shape,mesh,lines,item:panel.item,base:panel.base,samples:panel.samples,velocity:new THREE.Vector3(),spin:new THREE.Vector3(),damage:0,cracked:false,detached:false,threshold:.88+Math.random()*.1});
    }
  }
  detach(part){if(part.detached)return;part.detached=true;part.damage=1;part.mesh.material.opacity=.46;part.lines.material.opacity=.2;part.velocity.copy(part.out).multiplyScalar(.18+Math.random()*.22);part.velocity.y=.05+Math.random()*.18;part.spin.set((Math.random()-.5)*3,(Math.random()-.5)*3,(Math.random()-.5)*3);part.floor=.035+Math.random()*.07;}
  complete(now){if(this.broken)return;this.broken=true;this.pressure=1;this.exposed=1;this.rebuildAt=now+2200;this.onBreak();}
  burst(now){if(!this.parts.length)this.build(new THREE.Vector3(0,1.5,1));for(const part of this.parts)this.detach(part);this.onCrackle(1,this.parts.length);this.complete(now);}
  update(dt,now,pressing,point,softness,all=false){
    if(!this.active)return;if(pressing&&!this.parts.length)this.build(point);if(!this.parts.length)return;
    this.grip=pressing?this.grip+dt:0;let cracks=0,drops=0,damage=0,remaining=0,dropped=0;
    const force=.18+Math.min(1,this.grip/1.2),offset=new THREE.Vector3(),target=new THREE.Vector3();
    for(const part of this.parts){
      if(part.detached){
        dropped++;part.velocity.y-=6.2*dt;part.mesh.position.addScaledVector(part.velocity,dt);part.mesh.rotation.x+=part.spin.x*dt;part.mesh.rotation.y+=part.spin.y*dt;part.mesh.rotation.z+=part.spin.z*dt;
        if(part.mesh.position.y<part.floor){part.mesh.position.y=part.floor;part.velocity.y=Math.abs(part.velocity.y)*.08;part.velocity.x*=.85;part.velocity.z*=.85;part.spin.multiplyScalar(.75);}
      }else{
        offset.set(0,0,0);const a=part.item.mesh.geometry.attributes.position.array;
        for(const id of part.samples){const i=id*3;offset.x+=a[i]-part.base[i];offset.y+=a[i+1]-part.base[i+1];offset.z+=a[i+2]-part.base[i+2];}offset.divideScalar(part.samples.length);
        const distance=target.copy(part.origin).add(offset).distanceTo(point),reach=1.05;
        if(pressing&&(all||distance<reach)){
          const weight=all?1:Math.pow(1-distance/reach,.65);
          part.damage=Math.min(1,part.damage+dt*(all?2.6:2.3*force*weight)*(softness*.35+.65));
          if(!part.cracked&&part.damage>=.28){part.cracked=true;cracks++;}
          if(part.cracked&&part.damage>=part.threshold){this.detach(part);drops++;dropped++;}
        }
        if(!part.detached){
          target.copy(part.origin).addScaledVector(offset,.7).addScaledVector(part.out,-part.damage*.018);
          part.mesh.position.lerp(target,Math.min(1,dt*20));part.mesh.rotation.z=part.cracked?Math.sin(part.origin.x*12+part.origin.y*9)*.04*part.damage:0;
          part.lines.material.opacity=part.cracked?.24+part.damage*.25:0;remaining++;
        }
      }
      damage+=part.damage;
    }
    this.pressure=damage/this.parts.length;this.exposed=dropped/this.parts.length;
    if(cracks)this.onCrackle(.25+force*.2,cracks);
    if(drops)this.onCrackle(.6+force*.3,drops);
    if(!remaining&&!this.broken)this.complete(now);
    if(this.broken&&this.auto&&now>=this.rebuildAt&&!pressing)this.reset();
  }
  dispose(){this.clear();this.root.remove(this.group);this.material.dispose();}
}

