Leaflet-Semicircle.
-------------------

Adds simicircle functionality to L.Circle. Angles are defined like compass courses: 0 = north, 90 = east, etc. If the script is not included, Leaflet will just draw full circles.

## Provided methods ##
<table>
<tr><td><code>L.Circle.setStartAngle(angle)</code></td><td>Set the start angle of the circle to <code>angle</code> and redraw.</td></tr>
<tr><td><code>L.Circle.setStopAngle(angle)</code></td><td>Set the stop angle of the circle to <code>angle</code> and redraw.</td></tr>
<tr><td><code>L.Circle.setDirection(direction, size)</code></td><td>Set the <code>startAngle</code> to <code>direction - (0.5 * size)</code> and the <code>stopAngle</code> to <code>direction + (0.5 * size)</code> and redraw.</td></tr>
</table>

## Known issues
 - Not really robust yet for cases when `startAngle` is bigger than `stopAngle`.
 - Behaves differently for those cases on canvas

## Usage:
The plugin provides two ways to only display a part of the circle:
1. Use the `options` map and set `startAngle` and `stopAngle`.
2. Use `setDirection(direction, size)` to display a semicircle of `size` degrees at `direction`.

## Example:
[Live demo](http://jieter.github.com/Leaflet-semicircle/example-semicircle.html)

Useing `options.startAngle` and `options.stopAngle`:
```
L.circle([51.5, -0.09], 500, {
	startAngle: 45,
	stopAngle: 135
}).addTo(map);
```

Draw the same semicircle using `setDirection(direction, size)`:
```
L.circle([51.5, -0.09], 500)
	.setDirection(90, 90)
	.addTo(map);
```

## Screenshot:

[Live demo](http://jieter.github.com/Leaflet-semicircle/example-semicircle.html)

![Semicircles screenshot](screenshot.png)
