import transformHexToRGB from 'src.util.transformHexToRGB';

export default function (data, dateString, filterValue) {
    return transformHexToRGB(dateString, 0.9);
}