# Marker pair combinations algoritm

I had another idea for an algorithm to use. It would loop over all of the pixels
in the image and store a list of coordinates of all pixels matching the red
marker and the lime marker.

In the next step, it would look through combinations of all reds with all limes
that are to the right and bottom of the given red (to make a rectangle). If it
found nothing, no markers were found - no result was given. If it found a single
pair, that's the result. If it found multiple, I had a couple of ideas, either
return all pairs and let the caller found the most likely one, or accept an
approximate size range and return the pair that falls in that size range (and
deal with multiple results in that size range similarly) etc.

I have found there were too many matches for red to make the combinatorics fast
and practical. The current algorithm is a bit more cumbersome to use since it
requires the size to be entered as well and with a pretty tight margin or error
(1px), but it will be more beneficial to increase the margin of size match error
of the current algorithm over implementing this other algorithm which would not
care about the size theoretically, but in practice would need it anyway to rule
out false positives.
