window.addEventListener('load', async () => {
  // Create a canvas to randomly place the rectangle area defining markers
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  document.body.append(canvas);

  let count = 100;
  while (count-- > 0) {
    await test();
  }
});

async function test() {
  const canvas = document.getElementsByTagName('canvas')[0];

  // Generate random coordinates for the two markers (top-left & bottom-right)
  const x1 = (Math.random() * canvas.width);
  const y1 = (Math.random() * canvas.height);
  const x2 = (Math.random() * canvas.width);
  const y2 = (Math.random() * canvas.height);

  const width = x2 - x1;
  const height = y2 - y1;
  console.log(`1: ${x1.toFixed(2)} x ${y1.toFixed(2)}`);
  console.log(`2: ${x2.toFixed(2)} × ${y2.toFixed(2)}`);
  console.log(`${~~width} × ${~~height}`);

  const context = canvas.getContext('2d');

  // Fill the canvas with random noise to introduce false-positive markers
  generate(context);

  // Mark the faux-screenshot with the top-left and bottom-right marker pixels
  mark(context, x1, y1, x2, y2);

  const _canvas = await snap();
  canvas.replaceWith(_canvas);

  // Define a tolerance for how much each channel of the marker pixel can differ
  const tolerance = 5;

  console.time('✓');

  // Scan the pixels to find the position of the top-left marker knowing size
  const { x, y } = scan(context, tolerance, width, height);
  if (x !== ~~x1 || y !== ~~y1) {
    throw new Error('Bah!');
  }

  console.timeEnd('✓');
}

// TODO: Replace with the actual screen share functionality API call in index.js
async function snap() {
  // Capture the canvas with lossy compression to simulate screen share API snap
  const canvas = document.getElementsByTagName('canvas')[0];
  const url = canvas.toDataURL('image/jpeg', .1);
  const img = document.createElement('img');
  await new Promise((resolve, reject) => {
    img.addEventListener('load', resolve);
    img.addEventListener('error', reject);
    img.src = url;
  });

  // Return the deep fried version of the original image to simulate the API
  const _canvas = document.createElement('canvas');
  _canvas.width = canvas.width;
  _canvas.height = canvas.height;
  const context = _canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  return _canvas;
}

function generate(/** @type {CanvasRenderingContext2D} */ context) {
  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  for (let y = 0; y < context.canvas.height; y++) {
    for (let x = 0; x < context.canvas.width; x++) {
      const index = y * context.canvas.width * 4 + x * 4;
      imageData.data[index + 0] = Math.random() * 255; // R
      imageData.data[index + 1] = Math.random() * 255; // G
      imageData.data[index + 2] = Math.random() * 255; // B
      imageData.data[index + 3] = 255; // A
    }
  }

  context.putImageData(imageData, 0, 0);
}

function mark(/** @type {CanvasRenderingContext2D} */ context, /** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2) {
  // Draw borders around the marker pixels to lessen compression color artifacts
  context.fillStyle = 'white';
  context.fillRect(x1 - 2, y1 - 2, 4, 4);
  context.fillRect(x2 - 2, y2 - 2, 4, 4);

  // Mark the top-left red and bottom-right marker pixels in the faux-screenshot
  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const index1 = ~~y1 * context.canvas.width * 4 + ~~x1 * 4;
  imageData.data[index1 + 0] = 255; // R
  imageData.data[index1 + 1] = 0; // G
  imageData.data[index1 + 2] = 0; // B
  const index2 = ~~y2 * context.canvas.width * 4 + ~~x2 * 4;
  imageData.data[index2 + 0] = 0; // R
  imageData.data[index2 + 1] = 255; // G
  imageData.data[index2 + 2] = 0; // B
  context.putImageData(imageData, 0, 0);
}

function scan(/** @type {CanvasRenderingContext2D} */ context, /** @type {number} */ tolerance, /** @type {number} */ width, /** @type {number} */ height, log = false) {
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
        console.group(x, y, r, g, b);
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
            console.log(x + _x + ~~width, y + _y + ~~height, r, g, b);
          }

          // Reject pixels which do not resembles the lime bottom-right marker pixel
          if (r > tolerance || g < 255 - tolerance || b > tolerance) {
            continue;
          }

          if (log) {
            console.groupEnd();
          }

          return { x, y };
        }
      }

      if (log) {
        console.groupEnd();
      }
    }
  }
}
