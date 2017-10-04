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
        polygonIndex: 0,
        dotSize: {
            height: 0,
            width: 0
        }
    };
    while (i <= MAX_ZOOM) {
        result.zoomInfo[i] = {
            visible: 'none', // label | dot | none
            visibleForce: 'auto', // label | dot | none | auto
            center: undefined,
            style: {
                className: undefined,
                textSize: undefined,
                textColor: undefined
            },
            labelSize: {
                height: 0,
                width: 0
            }
        };
        i++;
    }
    return result;
}
