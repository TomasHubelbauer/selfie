export default function crop(source, region) {
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext('2d');
  context.drawImage(source, -region.x, -region.y);
  return canvas;
}
