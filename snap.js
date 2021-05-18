import detect from './detect.js';

export default async function snap() {
  const mediaStream = await navigator.mediaDevices.getDisplayMedia();

  const video = document.createElement('video');
  video.srcObject = mediaStream;
  await video.play();

  if (detect() === 'chrome') {
    // White for screen share selector UI to go away and for colors to settle in
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0);

  mediaStream.getTracks().forEach(mediaStreamTrack => mediaStreamTrack.stop());

  return canvas;
}
