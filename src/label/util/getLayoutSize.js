export default function (layout) {
    let el = layout && layout.getElement();
    if (!el) {
        return;
    }
    let width = 0;
    let height = 0;

    while (width === 0 && height === 0) {
        el = el.children[0];        
        const rect = el.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
    }
    return {width, height};
}
