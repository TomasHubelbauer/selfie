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
  const progress = document.getElementsByTagName('progress')[0];
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for await (const region of detect(imageData, percentage => { progress.value = percentage; p.textContent = percentage + ' %'; })) {
    const canvas = document.createElement('canvas');
    canvas.width = region.width;
    canvas.height = region.height;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    const context = canvas.getContext('2d');
    context.drawImage(img, -region.x, -region.y);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const color = pixel(imageData, 0, 0);

    let top = 0;
    while ([...Array(canvas.width).keys()].every(x => pixel(imageData, x, top) === color)) {
      top++;
    }

    let bottom = 0;
    while ([...Array(canvas.width).keys()].every(x => pixel(imageData, x, canvas.height - bottom - 1) === color)) {
      bottom++;
    }

    let left = 0;
    while ([...Array(canvas.height).keys()].every(y => pixel(imageData, left, y) === color)) {
      left++;
    }

    let right = 0;
    while ([...Array(canvas.height).keys()].every(y => pixel(imageData, left, canvas.width - right - 1) === color)) {
      right++;
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = canvas.width - left - right - 4;
    cropCanvas.height = canvas.width - top - bottom - 4;
    const cropContext = cropCanvas.getContext('2d');
    cropContext.drawImage(canvas, -left - 2, -top - 2);

    document.body.append(cropCanvas);
    document.body.append(`${region.x}×${region.y} (${region.width}×${region.height}, ${region.x + region.width}×${region.y + region.height})`);
  }

  context.putImageData(imageData, 0, 0);
  progress.remove();
  p.textContent = '';
});

function pixel(/** @type {ImageData} */ imageData, /** @type {number} */ x, /** @type {number} */ y) {
  // Note that `ImageData` are always RGBA (4 channels)
  const index = y * imageData.width * 4 + x * 4;
  if (imageData.data[index + 3] !== 255) {
    throw new Error(`Transparent pixels are not supported: ${x}x${y}: ${imageData.data.slice(index, index + 4)}`);
  }

  // Convert the slice to an array of numbers to get plain array `map`
  const channels = [...imageData.data.slice(index, index + 3).values()];

  // Posterize by reducing its color pallete making more colors match
  // Note that if we don't, image compression color artifacts will make same colors mismatch
  const poster = 4;
  return channels.map(channel => (~~(channel / (poster * 16)) * poster).toString(16)).join('');
}

async function* detect(/** @type {ImageData} */ imageData, progress) {
  // Do not look past these limits because no contentful rectangle would fit
  const maxWidth = imageData.width - 3;
  const maxHeight = imageData.height - 3;
  const maxArea = maxWidth * maxHeight;

  const regions = [];

  // Find candidate outline rectangle top-left corner pixels
  for (let y = 0; y < maxHeight; y++) {
    progress((y / maxHeight * 100).toFixed(2));
    await new Promise(resolve => setTimeout(resolve, 0));
    point: for (let x = 0; x < maxWidth; x++) {
      const color = pixel(imageData, x, y);

      // Skip colors which are only shades - we're looking for a marker outline
      if (color[0] === color[1] && color[1] === color[2] && color[2] === color[0]) {
        continue;
      }

      // See how far the current color repeats on the X axis
      let width = 0;
      while (x + width < maxWidth && pixel(imageData, x + width, y) === color) {
        width++;
      }

      // Reject if there is no space for even a single pixel within the outline
      if (width < maxWidth / 100) {
        continue;
      }

      // Adjust width to remove left border width to match right side
      width--;

      // See how far the current color repeats on the Y axis
      let height = 0;
      while (y + height < maxHeight && pixel(imageData, x, y + height) === color) {
        height++;
      }

      // Reject if there is no space for even a single pixel within the outline
      if (height < maxHeight / 100) {
        continue;
      }

      // Adjust height to remove top border height to match bottom side
      height--;

      // Reject potential outline rectangles which are too small
      const area = width * height;
      if (area / maxArea < 0.001) {
        continue;
      }

      // Reject potential rectangles whose bottom side is not same as top
      for (let index = 0; index < width; index++) {
        if (pixel(imageData, x + index, y + height) !== color) {
          continue point;
        }
      }

      // Reject potential rectangles whose right side is not same as left
      for (let index = 0; index < height; index++) {
        if (pixel(imageData, x + width, y + index) !== color) {
          continue point;
        }
      }

      // Look through the identified region to ensure it isn't solid color fill
      let solid = true;
      check: for (let _y = 0; _y < height; _y++) {
        for (let _x = 0; _x < width; _x++) {
          if (pixel(imageData, x + _x, y + _y) !== color) {
            solid = false;
            break check;
          }
        }
      }

      if (solid) {
        continue point;
      }

      // Reject origin points which originated in an area of an existing region
      // Shift by 1 top-left to merge with regions which would overlap anyway
      if (regions.find(region => x >= region.x - 1 && x <= region.x + region.width && y >= region.y - 1 && y <= region.y + region.height)) {
        continue point;
      }

      const region = { x, y, width, height };
      regions.push(region);
      yield region;
    }
  }
}
