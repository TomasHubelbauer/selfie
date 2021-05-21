export default class DebugCanvas extends HTMLCanvasElement {
  constructor(/** @type {HTMLCanvasElement} */ canvas) {
    super();

    const zoom = 20;
    let x = 0;
    let y = 0;

    let move = true;

    let cropX;
    let cropY;

    this.width = canvas.width;
    this.height = canvas.height;
    this.style.cursor = 'none';

    const context = this.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, x, y, this.width * zoom, this.height * zoom);

    this.addEventListener('mousemove', event => {
      move = true;

      const { width, height } = this.getBoundingClientRect();
      const widthFactor = this.width / width;
      const heightFactor = this.height / height;

      if (event.buttons === 1) {
        x += event.movementX * widthFactor * zoom;
        y += event.movementY * heightFactor * zoom;
      }

      const textureX = ~~(((event.offsetX * widthFactor) - x) / zoom);
      const textureY = ~~(((event.offsetY * heightFactor) - y) / zoom);

      context.clearRect(0, 0, this.width, this.height);
      context.drawImage(canvas, x, y, this.width * zoom, this.height * zoom);

      context.strokeRect(x + textureX * zoom, y + textureY * zoom, zoom, zoom);

      // TODO: Fix this showing incorrect values
      const pixel = context.getImageData(x + textureX * zoom + 1, y + textureY * zoom + 1, 1, 1).data.slice(0, 3).join(', ');
      const text = `${textureX}×${textureY}: ${pixel}`;
      context.font = 'normal 50pt sans-serif';
      const length = context.measureText(text).width;

      context.fillStyle = 'white';
      context.fillRect(0, 0, length + 25, 75);
      context.fillStyle = 'black';
      context.fillText(text, 15, 55);
    });

    this.addEventListener('mouseup', event => {
      if (move) {
        move = false;
        return;
      }

      move = false;

      const { width, height } = this.getBoundingClientRect();
      const widthFactor = this.width / width;
      const heightFactor = this.height / height;

      if (cropX === undefined && cropY === undefined) {
        cropX = ~~(((event.offsetX * widthFactor) - x) / zoom);
        cropY = ~~(((event.offsetY * heightFactor) - y) / zoom);
        console.log(cropX, cropY);
        return;
      }

      const cropWidth = ~~(((event.offsetX * widthFactor) - x) / zoom) - cropX + 1;
      const cropHeight = ~~(((event.offsetY * heightFactor) - y) / zoom) - cropY + 1;
      console.log(~~(((event.offsetX * widthFactor) - x) / zoom), ~~(((event.offsetY * heightFactor) - y) / zoom), cropWidth, cropHeight);

      const img = document.createElement('img');
      img.src = crop(canvas, { x: cropX, y: cropY, width: cropWidth, height: cropHeight }).toDataURL();
      img.width = cropWidth * 10;
      img.height = cropHeight * 10;
      img.style.imageRendering = 'crisp-edges';

      cropX = undefined;
      cropY = undefined;

      const name = prompt('browser-marker-scale-color');
      if (!name) {
        return;
      }

      const a = document.createElement('a');
      a.download = name;
      a.href = img.src;
      a.click();
    });
  }
}

customElements.define('selfie-debug-canvas', DebugCanvas, { extends: 'canvas' });
