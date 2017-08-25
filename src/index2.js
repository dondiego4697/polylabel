ymaps.modules.define('util.polylabel2', [
    'getPolesOfInaccessibility',
], function (provide, getPolyLabelCenter) {

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
        var elemSize = getElemSize(elem);
        var w = elemSize.w;
        var h = elemSize.h;
        var elemPoints = [];
        var centerProj = ymaps.projection.sphericalMercator.toGlobalPixels(data.center, zoom);
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] + h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] - h / 2]);
        elemPoints.push([centerProj[0] + w / 2, centerProj[1] + h / 2]);
        elemPoints = elemPoints.map(function (p) {
            return ymaps.projection.sphericalMercator.fromGlobalPixels(p, zoom);
        });
        return {
            center: data.center,
            size: elemSize,
            elemPoints: elemPoints
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

    provide(getData);
});
