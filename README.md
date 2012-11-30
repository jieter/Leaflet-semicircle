Leaflet-Semicircle.
-------------------

Adds simicircle functionality to L.Circle. Angles are difined like compass courses: 0 = north, 90 = east, etc. If the script is not included, Leaflet will draw full circles.

## Known issues
 - Not really robust yet for cases when `startAngle` is bigger than `stopAngle`.
 - Behaves differently for those cases on canvas

## Usage:
The plugin provides two ways to only display a part of the circle:
1. Use the `options` map and set `startAngle` and `stopAngle`.
2. Use `setDirection(direction, degrees)` to display a semicircle of `degrees` at `direction`
## Example:

Use options:
```
L.circle([51.5, -0.09], 500, {
	startAngle: 45,
	stopAngle: 135
}).addTo(map);
```


## Screenshot:
![Semicircles screenshot](https://raw.github.com/jieter/Leaflet-semicircle/master/screenshot.png)