import parseZoomData from 'parseZoomData';

export default function setForceVisibleZoom(target, labelForceVisibleZoom) {
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
