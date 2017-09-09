import CONFIG from 'config';
const {MIN_ZOOM, MAX_ZOOM} = CONFIG;

export default function () {
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
            center: null,
            maxFitTextSize: null
        };
        i++;
    }
    return result;
}
