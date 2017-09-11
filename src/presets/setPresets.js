const DATA = {
    Big: createFontSize('20px'),
    Small: createFontSize('12px'),
    BlackInWhiteOutline: createColorPreset('black', 'white'),
    HhiteInBlackOutline: createColorPreset('white', 'black')
};
const PREFIX = 'polylabel#';

export default function (parent) {
    const presetStorage = ymaps.option.presetStorage;

    parent.options.set('preset', 'polylabel#default');
    presetStorage.add('polylabel#default', Object.assign({}, createFontSize('16px'), createColorPreset('black')));

    createPresets(presetStorage);
}

function createPresets(presetStorage) {
    const sizes = ['Big', 'Small'];
    const colors = ['BlackInWhiteOutline', 'WhiteInBlackOutline'];

    sizes.forEach(size => {
        presetStorage.add(`${PREFIX}${size}`, Object.assign({}, DATA[size]));
    });

    colors.forEach(color => {
        presetStorage.add(`${PREFIX}${color}`, Object.assign({}, DATA[color]));
    });

    sizes.forEach(size => {
        colors.forEach(color => {
            presetStorage.add(`${PREFIX}${size}${color}`, Object.assign({}, DATA[size], DATA[color]));
        });
    });
}

function createFontSize(labelTextSize) {
    return {
        labelTextSize
    };
}

function createColorPreset(textColor, outlineColor) {
    return {
        textColor,
        outlineColor
    };
}
