import { Notification } from '@mantine/core'

export default {
    Notification: Notification.extend({
        defaultProps: {
            radius: 'md'
        },

        /*
         * Фон обязательно непрозрачный: уведомление всплывает поверх карточек,
         * и сквозь полупрозрачную подложку читался текст страницы — оба слоя
         * становились неразборчивыми. Тень отделяет его от фона.
         */
        styles: {
            root: {
                backgroundColor: 'var(--kimiko-surface-solid)',
                border: '1px solid var(--kimiko-border)',
                boxShadow: '0 12px 28px var(--kimiko-shadow-strong)'
            }
        }
    })
}
