ymaps.modules.define('util.polylabel', [
    'getPolesOfInaccessibility',
    'util.nodeSize',
    'checkPointPosition'
], function (provide, getPolyLabelCenter, nodeSize, isInside) {
    var getObjectCollection;
    var htmlElems;
    var geoObjects;
    var map;
    var zoomAndCenterCollection = [];
    var MIN_ZOOM = 0;
    var MAX_ZOOM = 19;

    /**
     * @param {GeoObjectCollection} pGeoObjects - Массив геообъектов.
     * @param {Arrya<HTMLElement>} pHtmlElems - Массив html элементов к массиву геообъектов.
     * @param {Map} pMap - Карта.
     */
    function main(pGeoObjects, pHtmlElems, pMap) {
        getObjectCollection = new ymaps.GeoObjectCollection();
        htmlElems = pHtmlElems;
        map = pMap;
        geoObjects = pGeoObjects;
        initMapListener();
        calculate(true);
    }

    /**
     * @param {Boolean} isFirstCalc - Флаг, означающий, впервые ли происходит расчет.
     */
    function calculate(isFirstCalc) {
        var time = performance.now();
        var i = 0;
        geoObjects.each(function (geoObject) {
            var data;
            if (isFirstCalc) {
                data = getData(geoObject.geometry.getCoordinates(), htmlElems[i]);
                zoomAndCenterCollection.push({
                    firstZoomInside: data.firstZoomInside,
                    center: data.center
                });
            } else {
                data = zoomAndCenterCollection[i];
            }
            if (map.getZoom() > data.firstZoomInside) {
                getObjectCollection.add(createLabel(data.center, htmlElems[i].innerText));
            }
            i++;
        });
        map.geoObjects.add(getObjectCollection);
        console.error(performance.now() - time);
    }

    function createLabel(center, text) {
        var myGeoObject = new ymaps.GeoObject({
            geometry: {
                type: 'Point',
                coordinates: center
            },
            properties: {
                iconContent: text
            }
        }, {
            preset: 'islands#blackStretchyIcon'
        });
        return myGeoObject;
    }

    /**
    * Функция возвращает центр и первый zoom, на котором видна подпись
    * @param {Array} coords - Массив координат полигона.
    * @param {HTMLElement} elem - Элемент подписи, который необходимо поместить в полигон.
    * @returns {Object} data
    * @returns {boolean} data.isInside - Поместился ли объект.
    * @returns {Array[2]} data.center - Координаты точки, в которой можно отрисовывать элемент.
    */
    function getData(coords, elem) {
        var data = getPolyLabelCenter(coords, 1.0);
        return {
            center: data.center,
            firstZoomInside: analyzeData(data.center, coords[data.index], getElemSize(elem))
        };
    }

    function getElemSize(elem) {
        var container = document.createElement('div');
        container.style.display = 'inline-block';
        container.appendChild(elem);
        document.body.appendChild(container);
        var size = ymaps.util.dom.style.getSize(elem);
        document.body.removeChild(container);
        return {
            w: size[0],
            h: size[1]
        };
    }

    function initMapListener() {
        map.events.add('boundschange', function (event) {
            if (event.get('newZoom') !== event.get('oldZoom')) {
                map.geoObjects.remove(getObjectCollection);
                getObjectCollection.removeAll();
                calculate();
            }
        });
    }

    /**
     * Определяет первый zoom, вмещающий подпись
     * @param {Array} center - Координаты оптимального центра.
     * @param {Array} coords - Координаты полигона.
     * @param {Object} elemData - Данные об элементе подписи.
     */
    function analyzeData(center, coords, elemData) {
        var i = MIN_ZOOM;
        var j = MAX_ZOOM;
        var zoom;
        var result;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var elemPoints = calcElemPoints(center, zoom, elemData);
            result = checkIsInside(coords, elemPoints, zoom);
            if (result) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    }

    /**
     * Рассчитывает крайние точки элемента подписи.
     * @param {Array} center - Координаты оптимального центра.
     * @param {Number} zoom - Массштаб для рассчета.
     * @param {Object} elemData - Данные об элементе подписи.
     */
    function calcElemPoints(center, zoom, elemData) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = elemData.w;
        var h = elemData.h;
        var elemPoints = [];
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] + h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] + h / 2]);
        return elemPoints;
    }

    /**
     * Проверяет, вмещается ли подпись.
     * @param {Array} coords - Координаты полигона.
     * @param {Array} elemPoints - Крайние точки элемента подписи.
     * @param {Number} zoom - Массштаб для рассчета.
     */
    function checkIsInside(coords, elemPoints, zoom) {
        for (var i = 0; i < elemPoints.length; i++) {
            var point = map.options.get('projection').fromGlobalPixels(elemPoints[i], zoom);
            if (isInside(point, coords) !== 'INSIDE') {
                return false;
            }
        }
        return true;
    }

    provide(main);
});
