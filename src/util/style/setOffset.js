import parseZoomData from 'src.util.zoom.parseZoomData';

export default function setOffset(target, labelOffset) {
    if (Array.isArray(labelOffset)) {
        Object.keys(target.zoomInfo).forEach(z => {
            target.zoomInfo[z].labelOffset = labelOffset;
        });
    } else if (labelOffset && typeof labelOffset === 'object') {
        const data = parseZoomData(labelOffset);
        Object.keys(data).forEach(z => {
            if (typeof data[z] !== 'undefined') {
                target.zoomInfo[z].labelOffset = data[z];
            }
        });
    }
}
