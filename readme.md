# Selfie

Selfie is a JavaScript library for taking screenshots of own page. It uses the
[`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
API to get either a tab screenshot or a full screen screenshot and optionally
crops out a marked area (using two pixel markers) of the page.

This is an alternative method to [`html2canvas`](https://github.com/niklasvh/html2canvas).

There is a [early draft of a proposal](https://eladalon1983.github.io/mediacapture-screenshot)
to introduce a native browser API for capturing self-screenshots. It is in its
early stages and there is no implementation yet that I'm aware of.

## Demo

https://tomashubelbauer.github.io/selfie

## Installation

### Helper Script

This script displays a button for the user to click and initiate the screen
share and then either returns the shared surface (tab or screen) or, if selector
argument is provided, crops the image to just the element's area.

```js
const { default: selfie } = await import('https://tomashubelbauer.github.io/selfie/selfie.js');
selfie(); // or selfie('selector') to capture a given element
```

The helper script exists to show a sample of implementation, you're most likely
going to want to build the flow around this yourself, inspired by it.

### `script` Tag

```html
<script src="https://tomashubelbauer.github.io/selfie/snap.js"></script>
```

### ESM `import`

```js
import snap from 'https://tomashubelbauer.github.io/selfie/snap.js';
```

### ESM `await import`:

```js
const { default: snap } = await import('https://tomashubelbauer.github.io/selfie/snap.js');
```

## Usage

### Bare Shared Surface

Make a call to `snap` from within a stack trace user interaction initiated.
Most likely this is going to be a button press. This is a requirement for the
`getDisplayMedia` API to function correctly. You'll get back a `canvas` element
containing the shared surface (tab or screen). You can call `toDataURL` on it,
call `getContext` to further work with the image (e.g. using `getImageData`) or
do anything else you like with it.

```js
button.addEventListener('click', async () => document.body.append(await snap()));
```

### Marked Area

Show two pixel markers: red and lime. Surround both pixel markers with a white
border to remove any effect of the share stream compression on the pixel colors.
Mark the top-left corner of the area with red and bottom-right with lime.

Direct the user to select the current tab or just share the whole screen.

Make a call to `snap` from within a stack trace user interaction initiated.
Most likely this is going to be a button press. This is a requirement for the
`getDisplayMedia` API to function correctly. 

Hide the pixel markers - they are not needed anymore. Call `scan` with the
`canvas` from `snap` and provide it with the dimensions of the marked area as
well. You'll get an object with the marked region information, e.g.:
`{ x, y, width, height }`.

```js
button.addEventListener('click', async () => {
  document.body.append(scan(await snap(), width, height));
});
```

Work with the `canvas` and the region data in any way you like, or use the
`crop` function provided by Selfie to crop the original `canvas` into a new
`canvas` with just the marked region.

```js
button.addEventListener('click', async () => {
  document.body.append(crop(scan(await snap(), width, height)));
});
```

## Development

Run using `npx serve .` (http://localhost:5000) instead of off `file` protocol.
This is needed for ESM and canvas CORS to work correctly.

### How it works

Capturing a screenshot of whatever the user selects in the browser UI when asked
is done by using the `getDisplayMedia` API which returns a stream which we stop
right after we capture its first frame.

Capturing a particular area is done by displaying two marker pixels described in
the Usage section above while taking the screenshot. Afterwards, an algorithm is
used to find the location of the red marker in the screenshot and the knowledge
of the offset between the two markers provides us with all the information we
need to check the lime marker is there as expected and crop the original image
down to just the marked area.

The algorithm works by assuming:

- There are two marker pixels: red (top-left) and lime (bottom-right)
- The two markers are offset by a known size provided by the caller
- The marked are is rectangular and not rotated or scaled, only translated

## Support

I've tested the library works in Mozilla Firefox and Google Chrome. I've also
tested Safari. In macOS Safari, the user is not asked for a window to select,
the entire screen is shared immediately. In iOS Safari, `getDisplayMedia` is not
supported.

## Notes

- [Multiple Rendering Implementations](notes/multiple-rendering-implementations.md)
- [Browser screen share selector UI title hint](notes/browser-screen-share-selector-ui-title-hint.md)
- [Display scaling](notes/display-scaling.md)
- [Screen capture compression color artifacts](notes/screen-capture-compression-color-artifacts.md)
- [Marker pair combinations algorithm](notes/marker-pair-combinations-algorithm.md)
- [Size tolerance](notes/size-tolerance.md)

## To-Do

### Configure the media stream constraints better once they are well supported

All of these are only in Opera right now!

https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/cursor

Disable cursor because we are not waiting for the user to point anywhere.

https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/displaySurface

Consider preselecting `browser` so we automatically get out current tab and do
not have to ask the user to select it. We'd still do the auto-crop but just to
get rid of the browser UI and handle Safari which still returns full screen.

https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/logicalSurface

Not sure what this is completely, so check by checking what I get for the
various options provided by the browser:

https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/logicalSurface#usage_notes

### Fix the artifact tool color indicator label displaying bad color when panned
