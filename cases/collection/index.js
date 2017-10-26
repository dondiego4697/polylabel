function Controls(map, collection) {
    this.map = map;
    this.collection = collection;
}

Controls.prototype.start = function () {
    this.polyLabeler = new ymaps.util.createPolylabel(this.map, this.collection);
    this.initControls();
    this.initActions();
}

Controls.prototype.initActions = function () {
    this.collection.events.add('click', (event) => {
        let state = this.polyLabeler.getLabelState(event.get('target'));
        state.set('visible', this.polyLabeler.getCurrentVisibility(event.get('target')) === 'dot'
            ? 'label' : 'dot');
    });
}

Controls.prototype.initControls = function () {
    this.btnRefresh = document.getElementById('btnRefresh');
    this.etInaccuracyOfVisibility = document.getElementById('etInaccuracyOfVisibility');
    this.etTextSize = document.getElementById('etTextSize');
    this.etTextColor = document.getElementById('etTextColor');
    this.rbImage = document.getElementById('rbImage');
    this.rbHideDotLabel = document.getElementById('rbHideDotLabel');
    this.rbRussiaPolygon = document.getElementById('rbRussiaPolygon');

    this.btnRefresh.addEventListener('click', () => {
        const inaccuracy = this.etInaccuracyOfVisibility.value;
        const textSize = this.etTextSize.value;
        const textColor = this.etTextColor.value;

        let options = {};
        options.labelPermissibleInaccuracyOfVisibility = this.parseData(inaccuracy);
        options.labelTextSize = this.parseData(textSize);
        options.labelTextColor = this.parseData(textColor);
        options.labelLayout = this.rbImage.checked ?
            '<img src="/for-dev/morty.jpg" width=50px height=50px style="border-radius: 3px;">' :
            '<div>{{properties.hintContent}}</div>';
        options.labelDotVisible = this.rbHideDotLabel.checked ? false : true;

        if (this.rbRussiaPolygon.checked) {
            this.collection.get(0).options.set(options);
        } else {
            this.collection.each(function (geoObject) {
                geoObject.options.set(options);
            });
        }
    });
}

Controls.prototype.parseData = function (data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        return data || 0;
    }
}
