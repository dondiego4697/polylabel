const methods = {
    polygon: polygon,
    point: point
};

function point(coords) {
    return polygon([coords, coords])[1];
}

function polygon(coords) {
    let result = [];
    let isPositivePart = true; // true = positive, false = negative
    for (let i = 0; i < coords.length; i++) {
        const p = coords[i];
        if (i === 0) {
            isPositivePart = p[1] >= 0 ? true : false;
        }

        const arr = [
            {
                key: '180',
                distance: 180 - p[1]
            },
            {
                key: '-180',
                distance: Math.abs(-180 - p[1])
            },
            {
                key: '0',
                distance: Math.abs(p[1])
            }
        ];
        const key = arr.sort(comparator)[0].key;
        result.push(isPositivePart ? transformPositive(key, p) : transformNegative(key, p));
    }
    return result;
}

function transformPositive(key, point) {
    return (key === '-180') ? [point[0], 360 + point[1]] : point;
}

function transformNegative(key, point) {
    return (key === '180') ? [point[0], -360 + point[1]] : point;
}

function comparator(a, b) {
    return a.distance - b.distance;
}

export default methods;
