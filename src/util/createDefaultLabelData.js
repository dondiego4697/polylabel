import CONFIG from 'config';
const {MIN_ZOOM, MAX_ZOOM} = CONFIG;

export default createDefaultLabelData;

function createDefaultLabelData() {
    let i = MIN_ZOOM;
    let result = {
        data: {},
        autoCenter: [0, 0],
        polygonIndex: 0
    };
    while (i <= MAX_ZOOM) {
        result.data[i] = {
            visible: false,
            visibleForce: false,
            center: null
        };
        i++;
    }
    return result;
}
