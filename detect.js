export function pixel(/** @type {ImageData} */ imageData, /** @type {number} */ x, /** @type {number} */ y) {
  // Note that `ImageData` are always RGBA (4 channels)
  const index = y * imageData.width * 4 + x * 4;
  if (imageData.data[index + 3] !== 255) {
    throw new Error(`Transparent pixels are not supported: ${x}x${y}: ${imageData.data.slice(index, index + 4)}`);
  }

  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];

  // Posterize by reducing its color pallete making more colors match
  // Note that if we don't, image compression color artifacts will make same colors mismatch
  const poster = 4;
  const factor = poster * 16;
  return (~~(r / factor) * poster).toString(16) + (~~(g / factor) * poster).toString(16) + (~~(b / factor) * poster).toString(16);
}

export default async function* detect(/** @type {ImageData} */ imageData) {
  // Do not look past these limits because no contentful rectangle would fit
  const maxWidth = imageData.width - 3;
  const maxHeight = imageData.height - 3;
  const maxArea = maxWidth * maxHeight;

  const regions = [];

  // Find candidate outline rectangle top-left corner pixels
  for (let y = 0; y < maxHeight; y++) {
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

      let top = 0;
      while ([...Array(width).keys()].every(_x => pixel(imageData, x + _x, y + top) === color)) {
        top++;
      }

      let bottom = 0;
      while ([...Array(width).keys()].every(_x => pixel(imageData, x + _x, y + height - bottom - 1) === color)) {
        bottom++;
      }

      let left = 0;
      while ([...Array(height).keys()].every(_y => pixel(imageData, x + left, y + _y) === color)) {
        left++;
      }

      let right = 0;
      while ([...Array(height).keys()].every(_y => pixel(imageData, x + width - right - 1, y + _y) === color)) {
        right++;
      }

      // Calculate crop off amounts to get rid of the marker outline remains
      yield { x: x + left + 2, y: y + top + 2, width: width - left - right - 4, height: height - top - bottom - 4 };

      // Keep track of the region to detect overlapping region matches
      regions.push({ x, y, width, height });
    }
  }
}
