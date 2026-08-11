import { notifications } from '@mantine/notifications'

/**
 * Уведомление о копировании показывают три места (шапка, блок подписки и
 * гайд установки). Без общего идентификатора каждое нажатие добавляло ещё
 * одну карточку, и они копились стопкой поверх страницы.
 */
const COPY_NOTIFICATION_ID = 'link-copied'

/**
 * Показывает уведомление, заменяя предыдущее: сначала снимаем висящее с тем же
 * id, иначе Mantine добавит второе рядом.
 */
export function showCopyNotification(title: string, message: string) {
    notifications.hide(COPY_NOTIFICATION_ID)
    notifications.show({
        id: COPY_NOTIFICATION_ID,
        title,
        message,
        color: 'kimiko'
    })
}
