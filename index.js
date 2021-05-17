import snap from './snap.js';
import scan from './scan.js';
import crop from './crop.js';

window.addEventListener('load', async () => {
  if (!navigator.mediaDevices.getDisplayMedia) {
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
        if (region === undefined) {
          document.body.replaceWith(canvas);
          alert('No markers found. Did you select the right tab or full screen?');
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
});
