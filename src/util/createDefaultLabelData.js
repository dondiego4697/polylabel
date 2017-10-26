import CONFIG from 'src.config';
const {
    MIN_ZOOM,
    MAX_ZOOM
} = CONFIG;

export default function () {
    let result = {
        zoomInfo: {}, // Объект с информацией для каждого зума
        autoCenter: [0, 0],
        polygonIndex: 0,
        dotSize: {
            height: 0,
            width: 0
        }
    };
    for (let i = MIN_ZOOM; i <= MAX_ZOOM; i++) {
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
            },
            labelOffset: [0, 0],
            permissibleInaccuracyOfVisibility: 0
        };
    }
    return result;
}
