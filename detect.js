window.addEventListener('load', async () => {
  const title = document.title;
  const img = document.getElementById('input');

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  img.addEventListener('mousemove', event => {
    const { width, height } = img.getBoundingClientRect();
    const ratioX = event.offsetX / width;
    const ratioY = event.offsetY / height;
    const x = ~~(ratioX * img.naturalWidth);
    const y = ~~(ratioY * img.naturalHeight);
    const index = y * imageData.width * 4 + x * 4;;
    const color24 = imageData.data.slice(index, index + 3).join();
    const color8 = pixel(imageData, x, y);
    document.title = `${x}×${y}: ${color24} / ${color8}`;
  });

  img.addEventListener('mouseout', () => document.title = title);

  // TODO: Detect and remove the first and last rows and columns of the same color
  for await (const region of detect(imageData)) {
    const canvas = document.createElement('canvas');
    canvas.width = region.width;
    canvas.height = region.height;
    const context = canvas.getContext('2d');
    context.drawImage(img, -region.x, -region.y);
    document.body.append(canvas);
  }

  context.putImageData(imageData, 0, 0);
  img.src = canvas.toDataURL();
});

function pixel(/** @type {ImageData} */ imageData, /** @type {number} */ x, /** @type {number} */ y) {
  // Note that `ImageData` are always RGBA (4 channels)
  const index = y * imageData.width * 4 + x * 4;
  if (imageData.data[index + 3] !== 255) {
    throw new Error(`Transparent pixels are not supported: ${x}x${y}: ${imageData.data.slice(index, index + 4)}`);
  }

  // Convert the slice to an array of numbers to get plain array `map`
  const channels = [...imageData.data.slice(index, index + 3).values()];
  return channels.map(channel => (~~(channel / 128) * 8).toString(16)).join('');
}

async function* detect(/** @type {ImageData} */ imageData) {
  const title = document.title;

  // Do not look past these limits because no contentful rectangle would fit
  const maxWidth = imageData.width - 3;
  const maxHeight = imageData.height - 3;
  const maxArea = maxWidth * maxHeight;

  const regions = [];

  // Find candidate outline rectangle top-left corner pixels
  for (let y = 0; y < maxHeight; y++) {
    document.title = `${(y / maxHeight * 100).toFixed(2)} %`;
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
      if (regions.find(region => x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height)) {
        continue point;
      }

      const region = { x, y, width, height };
      regions.push(region);
      yield region;
    }
  }

  document.title = title;
  return regions;
}
