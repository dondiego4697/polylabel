export default function (label) {
    return label.getOverlay()
        .then(overlay => overlay.getLayout());
}
