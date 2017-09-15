import CONFIG from 'config';
const {MIN_ZOOM, MAX_ZOOM} = CONFIG;

/**
 * Parse data about zoom.
 * @param {Object} zoomData
 * Supported object properties view: number, string
 * @return {Object} - Returned object with zoom, where the parsed values.
 * @example
 * zoomData = {1: 'value1', '3_5': 'value2'}
 * return {1: 'value1', 2: undefined ... 3: 'value2', 4: 'value2', 5: 'value2', 6: undefined ...}
*/
export default function parseZoomData(zoomData) {
    return Object.keys(zoomData).reduce((result, key) => {
        if (typeof key === 'string') {
            parseString(result, key, zoomData[key]);
        } else if (typeof key === 'number') {
            parseNumber(result, key, zoomData[key]);
        }
        return result;
    }, createDefZoomObj());
}

function parseNumber(target, zoom, value) {
    target[zoom] = value;
}

function parseString(target, zoom, value) {
    if (!isNaN(Number(zoom))) {
        target[Number(zoom)] = value;
        return;
    }
    const zoomRange = zoom.split('_').map(Number);
    if (isNaN(zoomRange[0]) || isNaN(zoomRange[1])) {
        return;
    }
    let bottom = zoomRange[0] < MIN_ZOOM ? MIN_ZOOM : zoomRange[0];
    const top = zoomRange[1] > MAX_ZOOM ? MAX_ZOOM : zoomRange[1];
    while (bottom <= top) {
        target[bottom] = value;
        bottom++;
    }
}

function createDefZoomObj() {
    let i = MIN_ZOOM;
    let result = {};
    while (i <= MAX_ZOOM) {
        result[i] = undefined;
        i++;
    }
    return result;
}
