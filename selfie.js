import './scan.js';

export default function () {
  const button = document.createElement('button');
  button.style = 'left: 0; position: fixed; top: 0; z-index: 2147483647;';
  button.textContent = 'Selfie';
  button.addEventListener('click', async () => {
    button.remove();
    try {
      document.body.replaceWith(await snap());
    }
    catch (error) {
      document.body.replaceWith(error);
    }
  });

  document.body.append(button);
}
