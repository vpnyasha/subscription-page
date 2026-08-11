import { Modal, ModalOverlay } from '@mantine/core'

import { kimikoColors } from '../palette'

/**
 * Оверлей модалки — fixed-элемент во весь экран, то есть он попадает и в полосу,
 * по которой Safari 26 красит бары: с чёрным по умолчанию они уходили в серый,
 * будто страница сломалась. Затемнение переведено на тёмно-коричневый из
 * палитры и разбавлено размытием — бары тинтятся в тон странице.
 */
export default {
    Modal: Modal.extend({
        defaultProps: {
            radius: 'lg'
        }
    }),
    /*
     * Оверлей прозрачный: затемнение рисует фильтр на самой странице
     * (см. body[data-kimiko-modal] в global.css). Слой поверх обрывался по
     * кромке вьюпорта, и под барами оставался незатемнённый контент. Убирать
     * оверлей совсем нельзя — по нему закрывают модалку кликом мимо.
     */
    ModalOverlay: ModalOverlay.extend({
        defaultProps: {
            color: kimikoColors.text,
            backgroundOpacity: 0,
            blur: 0
        }
    })
}
