/**
 * Semicircle extension for L.Circle.
 * Jan Pieter Waagmeester <jieter@jieter.nl>
 */

(function (L) {

	var DEG_TO_RAD = Math.PI / 180;

	// make sure 0 degrees is up (North) and convert to radians.
	function fixAngle (angle) {
		return (angle - 90) * DEG_TO_RAD;
	}

	L.Circle = L.Circle.extend({
		options: {
			startAngle: 0,
			stopAngle: 359.9999
		},

		startAngle: function () {
			return fixAngle(this.options.startAngle);
		},
		stopAngle: function () {
			return fixAngle(this.options.stopAngle);
		},

		// rotate point x,y+r around x,y with angle.
		rotated: function (angle, r) {
			return this._point.add(
				L.point(Math.cos(angle), Math.sin(angle)).multiplyBy(r)
			).round();
		},

		setStartAngle: function (angle) {
			this.options.startAngle = angle;
			return this.redraw();
		},
		setStopAngle: function (angle) {
			this.options.stopAngle = angle;
			return this.redraw();
		},
		setDirection: function (direction, degrees) {
			if (degrees === undefined) {
				degrees = 10;
			}
			this.options.startAngle = direction - (degrees / 2);
			this.options.stopAngle = direction + (degrees / 2);

			return this.redraw();
		}
	});

	// save original getPathString function to draw a full circle.
	var originalUpdateCircle = L.SVG.prototype._updateCircle;

	L.SVG.include({
		_updateCircle: function (layer) {
			// If we want a circle, we use the original function
			if (layer.options.startAngle === 0 && layer.options.stopAngle > 359) {
				return originalUpdateCircle.call(this, layer);
			}

			var center = layer._point,
				r = layer._radius;

			var start = layer.rotated(layer.startAngle(), r),
				end = layer.rotated(layer.stopAngle(), r);

			var largeArc = (layer.options.stopAngle - layer.options.startAngle >= 180) ? '1' : '0';
			// move to center
			var d = 'M' + center.x + ',' + center.y;
			// lineTo point on circle startangle from center
			d += 'L ' + start.x + ',' + start.y;
			// make circle from point start - end:
			d += 'A ' + r + ',' + r + ',0,' + largeArc + ',1,' + end.x + ',' + end.y + ' z';

			this._setPath(layer, d);
		}
	})
})(L);
