/* Select enough source pixels for cover cropping, hover zoom and the current DPR. */
(()=>{const images=[...document.querySelectorAll('img[data-crisp-thumbnail]')];let frame=0;
function update(){frame=0;for(const img of images){const width=img.clientWidth,height=img.clientHeight;if(!width||!height)continue;const ratio=+img.getAttribute('width')/+img.getAttribute('height');const pixels=Math.ceil(Math.max(width,height*ratio)*1.04);const sizes=pixels+'px';if(img.sizes!==sizes)img.sizes=sizes;}}
function queue(){if(!frame)frame=requestAnimationFrame(update)}
const observer=new ResizeObserver(queue);images.forEach(img=>observer.observe(img));addEventListener('resize',queue,{passive:true});update();})();
