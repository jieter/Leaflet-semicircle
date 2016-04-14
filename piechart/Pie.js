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
 *  labels: <boolean> Display
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

    L.Pie = L.Layer.extend({
        options: {
            radius: 500,
            labels: true,
            colors: null,

        },
        pathOptions: {
            weight: 1
        },

        initialize: function (latlng, data, options) {
            this._latlng = latlng;
            L.Util.setOptions(this, options);

            this.options.pathOptions = L.Util.extend({}, this.pathOptions, options.pathOptions);
            this._prepareData(data);
        },

        _prepareData: function (data) {
            this._count = 0;
            this._sum = 0;
            this._data = {};

            var part;
            for (var i = 0; i < data.length; i++) {
                if (typeof(data[i]) == 'number') {
                    part = {
                        num: data[i]
                    };
                } else {
                    part = data[i];
                }
                if (!part.color) {
                    part.color = this.randomColor();
                }
                if (!part.label) {
                    part.label = '';
                }

                this._count++;
                this._sum += part.num;
                this._data[i] = part;
            }
        },

        setData: function (data) {
            this._prepareData(data);

            return this.redraw();
        },

        redraw: function () {
            // TODO implement
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
                }, this.options.pathOptions);

                this._data[i]._part = L.circle(this._latlng, options).addTo(map);

                var labelDir = (normalized * 360) / 2  + startAngle;
                var labelText = this._data[i].label;
                if (this._data[i].label) {
                    labelText += ' (';
                }
                labelText += L.Util.formatNum(normalized * 100, 1) + '%';
                if (this._data[i].label) {
                    labelText += ')';
                }

                // add a label.
                if (this.options.labels) {
                    this._data[i]._labelArrow = L.polyline(this._labelArrow(), {
                        fill: false,
                        weight: 1,
                        color: '#000'
                    }).addTo(map);
                }

                startAngle = stopAngle;
            }
            return this;
        },

        addTo: function (map) {
            map.addLayer(this);
            return this;
        },

        onRemove: function (map) {
            for (var i = 0; i < this.count(); i++) {
                this._data[i]._part.onRemove(map);
                if (this._data[i]._label) {
                    this._data[i]._label.onRemove(map);
                }
            }
            return this;
        },
        _reset: function () {

        },

        _labelArrow: function () {
            var r = this.options.radius;
            var buffer = this.options.buffer;
            var angle = (this._dir - 90) * (Math.PI / 180);
            var length = this.options.length;

            var midPoint = this._point.rotated(angle, r + buffer + length);

            return [
                this._point._rotated(angle, r + buffer),
                midPoint,
                // translate horizontally by length
                midPoint.add([(this._dir > 190) ? -length : length, 0])
            ];
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
    if (typeof(param) == 'number') {
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
//
// /**
//  * Draw a label for a pie chart.
//  */
// L.PieLabel = L.Layer.extend({
//     options: {
//         radius: 200,
//         buffer: 2,
//         length: 20,
//         fill: false,
//         weight: 1,
//         color: '#000'
//     },
//
//     initialize: function (latlng, options) {
//         L.Util.setOptions(this, options);
//         self._center = latlng;
//     },
//
//
//
//     _textAnchor: function () {
//         return this._dir > 190 ? 'end' : 'start';
//     },
//
//     onAdd: function (map) {
//         L.polyline(this.projectLatlngs()).addTo(map);
//         // L.Circle.prototype.onAdd.call(this, map);
//
//         // map.on('viewreset', this._reset, this);
//
//         // // this._t = this._createElement('text');
//         //
//         // this._t.setAttribute('x', this._labelEnd.x);
//         // this._t.setAttribute('y', this._labelEnd.y);
//         // this._t.setAttribute('dx', 2);
//         // this._t.setAttribute('dy', 5);
//         // this._t.setAttribute('text-anchor', this._textAnchor());
//         // this._t.setAttribute('style', 'font: 10px "Arial"');
//         // this._t.textContent = this._text;
//         //
//         // this._container.appendChild(this._t);
//     },
//
//     onRemove: function (map) {
//         // L.Circle.prototype.onRemove.call(this, map);
//
//         // this._container.removeChild(this._t);
//         // this._t = null;
//
//         map.on('viewreset', this._reset, this);
//     },
//
//     _reset: function () {
//         if (this._t) {
//             this._t.setAttribute('x', this._labelEnd.x);
//             this._t.setAttribute('y', this._labelEnd.y);
//         }
//     },
//
//     getPathString: function () {
//         if (L.Browser.svg) {
//
//             //move to labelStart
//             var ret = 'M' + this._labelStart.x + ',' + this._labelStart.y;
//
//             ret += 'L ' + this._labelMid.x + ',' + this._labelMid.y;
//             // horizontal part.
//             ret += 'L ' + this._labelEnd.x + ', ' + this._labelEnd.y;
//
//             return ret;
//         }
//     }
// });
//
// L.pieLabel = function (latlng, options) {
//     return new L.PieLabel(latlng, options);
// };
