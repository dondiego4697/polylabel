ymaps.modules.define("util.calculateArea",[],function(e){function t(e){if("Feature"==e.type)return e.geometry;if(e.geometry&&e.geometry.getType)return"Circle"==e.geometry.getType()?{type:"Circle",coordinates:e.geometry.getCoordinates(),radius:e.geometry.getRadius()}:{type:e.geometry.getType(),coordinates:e.geometry.getCoordinates()};throw new Error("util.calculateArea: Unknown input object.")}function r(e){var t,r=0;switch(e.type){case"Polygon":return o(e.coordinates);case"MultiPolygon":for(t=0;t<e.coordinates.length;t++)r+=o(e.coordinates[t]);return r;case"Rectangle":return o([[e.coordinates[0],[e.coordinates[0][0],e.coordinates[1][1]],e.coordinates[1],[e.coordinates[1][0],e.coordinates[0][1]],e.coordinates[0]]]);case"Circle":return Math.PI*Math.pow(e.radius,2);case"Point":case"MultiPoint":case"LineString":case"MultiLineString":return 0}}function o(e){var t=0;if(e&&e.length>0){t+=Math.abs(n(e[0]));for(var r=1;r<e.length;r++)t-=Math.abs(n(e[r]))}return t}function n(e){var t,r,o,n,c,s,u=0,g=e.length,l="latlong"==ymaps.meta.coordinatesOrder?1:0,d="latlong"==ymaps.meta.coordinatesOrder?0:1;if(g>2){for(s=0;s<g;s++)s===g-2?(o=g-2,n=g-1,c=0):s===g-1?(o=g-1,n=0,c=1):(o=s,n=s+1,c=s+2),t=e[o],r=e[n],u+=(a(e[c][l])-a(t[l]))*Math.sin(a(r[d]));u=u*i*i/2}return u}function a(e){return e*Math.PI/180}var i=6378137;e(function(e){return r(t(e))})});

ymaps.modules.define('checkPointPosition', [], function (provide) {

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
        return (parity ? 'INSIDE' : 'OUTSIDE');
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
        if ((a[0] * b[0] < 0) || (a[1] * b[1] < 0)) {
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
     * Определяет как луч из точки взаимодействет с ребром (Пересекает, Касается, нейтральна)
     * @param {Arrya[2]} point - Исследуемая точка.
     * @param {Array} edge - Ребро.
     */
    function edgeType(point, edge) {
        var v = edge[0];
        var w = edge[1];
        switch (pointClassify(point, v, w)) {
            case 'LEFT': {
                return ((v[1] < point[1]) && (point[1] <= w[1])) ? 'CROSSING' : 'INESSENTIAL';
            }
            case 'RIGHT': {
                return ((w[1] < point[1]) && (point[1] <= v[1])) ? 'CROSSING' : 'INESSENTIAL';
            }
            case 'BETWEEN':
            case 'ORIGIN':
            case 'DESTINATION':
                return 'TOUCHING';
            default: {
                return 'INESSENTIAL';
            }
        }
    }
    provide(isInside);
});

ymaps.modules.define('util.polylabel', [
    'getPolyLabelCenter',
    'util.nodeSize',
    'checkPointPosition'
], function (provide, getPolyLabelCenter, nodeSize, isInside) {

    /**
    * @param {Array} coords - Массив координат полигона.
    * @param {HTMLElement} elem - Элемент, который необходимо поместить в полигон.
    * @param {number} zoom - Уровень масштаба для расчета.
    * @returns {Object} data
    * @returns {boolean} data.isInside - Поместился ли объект.
    * @returns {Array[2]} data.center - Координаты точки, в которой можно отрисовывать элемент.
    */
    function getData(coords, elem, zoom) {
        if (!coords instanceof Array) {
            throw new Error('Wrong params');
        }
        var data = getPolyLabelCenter(coords, 1.0);
        return {
            center: data.center,
            isInside: checkData(data.center, coords[data.index], zoom, getElemSize(elem))
        };
    }

    function getElemSize(elem) {
        var container = document.createElement('div');
        container.style.display = 'inline-block';
        container.appendChild(elem);
        document.body.appendChild(container);
        var w = elem.clientWidth;
        var h = elem.clientHeight;
        document.body.removeChild(container);
        return {
            w: w,
            h: h
        }
    }

    function checkData(center, coords, zoom, elemData) {
        var centerProj = ymaps.projection.sphericalMercator.toGlobalPixels(center, zoom);
        var w = elemData.w;
        var h = elemData.h;
        var elemPoints = [];
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] + h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] + h / 2]);

        for (var i = 0; i < elemPoints.length; i++) {
            var point = ymaps.projection.sphericalMercator.fromGlobalPixels(elemPoints[i], zoom);
            if (isInside(point, coords) !== 'INSIDE') {
                return false;
            }
        }
        return true;
    }


    provide(getData);
});

ymaps.modules.define('getPolyLabelCenter', [
    'util.calculateArea'
], function (provide, calculateArea) {
    function TinyQueue(data, compare) {
        if (!(this instanceof TinyQueue)) return new TinyQueue(data, compare);

        this.data = data || [];
        this.length = this.data.length;
        this.compare = compare || defaultCompare;

        if (this.length > 0) {
            for (var i = (this.length >> 1); i >= 0; i--) this._down(i);
        }
    }

    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    TinyQueue.prototype = {

        push: function (item) {
            this.data.push(item);
            this.length++;
            this._up(this.length - 1);
        },

        pop: function () {
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

        peek: function () {
            return this.data[0];
        },

        _up: function (pos) {
            var data = this.data;
            var compare = this.compare;
            var item = data[pos];

            while (pos > 0) {
                var parent = (pos - 1) >> 1;
                var current = data[parent];
                if (compare(item, current) >= 0) break;
                data[pos] = current;
                pos = parent;
            }

            data[pos] = item;
        },

        _down: function (pos) {
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

    function polylabel(polygon, precision, debug) {
        precision = precision || 1.0;

        // find the bounding box of the outer ring
        var minX, minY, maxX, maxY;

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
                if (debug) console.log('found best %d after %d probes', Math.round(1e4 * cell.d) / 1e4, numProbes);
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
            console.log('num probes: ' + numProbes);
            console.log('best distance: ' + bestCell.d);
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

                if ((a[1] > y !== b[1] > y) &&
                    (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) inside = !inside;

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
        var data;
        if (polygonCoords.length > 1) {
            for (var i = 0; i < polygonCoords.length; i++) {
                var polygon = new ymaps.GeoObject({
                    geometry: {
                        type: "Polygon", coordinates: [polygonCoords[i]]
                    }
                })
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
            center: polylabel(data, precision, debug),
            index: indexOfMaxArea
        }
    }
    provide(getPolylabelCenter);
});
