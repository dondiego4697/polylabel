export default function (layout) {
    let el = layout.getElement();
    const { width, height } = el.children[0].getBoundingClientRect();
    return { width, height };
}
