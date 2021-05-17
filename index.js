import snap from './snap.js';
import scan from './scan.js';
import crop from './crop.js';

window.addEventListener('load', async () => {
  if (!navigator.mediaDevices.getDisplayMedia) {
    const buttonsDiv = document.getElementById('buttonsDiv');
    const code = document.createElement('code');
    code.textContent = 'getDisplayMedia';
    const fragment = document.createDocumentFragment();
    fragment.append(code);
    fragment.append(' API is not supported in this browser.');
    buttonsDiv.replaceWith(fragment);
  }

  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', async () => {
      try {
        document.body.replaceWith(await snap());
      }
      catch (error) {
        alert(error);
      }
    });
  }

  const scanButton = document.getElementById('scanButton');
  scanButton.addEventListener('click', async () => {
    try {
      const marker1 = document.getElementById('marker1');
      const bounds1 = marker1.getBoundingClientRect();

      const marker2 = document.getElementById('marker2');
      const bounds2 = marker2.getBoundingClientRect();

      const width = bounds2.left - bounds1.left;
      const height = bounds2.top - bounds1.top;

      marker1.classList.toggle('visible', true);
      marker2.classList.toggle('visible', true);

      const canvas = await snap();

      marker1.classList.toggle('visible', false);
      marker2.classList.toggle('visible', false);

      const context = canvas.getContext('2d');

      const marker = parseInt(window.getComputedStyle(document.body).getPropertyValue('--markerSize'));

      // TODO: Encode known Firefox, Chrome & Safari color values when encoded
      const region = scan(context, 120, width, height, marker, false);
      if (region === undefined) {
        document.body.replaceWith(canvas);
        throw new Error('Highlighted area not found. Are the markers visible?');
      }

      document.body.replaceWith(crop(canvas, region));
    }
    catch (error) {
      alert(error);
    }
  });

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
});
