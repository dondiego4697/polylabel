import isInside from 'checkPointPosition';
import CONFIG from 'config';
import parseZoomData from 'parseZoomData';

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
export default function setZoomVisibility(map, target, geoObject, labelSize, labelForceVisibleZoom) {
    setForceVisibleZoom(target, labelForceVisibleZoom);
    const coords = geoObject.geometry.getCoordinates()[target.polygonIndex];
    const autoZoom = getFirstZoomInside(map, target.autoCenter, coords, labelSize);

    Object.keys(target.zoomInfo).forEach((z) => {
        if (!target.zoomInfo[z].center) {
            target.zoomInfo[z].visible = z >= autoZoom;
        } else {
            const zoom = getFirstZoomInside(map, target.zoomInfo[z].center, coords, labelSize);
            target.zoomInfo[z].visible = z >= zoom;
        }
    });
}

function setForceVisibleZoom(target, labelForceVisibleZoom) {
    if (typeof labelForceVisibleZoom === 'boolean') {
        Object.keys(target.zoomInfo).forEach((z) => {
            target.zoomInfo[z].visibleForce = labelForceVisibleZoom;
        });
    } else if (Object.prototype.toString.call(labelForceVisibleZoom) === '[object Object]') {
        const data = parseZoomData(labelForceVisibleZoom);
        Object.keys(data).forEach(z => {
            if (typeof data[z] !== 'undefined') {
                target.zoomInfo[z].visibleForce = data[z];
            }
        });
    }
}

function getFirstZoomInside(map, center, coords, size) {
    let {MIN_ZOOM: i, MAX_ZOOM: j} = CONFIG;
    let zoom;
    while (i < j) {
        zoom = Math.floor((i + j) / 2);
        let elemPoints = getElemPoints(map, center, zoom, size);
        if (checkIsInside(map, coords, elemPoints, zoom)) {
            j = zoom;
        } else {
            i = zoom + 1;
        }
    }
    return i;
}

function getElemPoints(map, center, zoom, size) {
    const centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
    const {width: w, height: h} = size;
    let elemPoints = [];
    elemPoints.push(
        [centerProj[0] - w / 2, centerProj[1] - h / 2],
        [centerProj[0] - w / 2, centerProj[1] + h / 2],
        [centerProj[0] + w / 2, centerProj[1] - h / 2],
        [centerProj[0] + w / 2, centerProj[1] + h / 2]);
    return elemPoints;
}

function checkIsInside(map, coords, elemPoints, zoom) {
    for (let i = 0; i < elemPoints.length; i++) {
        let point = map.options.get('projection').fromGlobalPixels(elemPoints[i], zoom);
        if (isInside(point, coords) !== 'INSIDE') {
            return false;
        }
    }
    return true;
}
