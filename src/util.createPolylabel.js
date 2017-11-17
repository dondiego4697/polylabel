import PCollection from 'src.polylabel.PolylabelCollection';
import PObjectManager from 'src.polylabel.PolylabelObjectManager';
import ObjectManager from 'ObjectManager';

export default function (map, data) {
    initStyles();
    return data instanceof ObjectManager ?
        new PObjectManager(map, data) :
        new PCollection(map, data);
}

function initStyles() {
    const style = document.createElement('style');
    style.innerText = `
        .ymaps-polylabel-dot-default {
            border: 1px solid rgba(255, 255, 255, 0.8);
            height: 4px;
            width: 4px;
            border-radius: 3px;
        }
        .ymaps-polylabel-dot-default_hover {
            border: 1px solid rgba(255, 255, 255, 1);
        }
    `;
    document.head.appendChild(style);
}
