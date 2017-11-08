import getFirstZoomInside from 'src.util.zoom.getFirstZoomInside';
import getLayoutSize from 'src.label.util.getLayoutSize';

const functions = {
    label: analyseLabel,
    dot: analyseDot
};

export default function (map, zoom, labelInst, labelType) {
    const labelData = labelInst.getLabelData();
    let coordinates = labelData.getPolygonCoords();

    return functions[labelType](map, zoom, labelInst, labelData, coordinates, labelInst.getLayout(labelType));
}

function getVisible(currentType, newType, newIsVisible) {
    let types = ['none', 'dot', 'label'];
    let result = currentType;
    if (newIsVisible) {
        result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
    }
    return result;
}

function analyseDot(map, zoom, labelInst, labelDataInst, coordinates, layout) {    
    const size = getLayoutSize(layout);
    if (!size) return false;

    const labelData = labelDataInst.getAll();
    const zoomInfo = labelDataInst.getZoomInfo(zoom);
        
    labelDataInst.setData('dotSize', size);

    const firstZoomInside = getFirstZoomInside(
        map,
        zoomInfo.center || labelData.autoCenter,
        coordinates,
        size,
        zoomInfo.labelOffset,
        zoomInfo.permissibleInaccuracyOfVisibility
    );
    labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'dot', zoom >= firstZoomInside));
    return true;
}

function analyseLabel(map, zoom, labelInst, labelDataInst, coordinates, layout) {
    let size = getLayoutSize(layout);
    if (!size) return false;

    const labelData = labelDataInst.getAll();
    const zoomInfo = labelData.zoomInfo[zoom];
    labelDataInst.setZoomInfo(zoom, 'labelSize', size);
    const firstZoom = getFirstZoomInside(
        map,
        zoomInfo.center || labelData.autoCenter,
        coordinates,
        size,
        zoomInfo.labelOffset,
        zoomInfo.permissibleInaccuracyOfVisibility
    );
    labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'label', zoom >= firstZoom));
    return true;
}
