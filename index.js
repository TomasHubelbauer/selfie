import snap from './snap.js';
import scan from './scan.js';
import crop from './crop.js';

window.addEventListener('load', async () => {
  const autoCrop = false;
  const supported = navigator.mediaDevices.getDisplayMedia;
  if (!supported) {
    const introP = document.getElementById('introP');
    const code = document.createElement('code');
    code.textContent = 'getDisplayMedia';
    const fragment = document.createDocumentFragment();
    fragment.append(code);
    fragment.append(' API is not supported in this browser.');
    introP.replaceWith(fragment);
  }

  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', async () => {
      try {
        // Calculate the horizontal and vertical distance between marker midpoints
        const marker = parseInt(window.getComputedStyle(document.body).getPropertyValue('--marker-size'));
        const border = parseInt(window.getComputedStyle(document.body).getPropertyValue('--marker-border'));
        const left = parseInt(window.getComputedStyle(document.body, '::before').left);
        const top = parseInt(window.getComputedStyle(document.body, '::before').top);
        const right = parseInt(window.getComputedStyle(document.body, '::after').right);
        const bottom = parseInt(window.getComputedStyle(document.body, '::after').bottom);
        const width = window.innerWidth - right - left - border * 2 - marker;
        const height = window.innerHeight - bottom - top - border * 2 - marker;

        document.body.classList.toggle('markers', true);
        const canvas = await snap();
        document.body.classList.toggle('markers', false);

        const context = canvas.getContext('2d');

        // TODO: Encode known Firefox, Chrome & Safari color values when encoded
        const region = scan(context, 120, width, height, marker, false);
        if (region === undefined || !autoCrop) {
          const fragment = document.createDocumentFragment();
          if (autoCrop) {
            const center = document.createElement('center');
            center.textContent = 'No markers found. Did you select the right tab or full screen?';
            fragment.append(center);
          }

          // TODO: Replace with a mousemove handler which shows the canvas zoomed in x10 without antialiasing
          if (!autoCrop) {
            const zoom = 10;
            let x = 0;
            let y = 0;

            let move = true;

            let cropX;
            let cropY;

            const _canvas = document.createElement('canvas');
            _canvas.width = canvas.width;
            _canvas.height = canvas.height;

            const context = _canvas.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage(canvas, x, y, _canvas.width * zoom, _canvas.height * zoom);

            _canvas.addEventListener('mousemove', event => {
              move = true;

              const { width, height } = _canvas.getBoundingClientRect();
              const widthFactor = _canvas.width / width;
              const heightFactor = _canvas.height / height;

              if (event.buttons === 1) {
                x += event.movementX * widthFactor * zoom;
                y += event.movementY * heightFactor * zoom;
              }

              const textureX = ~~(((event.offsetX * widthFactor) - x) / zoom);
              const textureY = ~~(((event.offsetY * heightFactor) - y) / zoom);

              context.clearRect(0, 0, _canvas.width, _canvas.height);
              context.drawImage(canvas, x, y, _canvas.width * zoom, _canvas.height * zoom);

              context.strokeRect(x + textureX * zoom, y + textureY * zoom, zoom, zoom);

              const pixel = context.getImageData(x + textureX * zoom + 1, y + textureY * zoom + 1, 1, 1).data.slice(0, 3).join(', ');
              const text = `${textureX}×${textureY}: ${pixel}`;
              context.font = 'normal 50pt sans-serif';
              const length = context.measureText(text).width;

              context.fillStyle = 'white';
              context.fillRect(0, 0, length + 25, 75);
              context.fillStyle = 'black';
              context.fillText(text, 15, 55);
            });

            _canvas.addEventListener('mouseup', event => {
              if (move) {
                move = false;
                return;
              }

              move = false;

              const { width, height } = _canvas.getBoundingClientRect();
              const widthFactor = _canvas.width / width;
              const heightFactor = _canvas.height / height;

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

            fragment.append(_canvas);
          }
          else {
            fragment.append(canvas);
          }

          document.body.replaceWith(fragment);
          return;
        }

        document.body.replaceWith(crop(canvas, region));
      }
      catch (error) {
        alert(error);
      }
    });
  }

  // Display usage instructions for the current browser, or none if too niche
  if (navigator.userAgent.indexOf("Chrome") != -1) {
    document.body.classList.toggle('chrome');
  }
  else if (navigator.userAgent.indexOf("Safari") != -1) {
    document.body.classList.toggle('safari');
  }
  else if (navigator.userAgent.indexOf("Firefox") != -1) {
    document.body.classList.toggle('firefox');
  }
  else if (supported) {
    document.body.classList.toggle('other');
  }
});
