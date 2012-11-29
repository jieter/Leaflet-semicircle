Leaflet-Semicircle.
-------------------

Adds simicircle functionality to L.Circle. Angles are difined like compass courses: 0 = north, 90 = east, etc. If the script is not included, Leaflet will draw full circles.

Not really robust yet for cases when `startAngle` is bigger than `stopAngle`.

# Example:

```
L.circle([51.5, -0.09], 500, {
	startAngle: 45,
	stopAngle: 135
}).addTo(map);
```


# Screenshot:
![Semicircles screenshot](https://raw.github.com/jieter/Leaflet-semicircle/master/screenshot.png)