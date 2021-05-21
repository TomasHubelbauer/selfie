# Display scaling

By default, Firefox and Safari return scaled stream whereas Chrome does not.

`track.getCapabilities().max.height / track.getSettings().height` will not work
in Firefox due to its lack of support for `getCapabilities`. `screen.width` and
`screen.height` comparison to track dimensions will not work where the whole
screen is not being shared. `window.devicePixelRatio` will not work because
Chrome returns 2 for it like others but its stream is not scaled.

It is possible to force non-scaled stream by setting `video.width` constraint to
`screen.width` (which is unscaled), but I'd rather check two possible scales
than to give up the scaled resolution.
