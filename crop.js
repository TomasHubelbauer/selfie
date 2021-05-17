export default function crop(/** @type {CanvasImageSource} */ source, /** @type {{ readonly x: number; readonly y: number; readonly width: number; readonly height: number; }} */ region) {
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext('2d');
  context.drawImage(source, -region.x, -region.y);
  return canvas;
}
