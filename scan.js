import detect from './detect.js';

const red = {
  firefox: [253, 0, 0],
  safari: [151, 28, 26],
  chrome: [124, 97, 96],
  other: [255, 0, 0],
};

const lime = {
  firefox: [0, 255, 2],
  safari: [99, 215, 98],
  chrome: [179, 197, 174],
  other: [0, 255, 0],
};

const tolerance = 2;

const scales = window.devicePixelRatio === 1 ? [1] : [window.devicePixelRatio, 1];

export default function scan(/** @type {CanvasRenderingContext2D} */ context, /** @type {number} */ width, /** @type {number} */ height, log = false) {
  // Pick red and lime adjusted to browser compression color artifacts
  const browser = detect();
  const [redR, redG, redB] = red[browser];
  const [limeR, limeG, limeB] = lime[browser];

  // Do only normal scale if the screen is not scaled, otherwise the scaled with fallback to unscaled
  for (const scale of scales) {
    const scaleWidth = width * scale;
    const scaleHeight = height * scale;

    const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const range = imageData.width * imageData.height * 4;
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const index = y * imageData.width * 4 + x * 4;
        const [r, g, b] = imageData.data.slice(index, index + 3);

        // Reject pixels which do not resembles the red top-left marker pixel
        const rFail = Math.abs(redR - r) >= tolerance;
        const gFail = Math.abs(redG - g) >= tolerance;
        const bFail = Math.abs(redB - b) >= tolerance;
        if (rFail || gFail || bFail) {
          continue;
        }

        if (log) {
          console.group(x, y, scale, r, g, b);
        }

        // Look at the expected pair pixel and its neighbors (fractional coords)
        for (let _y = -scale; _y <= scale; _y++) {
          for (let _x = -scale; _x <= scale; _x++) {
            const index = (y + _y + ~~scaleHeight) * imageData.width * 4 + (x + _x + ~~scaleWidth) * 4;

            // Ignore checking for the pair pixel if it falls outside of the bitmap
            if (index < 0 || index > range) {
              continue;
            }

            const [r, g, b] = imageData.data.slice(index, index + 3);

            if (log) {
              console.log(x + _x + ~~scaleWidth, y + _y + ~~scaleHeight, scale, r, g, b);
            }

            // Reject pixels which do not resembles the lime bottom-right marker pixel
            const rFail = Math.abs(limeR - r) >= tolerance;
            const gFail = Math.abs(limeG - g) >= tolerance;
            const bFail = Math.abs(limeB - b) >= tolerance;
            if (rFail || gFail || bFail) {
              continue;
            }

            if (log) {
              console.groupEnd();
            }

            return { x: x + scale, y: y + scale, width: scaleWidth - scale, height: scaleHeight - scale };
          }
        }

        if (log) {
          console.groupEnd();
        }
      }
    }
  }
}
