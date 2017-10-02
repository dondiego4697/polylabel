export default function (label) {
    return new Promise((resolve, reject) => {
        label.getOverlay()
            .then(overlay => overlay.getLayout())
            .then(layout => {
                resolve(layout);
            }).catch(e => {
                reject(e);
            });
    });
}
