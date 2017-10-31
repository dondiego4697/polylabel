export default function (layout) {
    let el = layout && layout.getElement();
    if (!el) {
        return;
    }
    const {width, height} = el.children[0].getBoundingClientRect();
    return {width, height};
}
