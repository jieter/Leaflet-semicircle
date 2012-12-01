/**
 * Simple pacman walking over a map, using semicircle.
 */

/*jshint browser:true, debug: true, strict:false, globalstrict:false, indent:4, white:true, smarttabs:true*/
/*global L:true, console:true*/


L.LatLng.prototype.translate = function (matrix, offset) {
	var dir = L.point(matrix).multiplyBy(offset);
	this.lat += dir.y;
	this.lng += dir.x;

	return this;
};

L.Pacman = L.Circle.extend({
	options: {
		size: 400,
		moveOffset: 0.02
	},
	statics: {
		LEFT: [-1, 0],
		RIGHT: [1, 0],
		UP: [0, -1],
		DOWN: [0, 1],
		ANIMATION_DELAY: 80,
		EARTH_RADIUS: 6378137
	},
	initialize: function (start) {
		this._position = L.latLng(start);
		console.log('Pacman started @' + this._position);

		var circleOptions = {
			weight: 2,
			color: '#000',
			fillColor: '#ff0',
			opacity: 1,
			fillOpacity: 0.95
		};

		// call super constructor.
		L.Circle.prototype.initialize.call(this, this._position, this.options.size, circleOptions);

		// start the animation.
		this._startAnimation();
	},

	pixelSize: function (zoom) {
		if (!zoom) {
			zoom = this._map.getZoom();
		}
		return L.Pacman.EARTH_RADIUS * Math.cos(this._position.lat * L.LatLng.DEG_TO_RAD) / Math.pow(2, (zoom + 8));
	},
	setZoom: function (zoom) {
		var r = this.pixelSize() * this.options.size;

		if (r) {
			this.setRadius(r);
		}
		return this;
	},

	_startAnimation: function () {
		var pacman = this;

		this.counter = 1;
		setInterval(function () {
			pacman.counter += 0.5;
			var open = 357 - (1 + Math.sin(pacman.counter)) * 45;

			pacman.setDirection(pacman.direction(), open);
		}, L.Pacman.ANIMATION_DELAY);
	},

	move: function (direction) {
		var offset = this.options.moveOffset * (this.pixelSize() / 1.6);
		this._position.translate(direction, offset);
		if (direction[0] == 1) {
			this._direction = 90;
		} else if (direction[0] == -1) {
			this._direction = 270;
		} else if (direction[1] == 1) {
			this._direction = 0;
		} else if (direction[1] == -1) {
			this._direction = 180;
		}

		this.redraw();
		this._map.panTo(this._position);
	},

	_direction: 90,
	direction: function () {
		return this._direction - 180;
	}

});