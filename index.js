import snap from './snap.js';
import scan from './scan.js';
import crop from './crop.js';
import detect from './detect.js';
import DebugCanvas from './DebugCanvas.js';

window.addEventListener('load', async () => {
  const supported = !!navigator.mediaDevices.getDisplayMedia;
  if (!supported) {
    const introP = document.getElementById('introP');
    const code = document.createElement('code');
    code.textContent = 'getDisplayMedia';
    const div = document.createElement('div');
    div.append(code);
    div.append(' API is not supported in this browser.');
    introP.replaceWith(div);
  }

  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', async () => {
      try {
        // Calculate the horizontal and vertical distance between markers
        const left = parseInt(window.getComputedStyle(document.body, '::before').left);
        const top = parseInt(window.getComputedStyle(document.body, '::before').top);
        const right = parseInt(window.getComputedStyle(document.body, '::after').right);
        const bottom = parseInt(window.getComputedStyle(document.body, '::after').bottom);
        const width = window.innerWidth - right - left - 3 /* marker + border */;
        const height = window.innerHeight - bottom - top - 3 /* marker + border */;

        document.body.classList.toggle('markers', true);
        const canvas = await snap();
        document.body.classList.toggle('markers', false);

        const context = canvas.getContext('2d');

        const region = scan(context, width, height, false);
        const _canvas = region === undefined ? canvas : crop(canvas, region);

        if (region === undefined) {
          document.body.textContent = 'No markers found. Did you select the right tab or full screen? ';
        }
        else {
          document.body.textContent = 'Found region: ' + JSON.stringify(region) + ' ';
        }

        const button = document.createElement('button');
        button.textContent = 'Debug';
        button.addEventListener('click', () => _canvas.replaceWith(new DebugCanvas(canvas)));
        document.body.append(button);

        document.body.append(_canvas);
      }
      catch (error) {
        alert(error);
        throw error;
      }
    });
  }

  // Display usage instructions for the current browser, or generic if too niche
  document.body.classList.toggle(detect(), supported);
});
