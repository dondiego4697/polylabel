
Для каждого полигона, модуль создает две сущности (подпись и точка).
Если подпись не вмещается, то будет проверятся на вместимость точка.

Запуск
============
Предоставляется возможность работать с двумя сущностями API:
* [GeoObjectCollection](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObjectCollection-docpage/)
* [ObjectManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/)

Скачиваем файл **util.createPolylabel.min.js**, который находится в release

Далее запускаем модуль:
```js
ymaps.ready(['util.createPolylabel']).then(function () {
    /**
    * @param {Map} map - экземпляр карты
    * @param {GeoObjectCollection | ObjectManager} component -
    * экземпляр коллекции или менеджера объектов, в котором находятся полигоны для подписи
    */
    const polyLabeler = new ymaps.util.createPolylabel(map, component);
});
```






Документация
============
## Методы
Имя                                      | Возвращает                   |Описание                     |
---------------------------------------- | -----------------------------|-----------------------------|
| getLabelState(polygon)                 | DataManager                  | state подписи               |

### getLabelState
```js
    const polyLabeler = new ymaps.util.createPolylabel(map, objectManager);
    let state = polyLabeler.getLabelState(polygon);
```
#### Параметры:
polygon - объект, описывающий полигон  
**Тип:**  
**GeoObject**, если был использован GeoObjectCollection  
**JSON**, если был использовани ObjectManager

## Состояния

Имя                                      | Значение                                                |
---------------------------------------- | --------------------------------------------------------|
| visible                                | 'dot' \| 'label' \| 'none' \| undefined                 |

### visible
Можно менять состояние видимости подписи для текущего зума.  
**dot** - отобразить точку  
**label** - отобразить подпись  
**none** - ничего не отображать  
**undefined** - состояние не учитывается (автоматический рассчет)  
При смене зума состояние примет свое первоначальное значение **undefined**  

```js
    const polyLabeler = new ymaps.util.createPolylabel(map, objectManager);
    let state = polyLabeler.getLabelState(polygon);
    state.set('visible', 'dot');
```

## События
Все события с подписей могут прослушиваться через полигон.  
Список событий можно посмотреть у 
[геобъекта](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject-docpage/#events-summary)  
Чтобы повесить слушатель, нужно в 
[EventManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/event.Manager-docpage/) Геоколлекции или ObjectManager-а добавить слушатель нужного события с префиксом "label"  

```js
    // В данном примере мы прослушиваем наведедение курсора на подпись и выход курсора за пределы подписи
    // По полигону, на подписи которого было отработано событие, получаем состояние подписи
    // Меняем состояние видимости подписи в зависимости от типа события
    geoObjectCollection.events.add(['labelmouseenter', 'labelmouseleave'], event => {
        var polygon = event.get('target');
        var state = polyLabeler.getLabelState(polygon);
        state.set('visible', event.get('type') === 'labelmouseleave' ? undefined : 'label');
    });
```


## Опции полигона
### Управление подписью происходит через опции полигона.  
***\* - обязательная опция***</br>

Имя                                      | Тип                                                     |По умолчанию            |
---------------------------------------- | --------------------------------------------------------|------------------------|
| labelLayout *                          | string                                                  |     -                  |
| labelDotLayout                         | string                                                  |   стандартная точка    |
| labelDotVisible                        | boolean                                                 |   true                 |
| labelDefaults                          | string                                                  |     -                  |
| labelCursor                            | string                                                  |   'grab'               |
| labelDotCursor                         | string                                                  |   'grab'               |
| labelClassName                         | ZoomRange < string > \|\| string                        |     -                  |
| labelForceVisible                      | ZoomRange < string > \|\| string                        |     -                  |
| labelTextColor                         | ZoomRange < string > \|\| string                        |     -                  |
| labelTextSize                          | ZoomRange < number > \|\| number                        |     -                  |
| labelCenterCoords                      | ZoomRange < Array[2]< number >> \|\| Array[2]< number > |     -                  |
| labelOffset                            | ZoomRange < Array[2]< number >> \|\| Array[2]< number > |  \[0, 0\]              |
| labelPermissibleInaccuracyOfVisibility | ZoomRange < number > \|\| number                        |     0                  |

Тип **ZoomRange< T >**  - это объект, в котором ключами являются зум или диапазон зумов, то есть значения указываются для определенных масштабов. **T** - это тип значений.</br>
```js
    // объект настроен так, что на первом зуме будет принято значение 12,
    // со 2-го по 5-ый будет значение 14, с 6-го по 22-ой будет 16 и на 23-ем будет 18
	someOptions: {
		1: 12,
		'2_5': 14,
		'6_22': 16,
		23: 18
	}
	// либо можно указать значение на все зумы сразу
	someOptions: 12
	// если пропускать зумы, у них будет автоматический рассчет или они будут просто игнорироваться
	someOptions: {
	    1: 12,
	    '2_3': 13
	}
```

### labelLayout
Это шаблон, описывающий представление вашей подписи.
[Основан на Template](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Template-docpage/)  
```js
	polygon.options.set({
		labelLayout: '<div class="foo">bar</div>'
	});
```

### labelDotLayout
Это шаблон, описывающий представление точки (мини-подписи).

**Поведение по умолчанию:**
- Если не вмещается основная подпись, а точка помещается, то она рисуется, если же и точка не помещается, то полигон не подписывается
- Если не указать эту опцию, то отрисуется дефолтная точка

```js
	polygon.options.set({
            labelDotLayout: `<div style="background: red;
                width: 10px; height: 10px; border-radius: 5px;"></div>`
	});
```

### labelDotVisible
Отвечает за показ точек.
- ***true*** - показывать
- ***false*** - не показывать

**Поведение по умолчанию:**
    Подписи в виде точки отображаются.

### labelDefaults
Отвечает за дефолтное представление подписи.

***Может принимать два значения:***
- ***dark*** - для темных подписей
- ***light*** - для светлых подписей

### labelCursor
Вид курсора при наведении на основную подпись.
[Возможные значения](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/util.cursor.Manager-docpage/#push-param-key)

### labelDotCursor
Вид курсора при наведении на точку.
[Возможные значения](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/util.cursor.Manager-docpage/#push-param-key)

### labelClassName
Название css-класса, применяемого к подписи.

```js
    // применим к подписи на первом зуме класс "foo-class",
    // а к остальным 'bar-class'

	polygon.options.set({
            labelClassName: {
                1: 'foo-class',
                '2_23': 'bar-class'
            }
	});
```

### labelForceVisible
Название типа подписи, которая будет отображаться.
- ***label*** - отображать основную подпись
- ***dot*** - отображать точку
- ***none*** - ничего не отображать

```js
    // на первых двух зумах, будет всегда отображаться основная подпись
    // на остальных точка

	polygon.options.set({
            labelForceVisible: {
                '0_1': 'label',
                '2_23': 'dot'
            }
	});
```

**Поведение по умолчанию:**
    Автоматический расчет.

### labelTextColor
Цвет подписи.

```js
    // на всех зумах, подпись будет цвета #FCEA00
	polygon.options.set({
            labelForceVisible: '#FCEA00'
	});
```

### labelTextSize
Размер подписи.

```js
    // на первых пяти зумах, подпись будет размером 22
    // на всех остальных 11
	polygon.options.set({
            labelTextSize: {
                '0_4': 22,
                '5_23': 11
            }
	});
```

### labelCenterCoords
Географические координаты, в которых будет отображаться подпись.

```js
    // на первом зуме координаты подписи = [37.0192, 61.01210]
    // на 2-ом и 3-ем = [38.123, 62.9182]
    // на всех остальных автоматический рассчет
	polygon.options.set({
            labelCenterCoords: {
                0: [37.0192, 61.01210],
                '2_3': [38.123, 62.9182]
            }
	});
```

**Поведение по умолчанию:**
    Автоматический расчет.

### labelOffset
Отступ в пикселях от позиции подписи.
- 0-вой элемент - отступ слева.
- 1-ый элемент - отступ сверху.

```js
    // на всех зумах, подписи смещены влево на 10px и вниз на 20px
	polygon.options.set({
            labelCenterCoords: [-10, 20]
	});
```

**Поведение по умолчанию:**
    labelOffset: \[0, 0]

### labelPermissibleInaccuracyOfVisibility
Погрешность в пикселях, насколько сильно могут вылазить подписи из полигона.

```js
    // на всех зумах, подписи могут вылазить за границу полигона на 2px.
	polygon.options.set({
            labelPermissibleInaccuracyOfVisibility: 2
	});
```

**Поведение по умолчанию:**
    labelOffset: 0