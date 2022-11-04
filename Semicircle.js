/**
 * Semicircle extension for L.Circle.
 * Jan Pieter Waagmeester <jieter@jieter.nl>
 *
 * This version is tested with leaflet 1.0.2
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined' && typeof require !== 'undefined') {
        // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
        // Browser globals
        if (typeof window.L === 'undefined') {
            throw 'Leaflet must be loaded first';
        }
        factory(window.L);
    }
})(function (L) {
    var DEG_TO_RAD = Math.PI / 180;

    // make sure 0 degrees is up (North) and convert to radians.
    function fixAngle (angle) {
        return (angle - 90) * DEG_TO_RAD;
    }

    // rotate point [x + r, y+r] around [x, y] by `angle` radians.
    function rotated (p, angle, r) {
        return p.add(
            L.point(Math.cos(angle), Math.sin(angle)).multiplyBy(r)
        );
    }

    L.Point.prototype.rotated = function (angle, r) {
        return rotated(this, angle, r);
    };

    var semicircle = {
        options: {
            startAngle: 0,
            stopAngle: 359.9999,
            innerRadius: 0,
            ringWidth: 0
        },
        startAngle: function () {
            if (this.options.startAngle < this.options.stopAngle) {
                return fixAngle(this.options.startAngle);
            } else {
                return fixAngle(this.options.stopAngle);
            }
        },

        stopAngle: function () {
            if (this.options.startAngle < this.options.stopAngle) {
                return fixAngle(this.options.stopAngle);
            } else {
                return fixAngle(this.options.startAngle);
            }
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
        },
        getDirection: function () {
            return this.stopAngle() - (this.stopAngle() - this.startAngle()) / 2;
        },
        isSemicircle: function () {
            var startAngle = this.options.startAngle,
                stopAngle = this.options.stopAngle;
            return (
                !(startAngle === 0 && stopAngle > 359) &&
                !(startAngle === stopAngle)
            );
        },
        isRing: function () {
            return !!this.options.innerRadius || !!this.options.ringWidth
        },
        _containsPoint: function (p) {
            function normalize (angle) {
                while (angle <= -Math.PI) {
                    angle += 2.0 * Math.PI;
                }
                while (angle > Math.PI) {
                    angle -= 2.0 * Math.PI;
                }
                return angle;
            }
            var angle = Math.atan2(p.y - this._point.y, p.x - this._point.x);
            var nStart = normalize(this.startAngle());
            var nStop = normalize(this.stopAngle());
            if (nStop <= nStart) {
                nStop += 2.0 * Math.PI;
            }
            if (angle <= nStart) {
                angle += 2.0 * Math.PI;
            }
            return (
                nStart < angle && angle <= nStop &&
                p.distanceTo(this._point) <= this._radius + this._clickTolerance()
            );
        }
    }

    function initialize (klass) {
        return function (latlng, options, legacyOptions) {
            this._mInnerRadius = options.innerRadius || 0
            this._mRingWidth = options.ringWidth || 0
            klass.prototype.initialize.call(this, latlng, options, legacyOptions)
        }
    }

    function getInnerRadius (context) {
        return ((context._mRingWidth) ? context._mRadius - context._mRingWidth : context._mInnerRadius) || 0
    }

    var markerOptions = {
        initialize: initialize(L.CircleMarker),
        _project: function () {
            this._innerRadius = getInnerRadius(this)
            L.CircleMarker.prototype._project.call(this)
        }
    }

    var nonMarkerOptions = {
        initialize: initialize(L.Circle),
        _project: function () {
            var lng = this._latlng.lng,
                lat = this._latlng.lat,
                map = this._map,
                crs = map.options.crs,
                innerRadius = getInnerRadius(this)

            if (innerRadius) {
                if (crs.distance === L.CRS.Earth.distance) {
                    var d = Math.PI / 180,
                        latR = (innerRadius / L.CRS.Earth.R) / d,
                        top = map.project([lat + latR, lng]),
                        bottom = map.project([lat - latR, lng]),

                        p = top.add(bottom).divideBy(2),
                        lat2 = map.unproject(p).lat;
                    var lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
                        (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

                    if (isNaN(lngR) || lngR === 0) {
                        lngR = latR / Math.cos(Math.PI / 180 * lat); // Fallback for edge case, #2425
                    }

                    this._point = p.subtract(map.getPixelOrigin());
                    this._innerRadius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;

                } else {
                    var latlng2 = crs.unproject(crs.project(this._latlng).subtract([innerRadius, 0]));

                    this._point = map.latLngToLayerPoint(this._latlng);
                    this._innerRadius = this._point.x - map.latLngToLayerPoint(latlng2).x;
                }
            }

            L.Circle.prototype._project.call(this)
        }
    };

    L.SemiCircle = L.Circle.extend(Object.assign({}, semicircle, nonMarkerOptions));
    L.SemiCircleMarker = L.CircleMarker.extend(Object.assign({}, semicircle, markerOptions));

    L.semiCircle = function (latlng, options) {
        return new L.SemiCircle(latlng, options);
    };
    L.semiCircleMarker = function (latlng, options) {
        return new L.SemiCircleMarker(latlng, options);
    };

    var _updateCircleSVG = L.SVG.prototype._updateCircle;
    var _updateCircleCanvas = L.Canvas.prototype._updateCircle;

    function useBaseCircleFunction (layer) {
        return (!(layer instanceof L.SemiCircle || layer instanceof L.SemiCircleMarker) ||
            (!layer.isSemicircle() && !layer.isRing()))
    };

    L.SVG.include({
        _updateCircle: function (layer) {

            // If we want a circle, we use the original function
            if (useBaseCircleFunction(layer)) {
                return _updateCircleSVG.call(this, layer);
            }
            if (layer._empty()) {
                return this._setPath(layer, 'M0 0');
            }

            var p = layer._map.latLngToLayerPoint(layer._latlng),
                r = layer._radius,
                r2 = layer._radiusY || r,
                start = p.rotated(layer.startAngle(), r),
                end = p.rotated(layer.stopAngle(), r);
            innerRadius = layer._innerRadius || 0

            var largeArc = (layer.options.stopAngle - layer.options.startAngle >= 180) ? '1' : '0';

            var d
            if (innerRadius > 0) {
                var innerStart = p.rotated(layer.startAngle(), innerRadius)
                var innerEnd = p.rotated(layer.stopAngle(), innerRadius)


                if (layer.isSemicircle()) {
                    d = 'M ' + start.x + ' ' + start.y
                    d += 'A ' + r + ',' + r2 + ',0,' + largeArc + ',1,' + end.x + ',' + end.y
                    d += 'L' + innerEnd.x + ',' + innerEnd.y + '\n'
                    d += 'A ' + innerRadius + ',' + innerRadius + ',0,' + largeArc + ',0,' + innerStart.x + ',' + innerStart.y
                    d += ' z';
                } else {
                    d = 'M ' + p.x + ' ' + p.y
                    d += ' m ' + -layer._radius + ' 0 '
                    d += 'a ' + r + ' ' + r2 + ' 0 1 0 ' + layer._radius * 2 + ' 0'
                    d += 'a ' + r + ' ' + r2 + ' 0 1 0 ' + -layer._radius * 2 + ' 0 z'
                    d += 'M ' + p.x + ' ' + p.y
                    d += ' m ' + (- innerRadius) + ' 0 '
                    d += 'a ' + innerRadius + ' ' + innerRadius + ' 0 1 1 ' + innerRadius * 2 + ' 0'
                    d += 'a ' + innerRadius + ' ' + innerRadius + ' 0 1 1 ' + -innerRadius * 2 + ' 0 z'
                }
            } else {
                d = 'M' + p.x + ',' + p.y +
                    // line to first start point
                    'L' + start.x + ',' + start.y +
                    'A ' + r + ',' + r2 + ',0,' + largeArc + ',1,' + end.x + ',' + end.y +
                    ' z';
            }

            this._setPath(layer, d);
        }
    });

    L.Canvas.include({
        _updateCircle: function (layer) {
            // If we want a circle, we use the original function
            if (useBaseCircleFunction(layer)) {
                return _updateCircleCanvas.call(this, layer);
            }

            if (!this._drawing || layer._empty()) { return; }

            var p = layer._map.latLngToLayerPoint(layer._latlng),
                ctx = this._ctx,
                r = layer._radius,
                innerRadius = layer._innerRadius || 0,
                s = (layer._radiusY || r) / r,
                start = p.rotated(layer.startAngle(), r),
                innerStart = p.rotated(layer.startAngle(), innerRadius),
                innerStop = p.rotated(layer.stopAngle(), innerRadius),
                startAngle = layer.startAngle(),
                stopAngle = layer.stopAngle(),
                isFullCircle = stopAngle - startAngle == 0


            if (isFullCircle) {
                stopAngle = startAngle + 2 * Math.PI
            }

            if (s !== 1) {
                ctx.save();
                ctx.scale(1, s);
            }

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            if (innerRadius > 0) {
                ctx.moveTo(innerStart.x, innerStart.y)
            }

            if (isFullCircle)
                ctx.moveTo(start.x, start.y)

            ctx.arc(p.x, p.y, r, layer.startAngle(), stopAngle);
            if (innerRadius > 0) {
                if (isFullCircle)
                    ctx.moveTo(innerStop.x, innerStop.y)
                ctx.arc(p.x, p.y, innerRadius, stopAngle, layer.startAngle(), true);
            }

            if (innerRadius == 0)
                ctx.lineTo(p.x, p.y);

            if (s !== 1) {
                ctx.restore();
            }

            this._fillStroke(ctx, layer);
        }
    });
});
