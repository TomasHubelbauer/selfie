import snap from './snap.js';
import scan from './scan.js';
import crop from './crop.js';

export default function (/** @type {string} */ selector) {
  const button = document.createElement('button');
  button.style = 'left: 0; position: fixed; top: 0; z-index: 2147483647;';
  button.textContent = 'Selfie';
  button.addEventListener('click', async () => {
    button.remove();

    try {
      if (!selector) {
        document.body.replaceWith();
        return;
      }

      const element = document.querySelector(selector);
      const bounds = element.getBoundingClientRect();

      const redMarker = document.createElement('div');
      redMarker.style = 'background: red; border: 1px solid white; height: 1px; position: absolute; width: 1px';
      redMarker.style.left = bounds.left + 'px';
      redMarker.style.top = bounds.top + 'px';
      document.body.append(redMarker);

      const limeMarker = document.createElement('div');
      limeMarker.style = 'background: lime; border: 1px solid white; height: 1px; position: absolute; width: 1px';
      limeMarker.style.left = bounds.right + 'px';
      limeMarker.style.top = bounds.bottom + 'px';
      document.body.append(limeMarker);

      const canvas = await snap();
      const region = scan(canvas.getContext('2d'), bounds.width, bounds.height);
      document.body.replaceWith(crop(canvas, region));
    }
    catch (error) {
      document.body.replaceWith(error);
    }
  });

  document.body.append(button);
}
