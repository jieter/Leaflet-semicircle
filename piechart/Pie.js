/**
 * Pie chart extension for leaflet using Leaflet-semicircle.
 * Jan Pieter Waagmeester <jieter@jieter.nl>
 *
 * latlng
 *  Location to add the pie chart.
 *
 * data - The data for Leaflet Pie chart can be supplied in three ways:
 *
 *  = single number: display two parts, random colors.
 *  = array of numbers: display numbers in array normalized to 360 degrees, random colors.
 *  = array of objects:
 * [
 *   {
 *      num: <number>,
 *      color: "<color>",
 *      label: "label A"
 *   },
 *   {
 *      num: // etc...
 *   }
 * ]
 * If color is omitted, a random (predictable) color will be be choosen.
 *
 * options - for the pie charts.
 *  radius: <number>, in meters.
 *  pathOptions: <Leaflet Path options>
 *  labels: <boolean> Display labels
 *  colors: <null|array> if colors is an array, the colors will be used for the slices.
 *
 */

(function (L) {

    function randomColor (counter) {
        // Based on http://krazydad.com/tutorials/makecolors.php
        var byte2Hex = function (n) {
            var nybHexString = '0123456789ABCDEF';
            return (
                String(nybHexString.substr((n >> 4) & 0x0F, 1)) +
                String(nybHexString.substr(n & 0x0F, 1))
            );
        };
        return '#' +
            byte2Hex(Math.sin(1.666 * counter) * 127 + 128) +
            byte2Hex(Math.sin(2.666 * counter) * 127 + 128) +
            byte2Hex(Math.sin(3.666 * counter) * 127 + 128);
    };

    L.Pie = L.LayerGroup.extend({
        options: {
            // radius of the pie chart
            radius: 500,
            // Show labels
            labels: true,
            // array of colors to be used for the slices
            colors: null,
            // amount of pixels between the arrow and the pie
            buffer: 2,
            // length of each arrow segment in pixels
            length: 20,

            arrowOptions: {
                fill: false,
                weight: 1,
                color: '#000'
            },
            sliceOptions: {
                weight: 2
            },
        },

        initialize: function (latlng, data, options) {
            this._latlng = latlng;
            L.Util.setOptions(this, options);

            this._prepareData(data);

            L.LayerGroup.prototype.initialize.call(this);
        },

        _prepareData: function (data) {
            this._count = 0;
            this._sum = 0;
            this._data = {};

            var part;
            for (var i = 0; i < data.length; i++) {
                part = (typeof(data[i]) === 'number') ? {num: data[i]} : data[i];

                part.color = part.color || this.randomColor();
                part.label = part.label || '';

                this._count++;
                this._sum += part.num;
                this._data[i] = part;
            }
        },

        setData: function (data) {
            this._prepareData(data);

            return this;
        },

        // return the sum of the input data.
        sum: function () { return this._sum; },
        count: function () { return this._count; },

        _normalize: function (num) { return num / this.sum(); },
        _color: function (index) { return this._data[index].color; },

        // layer implementation.
        onAdd: function (map) {
            this._parts = [];
            var startAngle = 0;
            var stopAngle = 0;

            this.addTo(map);

            for (var i = 0; i < this.count(); i++) {
                var normalized = this._normalize(this._data[i].num);

                stopAngle = normalized * 360 + startAngle;

                // set start/stop Angle and color for semicircle
                var options = L.extend({
                    startAngle: startAngle,
                    stopAngle: stopAngle,

                    radius: this.options.radius,
                    fillColor: this._color(i),
                    color: this._color(i)
                }, this.options.sliceOptions);

                this._data[i].slice = L.semiCircle(
                    this._latlng,
                    L.Util.extend({}, options, this.options.pathOptions)
                ).addTo(this);

                if (this.options.labels) {
                    this._createLabel(normalized, this._data[i].label, this._data[i].slice);
                }
                startAngle = stopAngle;
            }
            return this;
        },

        _createLabel: function (normalized, text, slice) {
            var map = this._map;
            var p = map.project(this._latlng);
            var angle = slice.getDirection();
            var r = slice._radius + this.options.buffer;
            var length = this.options.length;

            var pointsLeft = (angle > Math.PI * 0.9);

            var midPoint = p.rotated(angle, r + length);
            var arrowLatlngs = [
                map.unproject(p.rotated(angle, r)),
                map.unproject(midPoint),
                // translate horizontally by length
                map.unproject(midPoint.add([pointsLeft ? -length : length, 0]))
            ];

            // arrow
            L.polyline(arrowLatlngs, this.options.arrowOptions).addTo(this);

            // text label
            var percentage = L.Util.formatNum(normalized * 100, 1) + '%';
            L.marker(arrowLatlngs[2], {
                icon: L.divIcon({
                    className: 'leaflet-pie-label ' + (pointsLeft ? 'left' : 'right'),
                    iconSize: [100, 20],
                    iconAnchor: [pointsLeft ? 102 : -2, 10],
                    html: text ? text + ' (' + percentage + ')' : percentage
                })
            }).addTo(this);
        },

        randomColor: function () {
            if (this._counter === undefined) {
                this._counter = 0;
            }
            this._counter++;

            // if an array with colors is passed, use it.
            if (this.options.colors !== null) {
                return this.options.colors[this._counter % this.options.colors.length];
            }

            return randomColor(this._counter);
        }
    });
})(L);


L.pie = function (latlng, param, options) {
    var data = [];
    if (typeof(param) === 'number') {
        // for a single number, a percentage is assumed.
        param = param / 100;
        data.push(param);
        data.push(1 - param);
    } else {
        data = param;
    }

    if (!options) {
        options = {};
    }
    return new L.Pie(latlng, data, options);
};
