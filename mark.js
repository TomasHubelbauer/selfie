export default function mark(/** @type {CanvasRenderingContext2D} */ context, /** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2) {
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
