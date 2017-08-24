ymaps.modules.define('util.polylabel', [
    'getPolyLabelCenter',
    'util.nodeSize',
    'checkPointPosition'
], function (provide, getPolyLabelCenter, nodeSize, isInside) {
    /**
    * @param {Array} coords - Массив координат полигона.
    * @returns {Object}
    */
    var container = createContainer();
    var elemData = appendElem();
    hideContainer();

    function getData(coords, zoom) {
        if (!coords instanceof Array) {
            throw new Error('Wrong params');
        }
        var data = getPolyLabelCenter(coords, 1.0);
        isInclude(data.center, coords[data.index], zoom);

        return {
            center: data.center,
            isInclude: isInclude(data.center, coords[data.index], zoom)
        };
    }

    function createContainer() {
        var container = document.createElement('div');
        container.style.display = 'inline-block';
        document.body.appendChild(container);
        return container;
    }

    function hideContainer() {
        container.style.display = 'none';
    }

    function appendElem() {
        var text = document.createElement('h6');
        text.innerText = 'asdasddsasdasdasdasdas';
        container.appendChild(text);
        return {
            w: text.clientWidth,
            h: text.clientHeight
        }
    }

    function isInclude(center, coords, zoom) {
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
