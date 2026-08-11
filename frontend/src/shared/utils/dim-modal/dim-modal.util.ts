import { modals } from '@mantine/modals'

type TModalSettings = Parameters<typeof modals.open>[0]

const MODAL_FLAG = 'kimikoModal'

/**
 * Открывает модалку и помечает страницу, пока она видна.
 *
 * Затемнение нарисовано не отдельным слоем поверх, а фильтром на самой
 * странице (см. global.css). Иначе оно обрывалось по кромке вьюпорта: документ
 * в iOS 26 рисуется во весь экран, а fixed-элементы считаются от visual
 * viewport, и под барами оставался незатемнённый контент. Фильтр на #root
 * такого шва не оставляет — затемняется ровно то, что уже нарисовано.
 */
export function openDimmedModal(settings: TModalSettings) {
    document.body.dataset[MODAL_FLAG] = 'open'

    return modals.open({
        ...settings,
        onClose: () => {
            delete document.body.dataset[MODAL_FLAG]
            settings.onClose?.()
        }
    })
}
