export default function scan(/** @type {CanvasRenderingContext2D} */ context, /** @type {number} */ tolerance, /** @type {number} */ width, /** @type {number} */ height,  /** @type {number} */ marker = 1, log = false) {
  // Try normal scale and then Retina scale as a fallback
  for (let scale = 1; scale <= 2; scale++) {
    width *= scale;
    height *= scale;
    marker *= scale;

    const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const range = imageData.width * imageData.height * 4;
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const index = y * imageData.width * 4 + x * 4;
        const r = imageData.data[index + 0];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];

        // Reject pixels which do not resembles the red top-left marker pixel
        if (r < 255 - tolerance || g > tolerance || b > tolerance) {
          continue;
        }

        if (log) {
          console.group(x, y, scale, r, g, b);
        }


        // Look at the expected pair pixel and its neighbors (fractional coords)
        for (let _y = -1; _y < 2; _y++) {
          for (let _x = -1; _x < 2; _x++) {
            const index = (y + _y + ~~height) * imageData.width * 4 + (x + _x + ~~width) * 4;

            // Ignore checking for the pair pixel if it falls outside of the bitmap
            if (index < 0 || index > range) {
              continue;
            }

            const r = imageData.data[index + 0];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            if (log) {
              console.log(x + _x + ~~width, y + _y + ~~height, scale, r, g, b);
            }

            // Reject pixels which do not resembles the lime bottom-right marker pixel
            if (r > tolerance || g < 255 - tolerance || b > tolerance) {
              continue;
            }

            if (log) {
              console.groupEnd();
            }

            return { x: x + marker, y: y + marker, width: width - marker, height: height - marker };
          }
        }

        if (log) {
          console.groupEnd();
        }
      }
    }
  }
}
