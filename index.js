import detect from './detect.js';
import crop from './crop.js';

window.addEventListener('load', async () => {
  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', async () => document.body.replaceWith(await snap()));
  }

  const detectButton = document.getElementById('detectButton');
  const progress = document.createElement('progress');
  detectButton.addEventListener('click', async () => {
    detectButton.classList.toggle('clicked', true);

    const canvas = await snap();
    progress.append(canvas);
    detectButton.classList.toggle('clicked', false);

    detectButton.replaceWith(progress);

    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const worker = new Worker('worker.js', { type: 'module' });
    worker.addEventListener('error', async error => {
      worker.terminate();

      // Throw error unless it is no-ESM-in-worker Firefox error in which case fallback to main thread
      if (error.message !== 'SyntaxError: import declarations may only appear at top level of a module') {
        alert(error.message);
        return;
      }

      alert('This browser does not support web workers, region detection will run on the main thread.');
      const regions = [];
      for await (const region of detect(imageData)) {
        regions.push(region);
      }

      const region = regions.sort((a, b) => a.width * b.width()).reverse()[0];
      if (!region) {
        alert('No highlighted region found in the image. :-(');
        progress.replaceWith(canvas);
        return;
      }

      document.body.replaceWith(crop(canvas, region));
    });

    worker.postMessage(imageData);
    worker.addEventListener('message', event => {
      worker.terminate();

      if (!event.data) {
        alert('No highlighted region found in the image. :-(');
        progress.replaceWith(canvas);
        return;
      }

      document.body.replaceWith(crop(canvas, event.data));
    });
  });
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

    return canvas;
  }
  catch (error) {
    alert('Screen capture failed:' + error.toString());
    throw error;
  }
}

window.selfie = function () {
  const button = document.createElement('button');
  button.style = 'left: 0; position: fixed; top: 0; z-index: 2147483647;';
  button.textContent = 'Selfie';
  button.addEventListener('click', async () => {
    button.remove();
    const canvas = await snap();
    document.body.replaceWith(canvas);
  });

  document.body.append(button);
};
