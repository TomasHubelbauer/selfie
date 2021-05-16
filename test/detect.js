import detect, { pixel } from '../detect.js';
import crop from '../crop.js';

window.addEventListener('load', async () => {
  const img = document.getElementsByTagName('img')[0];

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const p = document.getElementsByTagName('p')[0];

  function handleMouseMove(event) {
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height } = canvas.getBoundingClientRect();
    const ratioX = event.offsetX / width;
    const ratioY = event.offsetY / height;
    const x = ~~(ratioX * canvas.width);
    const y = ~~(ratioY * canvas.height);
    const index = y * imageData.width * 4 + x * 4;;
    const color256 = imageData.data.slice(index, index + 3).join();
    const color8 = pixel(imageData, x, y);
    p.textContent = `${x}×${y}, rgb(${color256}), #${color8}`;
  }

  function handleMouseOut() {
    p.textContent = '';
  }

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseout', handleMouseOut);

  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.replaceWith(canvas);

  // TODO: Detect and remove the first and last rows and columns of the same color
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for await (const region of detect(imageData)) {
    const canvas = crop(img, region);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    document.body.append(canvas);
    document.body.append(`${region.x}×${region.y} (${region.width}×${region.height}, ${region.x + region.width}×${region.y + region.height})`);
  }

  p.textContent = 'Done';
});
