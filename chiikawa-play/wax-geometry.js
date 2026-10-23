import * as THREE from 'three';

const thickness=.085;
function closest(cloud,target){let result=0,best=Infinity;for(let i=0;i<cloud.length;i++){const d=cloud[i].distanceToSquared(target);if(d<best){best=d;result=i;}}return result;}
function seedsFor(cloud,point){
  const seeds=[],push=p=>{if(seeds.every(s=>s.distanceToSquared(p)>.0064))seeds.push(p.clone());};
  const center=new THREE.Box3().setFromPoints(cloud).getCenter(new THREE.Vector3()),contact=cloud[closest(cloud,point)];push(contact);
  const normal=contact.clone().sub(center).normalize(),u=new THREE.Vector3(0,1,0).cross(normal);if(u.lengthSq()<.01)u.set(1,0,0);u.normalize();const v=normal.clone().cross(u).normalize();
  for(let ring=0;ring<5;ring++)for(let i=0;i<5+ring;i++){
    const angle=(i+Math.random()*.5)*Math.PI*2/(5+ring),radius=(.13+ring*.12)*(.88+Math.random()*.24);
    const target=contact.clone().addScaledVector(u,Math.cos(angle)*radius).addScaledVector(v,Math.sin(angle)*radius);push(cloud[closest(cloud,target)]);
  }
  const distances=cloud.map(p=>Math.min(...seeds.map(s=>s.distanceToSquared(p))));
  while(seeds.length<90){let best=-1,index=0;for(let i=0;i<cloud.length;i++){const score=distances[i]*(.9+Math.random()*.2);if(score>best){best=score;index=i;}}if(best<.008)break;const next=cloud[index];seeds.push(next.clone());for(let i=0;i<cloud.length;i++)distances[i]=Math.min(distances[i],next.distanceToSquared(cloud[i]));}
  return seeds;
}
function clip(polygon,n,limit){
  const output=[];for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],da=a.dot(n)-limit,db=b.dot(n)-limit;
    if(da<=1e-7)output.push(a);if((da<0&&db>0)||(da>0&&db<0))output.push(a.clone().lerp(b,da/(da-db)));
  }return output;
}
// Convex Voronoi half-planes cut boundary triangles into straight polygon panels.
export function buildPanels(items,point){
  const surfaces=items.map(item=>{
    const g=item.mesh.geometry,p=g.attributes.position,n=g.attributes.normal,points=[];
    for(let i=0;i<p.count;i++)points.push(new THREE.Vector3(p.getX(i)+n.getX(i)*thickness,p.getY(i)+n.getY(i)*thickness,p.getZ(i)+n.getZ(i)*thickness));
    return {item,points,index:g.index,base:p.array.slice()};
  });
  const seeds=seedsFor(surfaces.flatMap(s=>s.points),point),planes=seeds.map((seed,i)=>seeds.map((other,j)=>({j,n:other.clone().sub(seed),limit:(other.lengthSq()-seed.lengthSq())*.5,d:other.distanceToSquared(seed)})).filter(p=>p.j!==i).sort((a,b)=>a.d-b.d));
  const panels=[];
  for(const surface of surfaces){
    const nearest=surface.points.map(p=>closest(seeds,p)),buckets=new Map(),count=surface.index?surface.index.count:surface.points.length;
    const add=(cell,polygon,ids)=>{if(polygon.length<3)return;if(!buckets.has(cell))buckets.set(cell,{vertices:[],samples:new Set()});const b=buckets.get(cell);for(const id of ids)b.samples.add(id);for(let k=1;k<polygon.length-1;k++)for(const p of [polygon[0],polygon[k],polygon[k+1]])b.vertices.push(p.x,p.y,p.z);};
    for(let i=0;i<count;i+=3){
      const ids=[0,1,2].map(k=>surface.index?surface.index.getX(i+k):i+k),triangle=ids.map(id=>surface.points[id]),cells=new Set(ids.map(id=>nearest[id]));
      if(cells.size===1){add(nearest[ids[0]],triangle,ids);continue;}
      const center=triangle[0].clone().add(triangle[1]).add(triangle[2]).multiplyScalar(1/3);cells.add(closest(seeds,center));
      for(const cell of cells){let polygon=triangle;for(const plane of planes[cell]){polygon=clip(polygon,plane.n,plane.limit);if(polygon.length<3)break;}add(cell,polygon,ids);}
    }
    for(const bucket of buckets.values())panels.push({...bucket,item:surface.item,base:surface.base,samples:[...bucket.samples]});
  }
  return panels;
}

export function panelGeometry(vertices){
  const front=new THREE.BufferGeometry();front.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));front.computeBoundingBox();
  const origin=front.boundingBox.getCenter(new THREE.Vector3()),out=origin.clone().sub(new THREE.Vector3(0,1.6,0)).normalize();front.translate(-origin.x,-origin.y,-origin.z);
  const edges=new Map(),p=front.attributes.position;
  for(let i=0;i<p.count;i+=3)for(let k=0;k<3;k++){
    const a=new THREE.Vector3().fromBufferAttribute(p,i+k),b=new THREE.Vector3().fromBufferAttribute(p,i+(k+1)%3),key=[a,b].map(v=>[v.x,v.y,v.z].map(x=>Math.round(x*100000)).join(',')).sort().join('|');
    const edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{count:1,a,b});
  }
  const boundary=[],solid=[...p.array],back=v=>v.clone().addScaledVector(out,-.026);
  for(let i=0;i<p.count;i+=3)for(const k of [2,1,0])solid.push(...back(new THREE.Vector3().fromBufferAttribute(p,i+k)).toArray());
  for(const edge of edges.values())if(edge.count===1){const {a,b}=edge,c=back(a),d=back(b);boundary.push(...a.toArray(),...b.toArray());for(const v of [a,c,b,b,c,d])solid.push(...v.toArray());}
  front.dispose();const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(solid,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(boundary,3));
  return {geometry,lineGeometry,origin,out};
}
