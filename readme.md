# Selfie

Selfie is a JavaScript library for taking screenshots of own page. It uses the
[`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
API combined with a little user hand-holding to achieve that.

This is an alternative method to [`html2canvas`](https://github.com/niklasvh/html2canvas).

There is a [early draft of a proposal](https://eladalon1983.github.io/mediacapture-screenshot)
to introduce a native browser API for capturing self-screenshots. It is in its
early stages and there is no implementation yet that I'm aware of.

## Demo

https://tomashubelbauer.github.io/selfie

## Usage

Install statically using a `script` tag:

```html
<script src="https://tomashubelbauer.github.io/selfie/index.js"></script>
```

Install dynamically (useful for DevTools):

```js
const script = document.createElement('script');
script.src = 'https://tomashubelbauer.github.io/selfie/index.js';
document.head.append(script);
```

Call the `selfie()` method to display the button to initiate the capture:

```js
window.selfie();
```

The extra step of clicking the button is required as the `getDisplayMedia` API
needs to be called from a user gesture.

## Development

Run using `npx serve .` (http://localhost:5000) instead of off `file` protocol.
This is needed for ESM and canvas CORS to run correctly.

## Roadmap

I have a feature in the works which is capable of automatically cropping out a
region of the image which is outlined by a solid color (not shade) border. It
works decently, but slowly. It is the `detect.js` method in `detect`. Once this
is implemented, this library will be more usable by allowing the user to mark
the area of their interest or the whole tab and the automatic crop would remove
the browser chrome Firefox keeps (but Chrome does not) when capturing a specific
tab.

## Support

I've tested the library works in Mozilla Firefox and Google Chrome. I've also
tested Safari. In macOS Safari, the user is not asked for a window to select,
the entire screen is shared immediately. In iOS Safari, `getDisplayMedia` is not
supported.

## Notes

### Multiple rendering implementations

If you want to use Selfie in your own web application to take screenshots of it
or a portion of it, one recommendation which applies in some (but not all) cases
is to instead consider introducing two rendering methods for the part of your
application you are interested in capturing.

Most likely you are going to want to make those a DOM renderer (for your normal
uses) and a `canvas`-based renderer for the purposes of calling `toDataURL` on
the `canvas` and obtaining the screenshot of the area of interest.

There is a risk of the two implementations going out of sync, making the capture
untrue to original, and the complexity of this isn't insignificant, but it may
be worth it for the hands-off-ness of the solution.

### Title suffix for easier tab location

I tried suffixing `document.title` in order to make the tab stand out in the
window and tab picker UIs of the browsers, but it only worked on Chrome, not in
Firefox (it seems to remember the titles as they are on page load), so I ditched
it.

### Testing with `getUserMedia`

Replacing `getDisplayMedia` with `getUserMedia` for testing or adjusting the
library to take actual selfies and not screenshots will not work by itself.
Web cams take time to adjust exposure and white balance, so even if the first
frame of the video is available after `await video.play()`, you probably do not
want to use it. Use `await new Promise(resolve => setTimeout(resolve, 100))` to
give the web cam time to adjust the picture and then proceed. Without this, the
first frame usually comes out dark, almost completely black.

## To-Do

### Extend the API to accept either a crop region or enable region detection

Either pass in 2 numbers (X & Y), 4 numbers (X, Y, width and height of the crop)
or a boolean / flag allowing the `detect` function to find the biggest outlined
region (using a color, not a shade) and crop it out automatically. If this flag
is enabled, but no region is found, treat that as an error which might indicate
the user selected an incorrect tab.

Also, open the screenshot in a new tab, so tweaking the region numbers or the
outline placement can be done on the page without losing its state.
