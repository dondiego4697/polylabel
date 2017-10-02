import isInside from 'checkPointPosition';
import CONFIG from 'config';

export default function (map, center, coords, size) {
    let { MIN_ZOOM: i, MAX_ZOOM: j } = CONFIG;
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
    const { width: w, height: h } = size;
    let elemPoints = [];
    elemPoints.push(
        [centerProj[0] - w / 2, centerProj[1] - h / 2], [centerProj[0] - w / 2, centerProj[1] + h / 2], [centerProj[0] + w / 2, centerProj[1] - h / 2], [centerProj[0] + w / 2, centerProj[1] + h / 2]);
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
