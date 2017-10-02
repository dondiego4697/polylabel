export default function (layout) {
    let el = layout.getElement();
    if (el.firstChild.nodeName !== "#text") {
        return el.firstChild.getBoundingClientRect();
    } else {
        return el.lastChild.getBoundingClientRect();
    }
}
