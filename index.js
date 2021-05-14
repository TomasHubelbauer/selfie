window.addEventListener('load', async () => {
  const buttons = document.getElementsByClassName('snapButton');
  for (const button of buttons) {
    button.addEventListener('click', snap);
  }
});

async function snap() {
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

  document.body.replaceWith(img);
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
