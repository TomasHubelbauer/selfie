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

## Usage

### To capture someone else's page using DevTools

```js
const { default: selfie } = await import('https://tomashubelbauer.github.io/selfie/selfie.js');
selfie();
```

The extra step of clicking the button is required as the `getDisplayMedia` API
needs to be called from a user gesture.

### To capture the shared tab or full screen (depending on user choice)

Install statically using a `script` tag:

```html
<script src="https://tomashubelbauer.github.io/selfie/snap.js"></script>
```

Install statically using ESM `import`:

```js
import snap from 'https://tomashubelbauer.github.io/selfie/snap.js';
```

Install dynamically using ESM `import`:

```js
const { default: snap } = await import('https://tomashubelbauer.github.io/selfie/snap.js');
```

Call the `snap` function in a way that includes user interaction (e.g. a button)
as the user interaction is required for the `getDisplayMedia` API to be used and
use the resulting `canvas`.

```js
button.addEventListener('click', async () => document.body.append(await snap()));
```

### To capture a marked area in a page

Display two marker pixels, a top-left red one and a bottom-right lime one. Pass
the dimensions of the rectangle defined by them into the `scan` function. Border
each marker with a white outline to help prevent the color compression artifacts
from surrounding pixels.

Install statically using a `script` tag:

```html
<script src="https://tomashubelbauer.github.io/selfie/snap.js"></script>
<script src="https://tomashubelbauer.github.io/selfie/scan.js"></script>
```

Install statically using ESM `import`:

```js
import snap from 'https://tomashubelbauer.github.io/selfie/snap.js';
import scan from 'https://tomashubelbauer.github.io/selfie/scan.js';
```

Install dynamically using ESM `import`:

```js
const { default: snap } = await import('https://tomashubelbauer.github.io/selfie/snap.js');
const { default: scan } = await import('https://tomashubelbauer.github.io/selfie/scan.js');
```

Call the `snap` function in a way that includes user interaction (e.g. a button)
as the user interaction is required for the `getDisplayMedia` API to be used.
Direct the user to share either the page's tab or the full screen. Pass the
resulting `canvas` as well as the above described dimensions into the `scan`
function which will return the crop region in the provided `canvas`:

```js
button.addEventListener('click', async () => {
  document.body.append(scan(await snap(), width, height));
});
```

You can use the `crop` function provided by Selfie to crop the canvas to the
found area, just reference `crop.js` the same way you do the other scripts:

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

## To-Do

### Improve the detection algorithm to be more flexible

Change the size constraints to not be the exact sizes, but ranges, both optional
and defaulting from zero to window size on the respective axis. This will allow
providing a guesstimate instead of knowing the marker distances exactly. 

This is intended to be used with things like CSS outline with relative units or
box model shenanigans where the markers might be slightly offset. In this case
the marked container's dimension could be passed it with some size tolerance.

The performance of the algorithm is proportional to the breath of the search
space though so it still makes a difference to calculate as good a guesstimate
as possible.

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
