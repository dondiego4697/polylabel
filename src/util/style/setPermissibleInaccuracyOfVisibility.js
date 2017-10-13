import parseZoomData from 'src.util.zoom.parseZoomData';

export default function (target, visibilityData) {
    if (typeof visibilityData === 'number') {
        Object.keys(target.zoomInfo).forEach(z => {
            target.zoomInfo[z].permissibleInaccuracyOfVisibility = visibilityData;
        });
    } else if (visibilityData && typeof visibilityData === 'object') {
        const data = parseZoomData(visibilityData);
        Object.keys(data).forEach(z => {
            if (typeof data[z] !== 'undefined') {
                target.zoomInfo[z].permissibleInaccuracyOfVisibility = data[z];
            }
        });
    }
}
