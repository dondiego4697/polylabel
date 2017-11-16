export default function(coords) {
    let result = [];
    let isPositivePart = true; // true = positive, false = negative
    for (let i = 0; i < coords.length; i++) {
        const p = coords[i];
        if (i === 0) {
            isPositivePart = p[1] >= 0 ? true : false;
        }

        result.push(isPositivePart ? transformPositive(p) : transformNegative(p));
    }
    return result;
}

function transformPositive(point) {
    return (point[1] < 0) ? [point[0], 360 + point[1]] : point;
}

function transformNegative(point) {
    return (point[1] >= 0) ? [point[0], -360 - point[1]] : point;
}
