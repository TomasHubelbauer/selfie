window.addEventListener('load', async () => {
  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', snap);
  }
});

async function snap() {
  try {
    const mediaStream = await navigator.mediaDevices.getDisplayMedia();

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    await video.play();

    // Give the video time to figure out white balance and stuff (to not be blank)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    mediaStream.getTracks().forEach(mediaStreamTrack => mediaStreamTrack.stop());

    const img = document.createElement('img');
    img.src = canvas.toDataURL();

    // TODO: Use this as a feature for cropping outlined regions in the capture
    // E.g.: `h2 { border: 5px solid lime; }`
    // const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    // const regions = await detect(imageData);
    // img.addEventListener('mousemove', event => document.title = `${event.offsetX} ${event.offsetY}`);

    document.body.replaceWith(img);
  }
  catch (error) {
    alert('Screen capture failed:' + error.toString());
    throw error;
  }
}

function pixel(/** @type {ImageData} */ imageData, /** @type {number} */ x, /** @type {number} */ y) {
  // Note that `ImageData` are always RGBA (4 channels)
  const index = y * imageData.width * 4 + x * 4;
  if (imageData.data[index + 3] !== 255) {
    throw new Error(`Transparent pixels are not supported: ${x}x${y}: ${imageData.data.slice(index, index + 4)}`);
  }

  // Convert the slice to an array of numbers to get plain array `map`
  const channels = [...imageData.data.slice(index, index + 3).values()];
  return channels.map(channel => (~~(channel / 16)).toString(16)).join('');
}

async function detect(/** @type {ImageData} */ imageData) {
  const title = document.title;

  // Do not look past these limits because no contentful rectangle would fit
  const maxWidth = imageData.width - 3;
  const maxHeight = imageData.height - 3;
  const maxArea = maxWidth * maxHeight;

  const regions = [];

  // Find candidate outline rectangle top-left corner pixels
  for (let y = 0; y < maxHeight; y++) {
    document.title = `${title} (${(y / maxHeight * 100).toFixed(2)} %)`;
    await new Promise(resolve => setTimeout(resolve, 0));
    point: for (let x = 0; x < maxWidth; x++) {
      const color = pixel(imageData, x, y);

      // Skip colors which are only shades - we're looking for a marker outline
      if (color[0] === color[1] && color[1] === color[2] && color[2] === color[0]) {
        continue;
      }

      // Ensure the bottom-right neighbor is a different color (makes it border)
      if (pixel(imageData, x + 1, y + 1) === color) {
        continue;
      }

      // See how far the current color repeats on the X axis
      let width = 0;
      while (x + width < maxWidth && pixel(imageData, x + width, y) === color) {
        width++;
      }

      // Reject if there is no space for even a single pixel within the outline
      if (width < 3) {
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
      if (height < 3) {
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
      check: for (let _y = 0; _y < height; _y++) {
        for (let _x = 0; _x < width; _x++) {
          if (pixel(imageData, x + _x, y + _y) !== color) {
            break check;
          }
        }
      }

      console.log('%c██', 'color: #' + color, `${x}×${y} (${width}×${height}, ${width + x}×${height + y}, ${((area / maxArea) * 100).toFixed(2)} %) #${color}`);
      regions.push({ x, y, width, height });
    }
  }

  document.title = title;
  return regions;
}

window.selfie = function () {
  const button = document.createElement('button');
  button.style = 'left: 0; position: fixed; top: 0; z-index: 2147483647;';
  button.textContent = 'Selfie';
  button.addEventListener('click', async () => {
    button.remove();
    await snap();
  });

  document.body.append(button);
};
