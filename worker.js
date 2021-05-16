import detect from './detect.js';

self.addEventListener('message', async event => {
  const regions = [];
  for await (const region of detect(event.data)) {
    regions.push(region);
  }

  const region = regions.sort((a, b) => a.width * b.width()).reverse()[0];
  postMessage(region);
});
