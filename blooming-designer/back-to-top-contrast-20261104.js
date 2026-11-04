(() => {
  const button = document.querySelector('.back-to-top');
  const imageCache = new WeakMap();
  let frame = 0, currentInk = '';
  const linear = value => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
  };
  const luminance = rgb => .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
  function imageColor(img, x, y) {
    if (!img.complete || !img.naturalWidth) return null;
    let sample = imageCache.get(img);
    if (!sample || sample.src !== img.currentSrc) {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 128 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const context = canvas.getContext('2d', {willReadFrequently:true});
      try {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        sample = {src:img.currentSrc, width:canvas.width, height:canvas.height,
          pixels:context.getImageData(0, 0, canvas.width, canvas.height).data};
        imageCache.set(img, sample);
      } catch { return null; }
    }
    const rect = img.getBoundingClientRect(), style = getComputedStyle(img);
    const scale = style.objectFit === 'contain'
      ? Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight)
      : Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const position = style.objectPosition.split(' ');
    const offset = (value, space) => value.endsWith('%') ? parseFloat(value) * space / 100 : parseFloat(value) || 0;
    const sx = (x - rect.left - offset(position[0], rect.width - img.naturalWidth * scale)) / scale;
    const sy = (y - rect.top - offset(position[1] || '50%', rect.height - img.naturalHeight * scale)) / scale;
    if (sx < 0 || sy < 0 || sx >= img.naturalWidth || sy >= img.naturalHeight) return null;
    const px = Math.min(sample.width - 1, Math.floor(sx / img.naturalWidth * sample.width));
    const py = Math.min(sample.height - 1, Math.floor(sy / img.naturalHeight * sample.height));
    const index = (py * sample.width + px) * 4;
    if (sample.pixels[index + 3] < 255) return null;
    return sample.pixels.subarray(index, index + 3);
  }
  function backdropColor(x, y) {
    for (const element of document.elementsFromPoint(x, y)) {
      if (button.contains(element)) continue;
      if (element.tagName === 'IMG') {
        const rgb = imageColor(element, x, y);
        if (rgb) return rgb;
      }
      const color = getComputedStyle(element).backgroundColor.match(/[\d.]+/g);
      if (color && color.length >= 3 && (color.length < 4 || Number(color[3]) === 1)) return color.slice(0, 3).map(Number);
    }
    return [255, 255, 255];
  }
  function updateContrast() {
    frame = 0;
    if (button.hidden || !button.classList.contains('is-visible')) return;
    const rect = button.getBoundingClientRect();
    let light = 0;
    // Sample the arrow and surrounding outline without tinting the transparent interior.
    for (const dx of [.2, .5, .8]) for (const dy of [.2, .5, .8]) {
      light += luminance(backdropColor(rect.left + rect.width * dx, rect.top + rect.height * dy));
    }
    light /= 9;
    const blackContrast = (light + .05) / .05;
    const whiteContrast = 1.05 / (light + .05);
    const ink = blackContrast >= whiteContrast ? '#000' : '#fff';
    if (ink !== currentInk) {
      currentInk = ink;
      button.style.setProperty('--top-ink', ink);
    }
  }
  function scheduleContrast() {
    if (!frame) frame = requestAnimationFrame(updateContrast);
  }
  addEventListener('scroll', scheduleContrast, {passive:true});
  addEventListener('resize', scheduleContrast, {passive:true});
  document.addEventListener('load', event => {
    if (event.target.tagName === 'IMG') scheduleContrast();
  }, true);
  document.fonts.ready.then(scheduleContrast);
  scheduleContrast();
})();
