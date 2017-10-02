import getFirstZoomInside from 'getFirstZoomInside';

/**
 * Fill info about visibility label in center
 */
export default function setZoomVisibility(map, target, coords, labelSize, labelForceVisibleZoom) {
    const autoZoom = getFirstZoomInside(map, target.autoCenter, coords, labelSize);

    Object.keys(target.zoomInfo).forEach((z) => {
        if (!target.zoomInfo[z].center) {
            target.zoomInfo[z].visible = z >= autoZoom;
        } else {
            const zoom = getFirstZoomInside(map, target.zoomInfo[z].center, coords, labelSize);
            target.zoomInfo[z].visible = z >= zoom;
        }
    });
}
