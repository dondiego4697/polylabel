import transformHexToRGB from 'src.util.transformHexToRGB';
import CONFIG from 'src.config';

export default function (data, dateString, filterValue) {
    return transformHexToRGB(dateString || CONFIG.DEFAULT_POLYGON_FILL_COLOR, 0.9);
}