ymaps.modules.define('setCenter', ['getPolesOfInaccessibility', 'parseZoomData'], function (_provide, getPolylabelCenter, parseZoomData) {
    _provide(setCenter);

    function setCenter(target, geoObject, properties) {
        var labelCenterCoords = properties.labelCenterCoords;

        var autoCenterData = getPolylabelCenter(geoObject.geometry.getCoordinates(), 1.0);
        target.autoCenter = autoCenterData.center;
        target.polygonIndex = autoCenterData.index;

        if (labelCenterCoords) {
            if (Object.prototype.toString.call(labelCenterCoords) !== '[object Object]') {
                throw new Error('Center coords is not object');
            }
            Object.keys(labelCenterCoords).forEach(function (key) {
                var zoomArr = parseZoomData(key, true);
                zoomArr.forEach(function (z) {
                    target.data[z].center = labelCenterCoords[key];
                });
            });
        }
    }
});
//# sourceMappingURL=setCenter.ym.js.map

ymaps.modules.define("config", [], function (_provide) {
    _provide({
        MIN_ZOOM: 0,
        MAX_ZOOM: 19
    });
});
//# sourceMappingURL=config.ym.js.map

ymaps.modules.define('createLabel', [], function (_provide) {
    _provide(createLabel);

    function createLabel(options) {
        var labelHtml = options.labelHtml,
            labelText = options.labelText,
            labelTextClassName = options.labelTextClassName;

        var result = void 0;
        if (labelHtml) {
            result = labelHtml;
        } else {
            var label = document.createElement('div');
            label.innerHTML = labelText;
            if (labelTextClassName) {
                label.className = labelTextClassName;
            }
            result = label;
        }
        var LayoutClass = ymaps.templateLayoutFactory.createClass('<div style="position: absolute; top: {{properties.top}}px; ' + 'left: {{properties.left}}px">$[properties.html]</div>');
        return new ymaps.Placemark([0, 0], {
            html: result.outerHTML,
            top: 0,
            left: 0
        }, {
            iconLayout: LayoutClass
        });
    }
});
//# sourceMappingURL=createLabel.ym.js.map

ymaps.modules.define('util.polylabel', ['createLabel', 'setCenter', 'createDefaultLabelData', 'setZoomVisibility'], function (_provide, createLabel, setCenter, createDefaultLabelData, setZoomVisibility) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Polylabel = function () {
        /**
         * @param {Map} map - карта.
         * @param {GeoObjectCollection} collections - коллекция коллекций геообъектов.
         */
        function Polylabel(map, collections) {
            _classCallCheck(this, Polylabel);

            this._map = map;
            this._collections = collections;
            this._labelsCollections = new ymaps.GeoObjectCollection();
            this._initData();
        }

        Polylabel.prototype._initData = function _initData() {
            this._initMapListeners();
            this._calculateCollections(true);
            this._initCollectionListeners();
        };

        Polylabel.prototype._calculateCollections = function _calculateCollections(isFirstCals) {
            var _this = this;

            if (isFirstCals) {
                this._labelsCollections.options.set({ pane: 'phantom' });
                this._labelsCollections.removeAll();
                this._map.geoObjects.add(this._labelsCollections);
            }
            this._collections.each(function (collection) {
                var labelCollection = new ymaps.GeoObjectCollection();
                _this._labelsCollections.add(labelCollection);
                collection.each(function (geoObject) {
                    if (isFirstCals) {
                        _this._calculateGeoObject(geoObject, labelCollection).then(function () {
                            _this._analyseLabelData(geoObject);
                        });
                    } else {
                        _this._analyseLabelData(geoObject);
                    }
                });
            });
        };

        Polylabel.prototype._analyseLabelData = function _analyseLabelData(geoObject) {
            var _geoObject$properties = geoObject.properties.get('labelData'),
                labelData = _geoObject$properties.data,
                autoCenter = _geoObject$properties.autoCenter,
                label = _geoObject$properties.label;

            labelData = labelData[this._map.getZoom()];

            if (labelData.visibleForce || labelData.visible) {
                label.geometry.setCoordinates(labelData.center || autoCenter);
                label.options.set({ pane: 'places' });
            } else {
                label.options.set({ pane: 'phantom' });
            }
        };

        Polylabel.prototype._calculateGeoObject = function _calculateGeoObject(geoObject, labelCollection) {
            var _this2 = this;

            return new Promise(function (resolve) {
                var options = _this2._getOptions(geoObject);
                var properties = _this2._getProperties(geoObject);
                var labelData = createDefaultLabelData();
                setCenter(labelData, geoObject, properties);
                var label = createLabel(options);
                labelCollection.add(label);
                label.getOverlay().then(function (overlay) {
                    overlay.getLayout().then(function (layout) {
                        var size = layout._element.firstChild.getBoundingClientRect();
                        label.properties.set({
                            top: -(size.height / 2),
                            left: -(size.width / 2)
                        });
                        setZoomVisibility(_this2._map, labelData, geoObject, size, options.labelForceVisibleZoom);
                        labelData.label = label;
                        geoObject.properties.set('labelData', labelData);
                        resolve();
                    });
                });
            });
        };

        Polylabel.prototype._getOptions = function _getOptions(obj) {
            var mainOpts = ['labelForceVisibleZoom', 'labelTextClassName', 'labelHtml', 'labelText'];
            var options = obj.options;
            var result = {};
            mainOpts.forEach(function (key) {
                result[key] = options.get(key, null);
            });
            return result;
        };

        Polylabel.prototype._getProperties = function _getProperties(obj) {
            var mainOpts = ['labelCenterCoords'];
            var properties = obj.properties;
            var result = {};
            mainOpts.forEach(function (key) {
                result[key] = properties.get(key, null);
            });
            return result;
        };

        Polylabel.prototype._initMapListeners = function _initMapListeners() {
            var _this3 = this;

            this._map.events.add('boundschange', function (event) {
                if (event.get('newZoom') !== event.get('oldZoom')) {
                    _this3._calculateCollections();
                }
            });
        };

        Polylabel.prototype._initCollectionListeners = function _initCollectionListeners() {
            var _this4 = this;

            this._collections.events.add(['add', 'remove'], function (event) {
                switch (event.get('type')) {
                    case 'add':
                        {}
                    case 'remove':
                        {
                            _this4._calculateCollections(true);
                            break;
                        }
                }
            });
        };

        return Polylabel;
    }();

    _provide(Polylabel);
});
//# sourceMappingURL=util.polylabel.ym.js.map

ymaps.modules.define('calculateArea', [], function (_provide) {
    _provide(calculateArea);

    // Equatorial radius of Earth
    var RADIUS = 6378137;

    function calculateArea(feature) {
        var geoJsonGeometry = getGeoJsonGeometry(feature);
        return calculateJsonGeometryArea(geoJsonGeometry);
    }

    function getGeoJsonGeometry(feature) {
        if (feature.type === 'Feature') {
            return feature.geometry;
        } else if (feature.geometry && feature.geometry.getType) {
            if (feature.geometry.getType() === 'Circle') {
                return {
                    type: 'Circle',
                    coordinates: feature.geometry.getCoordinates(),
                    radius: feature.geometry.getRadius()
                };
            }
            return {
                type: feature.geometry.getType(),
                coordinates: feature.geometry.getCoordinates()
            };
        } else {
            throw new Error('util.calculateArea: Unknown input object.');
        }
    }

    function calculateJsonGeometryArea(geometry) {
        var area = 0;
        var i;
        switch (geometry.type) {
            case 'Polygon':
                return polygonArea(geometry.coordinates);
            case 'MultiPolygon':
                for (i = 0; i < geometry.coordinates.length; i++) {
                    area += polygonArea(geometry.coordinates[i]);
                }
                return area;
            case 'Rectangle':
                return polygonArea([[geometry.coordinates[0], [geometry.coordinates[0][0], geometry.coordinates[1][1]], geometry.coordinates[1], [geometry.coordinates[1][0], geometry.coordinates[0][1]], geometry.coordinates[0]]]);
            case 'Circle':
                return Math.PI * Math.pow(geometry.radius, 2);
            case 'Point':
            case 'MultiPoint':
            case 'LineString':
            case 'MultiLineString':
                return 0;
        }
    }

    function polygonArea(coords) {
        var area = 0;
        if (coords && coords.length > 0) {
            area += Math.abs(ringArea(coords[0]));
            for (var i = 1; i < coords.length; i++) {
                area -= Math.abs(ringArea(coords[i]));
            }
        }
        return area;
    }

    /**
     * Modified version of https://github.com/mapbox/geojson-area
     * Calculate the approximate area of the polygon were it projected onto
     *     the earth.  Note that this area will be positive if ring is oriented
     *     clockwise, otherwise it will be negative.
     *
     * Reference:
     * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
     *     Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
     *     Laboratory, Pasadena, CA, June 2007 https://trs.jpl.nasa.gov/handle/2014/40409
     *
     * Returns:
     * {Number} The approximate signed geodesic area of the polygon in square
     *     meters.
     */

    function ringArea(coords) {
        var p1;
        var p2;
        var p3;
        var lowerIndex;
        var middleIndex;
        var upperIndex;
        var i;
        var area = 0;
        var coordsLength = coords.length;
        var longitude = ymaps.meta.coordinatesOrder === 'latlong' ? 1 : 0;
        var latitude = ymaps.meta.coordinatesOrder === 'latlong' ? 0 : 1;

        if (coordsLength > 2) {
            for (i = 0; i < coordsLength; i++) {
                // i = N-2
                if (i === coordsLength - 2) {
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength - 1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {
                    // i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else {
                    // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i + 1;
                    upperIndex = i + 2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += (rad(p3[longitude]) - rad(p1[longitude])) * Math.sin(rad(p2[latitude]));
            }

            area = area * RADIUS * RADIUS / 2;
        }

        return area;
    }

    function rad(_) {
        return _ * Math.PI / 180;
    }
});
//# sourceMappingURL=calculateArea.ym.js.map

ymaps.modules.define('checkPointPosition', [], function (_provide) {
    _provide(isInside);

    /**
         * Проверятет находится ли точка внутри геометрии
         * @param {Array[2]} point - Координаты точки.
         * @param {Array} coords - Координаты фигуры.
         */
    function isInside(point, coords) {
        var parity = 0;
        for (var i = 0; i < coords.length - 1; i++) {
            var e = [coords[i], coords[i + 1]];
            switch (edgeType(point, e)) {
                case 'TOUCHING':
                    return 'BOUNDARY';
                case 'CROSSING':
                    parity = 1 - parity;
            }
        }
        return parity ? 'INSIDE' : 'OUTSIDE';
    }

    /**
     * Определяет положение точки относительно ребра
     * @param {Array[2]} p - Исследуемая точка.
     * @param {Array[2]} p0 - Точка ребра.
     * @param {Array[2]} p1 - Точка ребра.
     */
    function pointClassify(p, p0, p1) {
        var a = pointMinus(p1, p0);
        var b = pointMinus(p, p0);
        var sa = a[0] * b[1] - b[0] * a[1];
        if (sa > 0) {
            return 'LEFT';
        }
        if (sa < 0) {
            return 'RIGHT';
        }
        if (a[0] * b[0] < 0 || a[1] * b[1] < 0) {
            return 'BEHIND';
        }
        if (pointLength(a) < pointLength(b)) {
            return 'BEYOND';
        }
        if (pointEquals(p0, p)) {
            return 'ORIGIN';
        }
        if (pointEquals(p1, p)) {
            return 'DESTINATION';
        }
        return 'BETWEEN';
    }

    function pointMinus(p1, p2) {
        return [p1[0] - p2[0], p1[1] - p2[1]];
    }

    function pointLength(p) {
        return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
    }

    function pointEquals(p1, p2) {
        return p1[0] === p2[0] && p1[1] === p2[1];
    }

    /**
     * Определяет как луч из точки взаимодействет с ребром (Пересекается, Касается, Нейтрально)
     * @param {Arrya[2]} point - Исследуемая точка.
     * @param {Array} edge - Ребро.
     */
    function edgeType(point, edge) {
        var v = edge[0];
        var w = edge[1];
        switch (pointClassify(point, v, w)) {
            case 'LEFT':
                {
                    return v[1] < point[1] && point[1] <= w[1] ? 'CROSSING' : 'INESSENTIAL';
                }
            case 'RIGHT':
                {
                    return w[1] < point[1] && point[1] <= v[1] ? 'CROSSING' : 'INESSENTIAL';
                }
            case 'BETWEEN':
            case 'ORIGIN':
            case 'DESTINATION':
                return 'TOUCHING';
            default:
                {
                    return 'INESSENTIAL';
                }
        }
    }
});
//# sourceMappingURL=checkPointPosition.ym.js.map

ymaps.modules.define('createDefaultLabelData', ['config'], function (_provide, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(createDefaultLabelData);

    function createDefaultLabelData() {
        var i = MIN_ZOOM;
        var result = {
            data: {},
            autoCenter: [0, 0],
            polygonIndex: 0
        };
        while (i <= MAX_ZOOM) {
            result.data[i] = {
                visible: false,
                visibleForce: false,
                center: null
            };
            i++;
        }
        return result;
    }
});
//# sourceMappingURL=createDefaultLabelData.ym.js.map

ymaps.modules.define('getPolesOfInaccessibility', ['calculateArea'], function (_provide, calculateArea) {
    _provide(getPolylabelCenter);

    function TinyQueue(data, compare) {
        if (!(this instanceof TinyQueue)) return new TinyQueue(data, compare);

        this.data = data || [];
        this.length = this.data.length;
        this.compare = compare || defaultCompare;

        if (this.length > 0) {
            for (var i = this.length >> 1; i >= 0; i--) {
                this._down(i);
            }
        }
    }

    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    TinyQueue.prototype = {

        push: function push(item) {
            this.data.push(item);
            this.length++;
            this._up(this.length - 1);
        },

        pop: function pop() {
            if (this.length === 0) return undefined;

            var top = this.data[0];
            this.length--;

            if (this.length > 0) {
                this.data[0] = this.data[this.length];
                this._down(0);
            }
            this.data.pop();

            return top;
        },

        peek: function peek() {
            return this.data[0];
        },

        _up: function _up(pos) {
            var data = this.data;
            var compare = this.compare;
            var item = data[pos];

            while (pos > 0) {
                var parent = pos - 1 >> 1;
                var current = data[parent];
                if (compare(item, current) >= 0) break;
                data[pos] = current;
                pos = parent;
            }

            data[pos] = item;
        },

        _down: function _down(pos) {
            var data = this.data;
            var compare = this.compare;
            var halfLength = this.length >> 1;
            var item = data[pos];

            while (pos < halfLength) {
                var left = (pos << 1) + 1;
                var right = left + 1;
                var best = data[left];

                if (right < this.length && compare(data[right], best) < 0) {
                    left = right;
                    best = data[right];
                }
                if (compare(best, item) >= 0) break;

                data[pos] = best;
                pos = left;
            }

            data[pos] = item;
        }
    };

    var Queue = TinyQueue;

    function getPolesOfInaccessibility(polygon, precision, debug) {
        precision = precision || 1.0;

        // find the bounding box of the outer ring
        var minX;
        var minY;
        var maxX;
        var maxY;

        for (var i = 0; i < polygon[0].length; i++) {
            var p = polygon[0][i];
            if (!i || p[0] < minX) minX = p[0];
            if (!i || p[1] < minY) minY = p[1];
            if (!i || p[0] > maxX) maxX = p[0];
            if (!i || p[1] > maxY) maxY = p[1];
        }

        var width = maxX - minX;
        var height = maxY - minY;
        var cellSize = Math.min(width, height);
        var h = cellSize / 2;

        // a priority queue of cells in order of their "potential" (max distance to polygon)
        var cellQueue = new Queue(null, compareMax);

        if (cellSize === 0) return [minX, minY];

        // cover polygon with initial cells
        for (var x = minX; x < maxX; x += cellSize) {
            for (var y = minY; y < maxY; y += cellSize) {
                cellQueue.push(new Cell(x + h, y + h, h, polygon));
            }
        }

        // take centroid as the first best guess
        var bestCell = getCentroidCell(polygon);

        // special case for rectangular polygons
        var bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
        if (bboxCell.d > bestCell.d) bestCell = bboxCell;

        var numProbes = cellQueue.length;

        while (cellQueue.length) {
            // pick the most promising cell from the queue
            var cell = cellQueue.pop();

            // update the best cell if we found a better one
            if (cell.d > bestCell.d) {
                bestCell = cell;
                if (debug) console.error('found best %d after %d probes', Math.round(1e4 * cell.d) / 1e4, numProbes);
            }

            // do not drill down further if there's no chance of a better solution
            if (cell.max - bestCell.d <= precision) continue;

            // split the cell into four cells
            h = cell.h / 2;
            cellQueue.push(new Cell(cell.x - h, cell.y - h, h, polygon));
            cellQueue.push(new Cell(cell.x + h, cell.y - h, h, polygon));
            cellQueue.push(new Cell(cell.x - h, cell.y + h, h, polygon));
            cellQueue.push(new Cell(cell.x + h, cell.y + h, h, polygon));
            numProbes += 4;
        }

        if (debug) {
            console.error('num probes: ' + numProbes);
            console.error('best distance: ' + bestCell.d);
        }

        return [bestCell.x, bestCell.y];
    }

    function compareMax(a, b) {
        return b.max - a.max;
    }

    function Cell(x, y, h, polygon) {
        this.x = x; // cell center x
        this.y = y; // cell center y
        this.h = h; // half the cell size
        this.d = pointToPolygonDist(x, y, polygon); // distance from cell center to polygon
        this.max = this.d + this.h * Math.SQRT2; // max distance to polygon within a cell
    }

    // signed distance from point to polygon outline (negative if point is outside)
    function pointToPolygonDist(x, y, polygon) {
        var inside = false;
        var minDistSq = Infinity;

        for (var k = 0; k < polygon.length; k++) {
            var ring = polygon[k];

            for (var i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
                var a = ring[i];
                var b = ring[j];

                if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;

                minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
            }
        }

        return (inside ? 1 : -1) * Math.sqrt(minDistSq);
    }

    // get polygon centroid
    function getCentroidCell(polygon) {
        var area = 0;
        var x = 0;
        var y = 0;
        var points = polygon[0];

        for (var i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            var a = points[i];
            var b = points[j];
            var f = a[0] * b[1] - b[0] * a[1];
            x += (a[0] + b[0]) * f;
            y += (a[1] + b[1]) * f;
            area += f * 3;
        }
        if (area === 0) return new Cell(points[0][0], points[0][1], 0, polygon);
        return new Cell(x / area, y / area, 0, polygon);
    }

    // get squared distance from a point to a segment
    function getSegDistSq(px, py, a, b) {
        var x = a[0];
        var y = a[1];
        var dx = b[0] - x;
        var dy = b[1] - y;

        if (dx !== 0 || dy !== 0) {
            var t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = b[0];
                y = b[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = px - x;
        dy = py - y;

        return dx * dx + dy * dy;
    }

    /**
     * Возвращает оптимальный центр из полигона и индекс полигона
     * @param {Array} polygonCoords - координаты полигона
     * @param {number} precision
     * @param {boolean} debug
     */
    function getPolylabelCenter(polygonCoords, precision, debug) {
        var maxArea = Number.MIN_VALUE;
        var indexOfMaxArea = 0;
        var data = void 0;
        if (polygonCoords.length > 1) {
            for (var i = 0; i < polygonCoords.length; i++) {
                var polygon = new ymaps.GeoObject({
                    geometry: {
                        type: 'Polygon', coordinates: [polygonCoords[i]]
                    }
                });
                var area = Math.round(calculateArea(polygon));
                if (maxArea < area) {
                    maxArea = area;
                    indexOfMaxArea = i;
                }
            }
            data = [polygonCoords[indexOfMaxArea]];
        } else {
            data = polygonCoords;
        }
        return {
            center: getPolesOfInaccessibility(data, precision, debug),
            index: indexOfMaxArea
        };
    }
});
//# sourceMappingURL=getPolesOfInaccessibility.ym.js.map

ymaps.modules.define('parseZoomData', ['util.array', 'config'], function (_provide, _utilArray, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(parseZoomData);

    var isOnlyVisible = false;
    var onlyVisibleZooms = [];

    function parseZoomData(zoomData, pIsOnlyVisible) {
        isOnlyVisible = pIsOnlyVisible;
        onlyVisibleZooms = [];

        var zoom = createDefZoomObj();
        if (typeof zoomData === 'number' || !isNaN(Number(zoomData)) && zoomData !== null) {
            parseNumber(zoom, Number(zoomData));
            checkOnOnlyVisible(Number(zoomData));
        } else if (_utilArray.isArray(zoomData)) {
            parseArray(zoom, zoomData);
        } else if (typeof zoomData === 'string') {
            if (parseString(zoom, zoomData) === 'err') {
                return zoom;
            }
        }
        if (isOnlyVisible) {
            return onlyVisibleZooms;
        }
        return zoom;
    }

    function parseNumber(target, zoom) {
        target[zoom] = true;
    }

    function parseArray(target, zoom) {
        zoom.forEach(function (z) {
            if (typeof z === 'number' || !isNaN(Number(z)) && z !== null) {
                parseNumber(target, Number(z));
                checkOnOnlyVisible(Number(z));
            } else if (typeof z === 'string') {
                parseString(target, z);
            }
        });
    }

    function parseString(target, zoom) {
        var zoomRange = zoom.split('_').map(Number);
        if (isNaN(zoomRange[0]) || isNaN(zoomRange[1])) {
            return 'err';
        }
        var bottom = zoomRange[0] < MIN_ZOOM ? MIN_ZOOM : zoomRange[0];
        var top = zoomRange[1] > MAX_ZOOM ? MAX_ZOOM : zoomRange[1];
        while (bottom <= top) {
            target[bottom] = true;
            checkOnOnlyVisible(bottom);
            bottom++;
        }
    }

    function checkOnOnlyVisible(zoom) {
        if (isOnlyVisible) {
            onlyVisibleZooms.push(zoom);
        }
    }

    function createDefZoomObj() {
        var i = MIN_ZOOM;
        var result = {};
        while (i <= MAX_ZOOM) {
            result[i] = false;
            i++;
        }
        return result;
    }
});
//# sourceMappingURL=parseZoomData.ym.js.map

ymaps.modules.define('setZoomVisibility', ['checkPointPosition', 'config', 'parseZoomData'], function (_provide, isInside, CONFIG, parseZoomData) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(setZoomVisibility);

    function setZoomVisibility(map, target, geoObject, labelSize, labelForceVisibleZoom) {
        var forceZoomData = parseZoomData(labelForceVisibleZoom);
        var coords = geoObject.geometry.getCoordinates()[target.polygonIndex];
        var autoZoom = getFirstZoomInside(map, target.autoCenter, coords, labelSize);

        Object.keys(target.data).forEach(function (z) {
            if (!target.data[z].center) {
                target.data[z].visible = z >= autoZoom;
            } else {
                var zoom = getFirstZoomInside(map, target.data[z].center, coords, labelSize);
                target.data[z].visible = z >= zoom;
            }
            target.data[z].visibleForce = forceZoomData[z];
        });
    }

    function getFirstZoomInside(map, center, coords, size) {
        var i = MIN_ZOOM;
        var j = MAX_ZOOM;
        var zoom = void 0;
        var result = void 0;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var elemPoints = getElemPoints(map, center, zoom, size);
            result = checkIsInside(map, coords, elemPoints, zoom);
            if (result) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    }

    function getElemPoints(map, center, zoom, size) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = size.width;
        var h = size.height;
        var elemPoints = [];
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2], [centerProj[0] - w / 2, centerProj[1] + h / 2], [centerProj[0] + w / 2, centerProj[1] - h / 2], [centerProj[0] + w / 2, centerProj[1] + h / 2]);
        return elemPoints;
    }

    function checkIsInside(map, coords, elemPoints, zoom) {
        for (var i = 0; i < elemPoints.length; i++) {
            var point = map.options.get('projection').fromGlobalPixels(elemPoints[i], zoom);
            if (isInside(point, coords) !== 'INSIDE') {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=setZoomVisibility.ym.js.map
