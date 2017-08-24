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
