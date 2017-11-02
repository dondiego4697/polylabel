import labelLayoutTemplate from 'src.label.util.layoutTemplates.labelLayoutTemplate';
import dotLayoutTemplate from 'src.label.util.layoutTemplates.dotLayoutTemplate';

/**
 * Возвращает базовые обертки над шаблонами
 */
export default function () {
    return {
        label: labelLayoutTemplate,
        dot: dotLayoutTemplate
    }
}
