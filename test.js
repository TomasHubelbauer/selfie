import mark from './mark.js';
import scan from './scan.js';

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

function log(message) {
  console.log(message);
  const div = document.createElement('div');
  div.textContent = message;
  document.body.append(div);
}

async function test() {
  const canvas = document.getElementsByTagName('canvas')[0];

  // Generate random coordinates for the two markers (top-left & bottom-right)
  const x1 = (Math.random() * canvas.width);
  const y1 = (Math.random() * canvas.height);
  const x2 = (Math.random() * canvas.width);
  const y2 = (Math.random() * canvas.height);

  const width = x2 - x1;
  const height = y2 - y1;
  log(`1: ${x1.toFixed(2)} x ${y1.toFixed(2)}`);
  log(`2: ${x2.toFixed(2)} × ${y2.toFixed(2)}`);
  log(`${~~width} × ${~~height}`);

  const context = canvas.getContext('2d');

  // Fill the canvas with random noise to introduce false-positive markers
  generate(context);

  // Mark the faux-screenshot with the top-left and bottom-right marker pixels
  mark(context, x1, y1, x2, y2);

  const _canvas = await snap();
  canvas.replaceWith(_canvas);

  // Define a tolerance for how much each channel of the marker pixel can differ
  const tolerance = 5;

  const stopwatch = window.performance.now();

  // Scan the pixels to find the position of the top-left marker knowing size
  const { x, y } = scan(context, tolerance, width, height);
  if (x !== ~~x1 || y !== ~~y1) {
    throw new Error('Bah!');
  }

  log(`✓ (${window.performance.now() - stopwatch} ms)`);
}

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
