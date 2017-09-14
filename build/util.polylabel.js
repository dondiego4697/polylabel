ymaps.modules.define('setCenter', ['util.array', 'util.objectKeys', 'getPolesOfInaccessibility', 'parseZoomData'], function (_provide, _utilArray, _utilObjectKeys, getPolylabelCenter, parseZoomData) {

    /**
     * Set centers for each zoom;
     * @param {Object} target - Target object containing each zoom in properties.
     * @param {GeoObject} geoObject
     * @param {Object} properties
     * @param {Array | Object} properties.labelCenterCoords - Center data.
     * May be one point(Array) or for certains zooms(Object).
    */
    function setCenter(target, geoObject, properties) {
        var labelCenterCoords = properties.labelCenterCoords;

        var autoCenterData = getPolylabelCenter(geoObject.geometry.getCoordinates(), 1.0);
        target.autoCenter = autoCenterData.center;
        target.polygonIndex = autoCenterData.index;

        if (_utilArray.isArray(labelCenterCoords)) {
            _utilObjectKeys(target.zoomInfo).forEach(function (z) {
                target.zoomInfo[z].center = labelCenterCoords;
            });
        } else if (Object.prototype.toString.call(labelCenterCoords) === '[object Object]') {
            var data = parseZoomData(labelCenterCoords);
            _utilObjectKeys(data).forEach(function (z) {
                if (typeof data[z] !== 'undefined') {
                    target.zoomInfo[z].center = data[z];
                }
            });
        }
    }

    _provide(setCenter)
});
//# sourceMappingURL=setCenter.js.map

ymaps.modules.define('config', [], function (_provide) {
    _provide({
        MIN_ZOOM: 0,
        MAX_ZOOM: 19,
        options: ['labelHtml', 'labelText', 'labelForceVisibleZoom', 'labelTextClassName', 'labelTextSize', 'outlineColor', 'textColor', 'maxFitTextSize'],
        properties: ['labelCenterCoords']
    });
});
//# sourceMappingURL=config.js.map

ymaps.modules.define('createLabelLayout', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {
    /**
     * Label layout tamplate
    */
    var template = templateLayoutFactory.createClass('<div {% style %}position: {{properties.position}}; top: {{properties.top}}px;' + 'left: {{properties.left}}px; {% endstyle %}>$[properties.html]</div>');

    _provide(template);
});
//# sourceMappingURL=createLabelLayout.js.map

ymaps.modules.define('Label', ['util.extend', 'stringReplacer'], function (_provide, _utilExtend, stringReplacer) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Label = function () {
        /**
         * Create a Label
         * @param {GeoObject} geoObject
         * @param {Object} options
         * @param {templateLayoutFactory} LayoutClass
         * @param {GeoObjectCollection} parentCollection
         */
        function Label(geoObject, options, LayoutClass, parentCollection) {
            _classCallCheck(this, Label);

            if (!geoObject || !LayoutClass || !parentCollection) {
                throw new Error('wrong argument');
            }
            this._geoObject = geoObject;
            this._parentCollection = parentCollection;
            this._options = options;
            this._label = null;
            this._LayoutClass = LayoutClass;
            this._initLabel();
        }

        /**
         * @return {Placemark} The instance of Placemark.
         */


        Label.prototype.getPlacemark = function getPlacemark() {
            return this._label;
        };

        Label.prototype.calculateLabelSize = function calculateLabelSize(size) {
            this.removeFromCollection();
            var h = size.height / 2;
            var w = size.width / 2;
            this._label = Label._createPlacemark({
                properties: _utilExtend({}, this._label.properties.getAll(), {
                    top: -h,
                    left: -w
                }),
                options: _utilExtend({}, this._label.options.getAll(), {
                    iconShape: {
                        type: 'Rectangle',
                        coordinates: [[-w, -h], [w, h]]
                    }
                })
            }, this._LayoutClass);
            this.addToCollection();
        };

        Label.prototype.removeFromCollection = function removeFromCollection() {
            if (!this._parentCollection) {
                return false;
            }
            this._parentCollection.remove(this._label);
        };

        Label.prototype.addToCollection = function addToCollection() {
            if (!this._parentCollection) {
                return false;
            }
            this._parentCollection.add(this._label);
        };

        Label.prototype._initLabel = function _initLabel() {
            var labelHtml = this._options.labelHtml;

            var result = void 0;
            if (labelHtml) {
                result = labelHtml;
            } else {
                result = this._createLabelContentWithPresets();
            }
            this._label = Label._createPlacemark({
                properties: {
                    html: result
                },
                options: this._options
            }, this._LayoutClass);
        };

        Label._createPlacemark = function _createPlacemark(params, LayoutClass) {
            var properties = params.properties,
                options = params.options;

            properties = _utilExtend({}, {
                top: 0,
                left: 0,
                position: 'absolute'
            }, properties);
            options = _utilExtend({}, {
                iconLayout: LayoutClass
            }, options);
            return new ymaps.Placemark([0, 0], properties, options);
        };

        Label.prototype._createLabelContentWithPresets = function _createLabelContentWithPresets() {
            var _options = this._options,
                labelText = _options.labelText,
                labelTextClassName = _options.labelTextClassName,
                labelTextSize = _options.labelTextSize,
                outlineColor = _options.outlineColor,
                textColor = _options.textColor;

            var textShadow = '\n        1px 1px 0 ' + outlineColor + ',\n        -1px -1px 0 ' + outlineColor + ',\n        1px -1px 0 ' + outlineColor + ',\n        -1px 1px 0 ' + outlineColor;
            var template = '<div class="$1" style="font-size: $2; color: $3; text-shadow: $4">$5</div>';
            return stringReplacer(template, [labelTextClassName, labelTextSize, textColor, textShadow, labelText]);
        };

        Label.prototype._initEvents = function _initEvents() {
            this._label.events.add('click', this._labelClick, this);
        };

        Label.prototype._labelClick = function _labelClick() {
            this._geoObject.events.fire('labelClick', {
                targetLabel: this._label
            });
        };

        Label.prototype._removeClickEvent = function _removeClickEvent() {
            this._label.events.remove('click', this._labelClick, this);
        };

        Label.prototype.destroy = function destroy() {
            this._removeClickEvent();
            this.removeFromCollection();
            this._label = null;
        };

        return Label;
    }();

    _provide(Label);
});
//# sourceMappingURL=Label.js.map

ymaps.modules.define('setPresets', ['util.extend'], function (_provide, _utilExtend) {
    var DATA = {
        Big: createFontSize('20px'),
        Small: createFontSize('12px'),
        BlackInWhiteOutline: createColorPreset('black', 'white'),
        HhiteInBlackOutline: createColorPreset('white', 'black')
    };
    var PREFIX = 'polylabel#';

    _provide(function (parent) {
        var presetStorage = ymaps.option.presetStorage;

        parent.options.set('preset', 'polylabel#default');
        presetStorage.add('polylabel#default', _utilExtend({}, createFontSize('16px'), createColorPreset('black')));

        createPresets(presetStorage);
    });

    function createPresets(presetStorage) {
        var sizes = ['Big', 'Small'];
        var colors = ['BlackInWhiteOutline', 'WhiteInBlackOutline'];

        sizes.forEach(function (size) {
            presetStorage.add('' + PREFIX + size, _utilExtend({}, DATA[size]));
        });

        colors.forEach(function (color) {
            presetStorage.add('' + PREFIX + color, _utilExtend({}, DATA[color]));
        });

        sizes.forEach(function (size) {
            colors.forEach(function (color) {
                presetStorage.add('' + PREFIX + size + color, _utilExtend({}, DATA[size], DATA[color]));
            });
        });
    }

    function createFontSize(labelTextSize) {
        return {
            labelTextSize: labelTextSize
        };
    }

    function createColorPreset(textColor, outlineColor) {
        return {
            textColor: textColor,
            outlineColor: outlineColor
        };
    }
});
//# sourceMappingURL=setPresets.js.map

ymaps.modules.define('util.polylabel', ['Label', 'setCenter', 'createDefaultLabelData', 'setZoomVisibility', 'setPresets', 'config', 'createLabelLayout', 'getMaxFitTextSize'], function (_provide, Label, setCenter, createDefaultLabelData, setZoomVisibility, setPresets, CONFIG, createLabelLayout, getMaxFitTextSize) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Polylabel = function () {
        /**
         * @param {Map} map
         */
        function Polylabel(map, labelsCollection, polygonsCollection) {
            _classCallCheck(this, Polylabel);

            this._map = map;
            this._polygonsCollection = polygonsCollection;
            this._labelsCollection = labelsCollection;
            this._labelLayout = createLabelLayout;
            this._initData();
        }

        Polylabel.prototype.update = function update() {
            this._calculateCollections(true);
        };

        Polylabel.prototype.destroy = function destroy() {
            this._labelsCollection.removeAll();
            this._deleteListeners();
        };

        Polylabel.prototype._initData = function _initData() {
            var _this = this;

            setPresets(this._labelsCollection);
            this._calculateCollections(true).then(function () {
                _this._initMapListeners();
                _this._initCollectionListeners();
            });
        };

        Polylabel.prototype._calculateCollections = function _calculateCollections(isFirstCals) {
            var _this2 = this;

            return new Promise(function (resolve) {
                if (isFirstCals) {
                    _this2._clearLabelCollections();
                }
                _this2._polygonsCollection.each(function (geoObject) {
                    if (isFirstCals) {
                        _this2._calculateGeoObject(geoObject).then(function () {
                            _this2._calculateAndSetLabelData(geoObject);
                        });
                    } else {
                        _this2._calculateAndSetLabelData(geoObject);
                    }
                });
                resolve();
            });
        };

        Polylabel.prototype._calculateAndSetLabelData = function _calculateAndSetLabelData(geoObject) {
            var labelData = geoObject.properties.get('_labelData');
            if (!labelData) {
                return;
            }
            var zoomInfo = labelData.zoomInfo,
                autoCenter = labelData.autoCenter,
                label = labelData.label;

            zoomInfo = zoomInfo[this._map.getZoom()];

            label = label.getPlacemark();
            label.geometry.setCoordinates(zoomInfo.center || autoCenter);
            var isVisible = typeof zoomInfo.visibleForce === 'undefined' ? zoomInfo.visible : zoomInfo.visibleForce;
            label.options.set({
                pane: isVisible ? 'places' : 'phantom'
            });
        };

        Polylabel.prototype._calculateGeoObject = function _calculateGeoObject(geoObject) {
            var _this3 = this;

            var options = this._getOptions(geoObject);
            var properties = this._getProperties(geoObject);
            var labelData = createDefaultLabelData();
            setCenter(labelData, geoObject, properties);
            var labelInst = new Label(geoObject, options, this._labelLayout, this._labelsCollection);
            labelInst.addToCollection();
            return labelInst.getPlacemark().getOverlay().then(function (overlay) {
                return overlay.getLayout();
            }).then(function (layout) {
                var size = layout.getElement().firstChild.getBoundingClientRect();
                labelInst.calculateLabelSize(size);
                labelInst._initEvents();
                setZoomVisibility(_this3._map, labelData, geoObject, size, options.labelForceVisibleZoom);
                labelData.label = labelInst;
                geoObject.properties.set('_labelData', labelData);
            });
        };

        Polylabel.prototype._recalculateGeoObject = function _recalculateGeoObject(geoObject) {
            var _this4 = this;

            this._calculateGeoObject(geoObject).then(function () {
                _this4._calculateAndSetLabelData(geoObject);
            });
        };

        Polylabel.prototype._getOptions = function _getOptions(obj) {
            var result = {};
            CONFIG.options.forEach(function (key) {
                result[key] = obj.options.get(key);
            });
            return result;
        };

        Polylabel.prototype._getProperties = function _getProperties(obj) {
            var result = {};
            CONFIG.properties.forEach(function (key) {
                result[key] = obj.properties.get(key);
            });
            return result;
        };

        Polylabel.prototype._clearLabelCollections = function _clearLabelCollections() {
            this._labelsCollection.removeAll();
            this._labelsCollection.options.set({
                pane: 'phantom'
            });
        };

        Polylabel.prototype._initCollectionListeners = function _initCollectionListeners() {
            this._polygonsCollection.events.add(['add', 'remove'], this._onCollectionEvents, this);
        };

        Polylabel.prototype._onMapBoundsChange = function _onMapBoundsChange(event) {
            if (event.get('newZoom') !== event.get('oldZoom')) {
                this._calculateCollections();
            }
        };

        Polylabel.prototype._onCollectionEvents = function _onCollectionEvents(event) {
            console.log(event);
            switch (event.get('type')) {
                case 'add':
                    {
                        this._recalculateGeoObject(event.get('child'));
                        break;
                    }
                case 'remove':
                    {
                        event.get('child').properties.get('_labelData').label.destroy();
                        break;
                    }
            }
        };

        Polylabel.prototype._initMapListeners = function _initMapListeners() {
            this._map.events.add('boundschange', this._onMapBoundsChange, this);
        };

        Polylabel.prototype._deleteListeners = function _deleteListeners() {
            this._polygonsCollection.events.remove(['add', 'remove'], this._onCollectionEvents, this);
            this._map.events.remove('boundschange', this._onMapBoundsChange, this);
        };

        return Polylabel;
    }();

    _provide(Polylabel);
});
//# sourceMappingURL=util.polylabel.js.map

ymaps.modules.define('checkPointPosition', [], function (_provide) {
    _provide(isInside);

    /**
         * Check if the point is inside geometry.
         * @param {Array[2]} point - Point coordinates.
         * @param {Array} coords - Geometry coordinates.
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
     * Determines the position of the point relative to the edge.
     * @param {Array[2]} p - Main point.
     * @param {Array[2]} p0 - First edge point.
     * @param {Array[2]} p1 - Second edge point.
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
     * Determines how a ray from a point interacts with an edge (Crosses, Affects, Neutral).
     * @param {Arrya[2]} point - Main point.
     * @param {Array} edge - Edge.
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
//# sourceMappingURL=checkPointPosition.js.map

ymaps.modules.define('createDefaultLabelData', ['config'], function (_provide, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(function () {
        var i = MIN_ZOOM;
        var result = {
            zoomInfo: {}, // Object with info for every zoom
            autoCenter: [0, 0],
            polygonIndex: 0
        };
        while (i <= MAX_ZOOM) {
            result.zoomInfo[i] = {
                visible: false,
                visibleForce: undefined,
                center: undefined,
                maxFitTextSize: undefined
            };
            i++;
        }
        return result;
    });
});
//# sourceMappingURL=createDefaultLabelData.js.map

ymaps.modules.define("getMaxFitTextSize", [], function (_provide) {
    _provide(function (geoObject) {
        console.log(geoObject);
    });
});
//# sourceMappingURL=getMaxFitTextSize.js.map

ymaps.modules.define('getPolesOfInaccessibility', ['util.calculateArea'], function (_provide, calculateArea) {
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
     * Returns the optimal center from the polygon and the index of the largest.
     * @param {Array} polygonCoords - Polygon geometry.
     * @param {number} precision
     * @param {boolean} debug
     */
    function getPolylabelCenter(polygonCoords, precision, debug) {
        if (typeof calculateArea === 'undefined') {
            throw new Error('Didn\'t find calculateArea module');
        }
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
//# sourceMappingURL=getPolesOfInaccessibility.js.map

ymaps.modules.define('stringReplacer', [], function (_provide) {
    _provide(function (template, argsArr) {
        var result = template;
        argsArr.forEach(function (item, i) {
            result = result.replace(new RegExp('\\$' + (i + 1), 'g'), item);
        });
        return result;
    });
});
//# sourceMappingURL=stringReplacer.js.map

ymaps.modules.define('parseZoomData', ['util.objectKeys', 'config'], function (_provide, _utilObjectKeys, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;


    /**
     * Parse data about zoom.
     * @param {Object} zoomData
     * Supported object properties view: number, string
     * @return {Object} - Returned object with zoom, where the parsed values.
     * @example
     * zoomData = {1: 'value1', '3_5': 'value2'}
     * return {1: 'value1', 2: undefined ... 3: 'value2', 4: 'value2', 5: 'value2', 6: undefined ...}
    */
    function parseZoomData(zoomData) {
        var result = createDefZoomObj();
        _utilObjectKeys(zoomData).forEach(function (key) {
            if (typeof key === 'string') {
                parseString(result, key, zoomData[key]);
            } else if (typeof key === 'number') {
                parseNumber(result, key, zoomData[key]);
            }
        });
        return result;
    }

    _provide(parseZoomData)

    function parseNumber(target, zoom, value) {
        target[zoom] = value;
    }

    function parseString(target, zoom, value) {
        if (!isNaN(Number(zoom))) {
            target[Number(zoom)] = value;
            return;
        }
        var zoomRange = zoom.split('_').map(Number);
        if (isNaN(zoomRange[0]) || isNaN(zoomRange[1])) {
            return;
        }
        var bottom = zoomRange[0] < MIN_ZOOM ? MIN_ZOOM : zoomRange[0];
        var top = zoomRange[1] > MAX_ZOOM ? MAX_ZOOM : zoomRange[1];
        while (bottom <= top) {
            target[bottom] = value;
            bottom++;
        }
    }

    function createDefZoomObj() {
        var i = MIN_ZOOM;
        var result = {};
        while (i <= MAX_ZOOM) {
            result[i] = undefined;
            i++;
        }
        return result;
    }
});
//# sourceMappingURL=parseZoomData.js.map

ymaps.modules.define('setZoomVisibility', ['util.objectKeys', 'checkPointPosition', 'config', 'parseZoomData'], function (_provide, _utilObjectKeys, isInside, CONFIG, parseZoomData) {

    /**
     * Set zoom visibility for each zoom;
     * @param {Map} map
     * @param {Object} target - Target object containing each zoom in properties.
     * @param {GeoObject} geoObject
     * @param {Object} labelSize
     * @param {Nubmer} labelSize.width
     * @param {Nubmer} labelSize.height
     * @param {Boolean | Object} labelForceVisibleZoom - Zoom visibility data.
     * May be one rule(boolean) or for certains zooms(Object).
    */
    function setZoomVisibility(map, target, geoObject, labelSize, labelForceVisibleZoom) {
        setForceVisibleZoom(target, labelForceVisibleZoom);
        var coords = geoObject.geometry.getCoordinates()[target.polygonIndex];
        var autoZoom = getFirstZoomInside(map, target.autoCenter, coords, labelSize);

        _utilObjectKeys(target.zoomInfo).forEach(function (z) {
            if (!target.zoomInfo[z].center) {
                target.zoomInfo[z].visible = z >= autoZoom;
            } else {
                var zoom = getFirstZoomInside(map, target.zoomInfo[z].center, coords, labelSize);
                target.zoomInfo[z].visible = z >= zoom;
            }
        });
    }

    _provide(setZoomVisibility)

    function setForceVisibleZoom(target, labelForceVisibleZoom) {
        if (typeof labelForceVisibleZoom === 'boolean') {
            _utilObjectKeys(target.zoomInfo).forEach(function (z) {
                target.zoomInfo[z].visibleForce = labelForceVisibleZoom;
            });
        } else if (Object.prototype.toString.call(labelForceVisibleZoom) === '[object Object]') {
            var data = parseZoomData(labelForceVisibleZoom);
            _utilObjectKeys(data).forEach(function (z) {
                if (typeof data[z] !== 'undefined') {
                    target.zoomInfo[z].visibleForce = data[z];
                }
            });
        }
    }

    function getFirstZoomInside(map, center, coords, size) {
        var i = CONFIG.MIN_ZOOM,
            j = CONFIG.MAX_ZOOM;

        var zoom = void 0;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var elemPoints = getElemPoints(map, center, zoom, size);
            if (checkIsInside(map, coords, elemPoints, zoom)) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    }

    function getElemPoints(map, center, zoom, size) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = size.width,
            h = size.height;

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
//# sourceMappingURL=setZoomVisibility.js.map
