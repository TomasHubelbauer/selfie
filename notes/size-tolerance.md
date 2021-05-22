# Size Tolerance

I've coded a constant called `sizeTolerance` to the algorithm to allow tweaking
the size of the search area for the lime marker pixel. It is set to zero right
now which means the pixel will be only looked up at the offset from the red
marker pixel given by the scaled dimensions and the size of the are will be
based on the current scale. Increasing this area's size has performance impact
so I have not set it hight, but setting it higher may be useful in cases where
the exact offset between the two markers is hard to accurately measure. I have
not found such a case though, so for that reason I have not made this variable.

This is similar to the `colorTolerance` constant, which was also set to a value
determined emphirically and not made variable because I have not found a case
where it would disappoint. More about why color tolerance is needed in the
[Screen capture compression color artifacts](screen-capture-compression-color-artifacts.md)
note.
