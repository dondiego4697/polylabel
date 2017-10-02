import CONFIG from 'config';
const {
    MIN_ZOOM,
    MAX_ZOOM
} = CONFIG;

export default function () {
    let i = MIN_ZOOM;
    let result = {
        zoomInfo: {}, // Object with info for every zoom
        autoCenter: [0, 0],
        polygonIndex: 0
    };
    while (i <= MAX_ZOOM) {
        result.zoomInfo[i] = {
            visible: false,
            visibleForce: undefined,
            center: undefined,
            style: {
                className: undefined,
                textSize: undefined,
                textColor: undefined,
                size: {
                    width: undefined,
                    height: undefined
                }
            }
        };
        i++;
    }
    return result;
}
