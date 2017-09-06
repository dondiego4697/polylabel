import CONFIG from 'config';
const {MIN_ZOOM, MAX_ZOOM} = CONFIG;

export default parseZoomData;

let isOnlyVisible = false;
let onlyVisibleZooms = [];

function parseZoomData(zoomData, pIsOnlyVisible) {
    isOnlyVisible = pIsOnlyVisible;
    onlyVisibleZooms = [];

    let zoom = createDefZoomObj();
    if (typeof zoomData === 'number') {
        parseNumber(zoom, zoomData);
        checkOnOnlyVisible(zoomData);
    } else if (Array.isArray(zoomData)) {
        parseArray(zoom, zoomData);
    } else if (typeof zoomData === 'string' && zoomData !== 'default') {
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
    zoom.forEach(z => {
        if (typeof z === 'number') {
            parseNumber(target, z);
            checkOnOnlyVisible(z);
        } else if (typeof z === 'string') {
            parseString(target, z);
        }
    });
}

function parseString(target, zoom) {
    if (!isNaN(Number(zoom))) {
        target[Number(zoom)] = true;
        checkOnOnlyVisible(Number(zoom));
        return;
    }
    const zoomRange = zoom.split('_').map(Number);
    if (isNaN(zoomRange[0]) || isNaN(zoomRange[1])) {
        return 'err';
    }
    let bottom = zoomRange[0] < MIN_ZOOM ? MIN_ZOOM : zoomRange[0];
    const top = zoomRange[1] > MAX_ZOOM ? MAX_ZOOM : zoomRange[1];
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
    let i = MIN_ZOOM;
    let result = {};
    while (i <= MAX_ZOOM) {
        result[i] = false;
        i++;
    }
    return result;
}
