import { TSubscriptionPageLanguageCode } from '@remnawave/subscription-page-types'
import dayjs from 'dayjs'

/**
 * Строки, которых нет в baseTranslations панели. Тот же приём, что в заглушке
 * `shared/ui/subscription-missing`: контракт панели трогать нельзя, а тексты
 * форку нужны, поэтому они живут рядом с виджетом. Фолбэк — английский.
 */
interface IHeroTexts {
    connect: string
    expiring: string
    neverConnectedHint: string
    neverConnectedStatus: string
    neverConnectedTitle: string
    renew: string
    support: string
    today: string
    tomorrow: string
    yesterday: string
}

const TEXTS: Record<string, IHeroTexts> = {
    en: {
        connect: 'Connect',
        expiring: 'Expiring',
        neverConnectedHint:
            'Your subscription is active, but no traffic has gone through it yet. Install the app and connect — it takes a couple of minutes.',
        neverConnectedStatus: 'Not connected',
        neverConnectedTitle: 'Let’s get you connected',
        renew: 'Renew subscription',
        support: 'Contact support',
        today: 'today at {time}',
        tomorrow: 'tomorrow at {time}',
        yesterday: 'yesterday at {time}'
    },
    ru: {
        connect: 'Подключиться',
        expiring: 'Истекает',
        neverConnectedHint:
            'Подписка активна, но трафика через неё ещё не проходило. Установите приложение и подключитесь — это займёт пару минут.',
        neverConnectedStatus: 'Не подключено',
        neverConnectedTitle: 'Вы ещё не подключались',
        renew: 'Продлить подписку',
        support: 'Написать в поддержку',
        today: 'сегодня в {time}',
        tomorrow: 'завтра в {time}',
        yesterday: 'вчера в {time}'
    }
}

export const getHeroTexts = (lang: TSubscriptionPageLanguageCode): IHeroTexts =>
    TEXTS[lang] ?? TEXTS.en

/**
 * «11 августа 2026» в день, когда подписка кончается, — это сегодняшняя дата:
 * строка занимает место и не сообщает ничего. В пределах вчера—завтра дата
 * заменяется временем: «сегодня в 19:40».
 *
 * Возвращает null, если до даты больше суток, — тогда зовущий рисует обычную дату.
 */
export function formatNearMoment(
    date: Date | string,
    lang: TSubscriptionPageLanguageCode,
    texts: IHeroTexts
): null | string {
    const target = dayjs(date)

    // Считаем по календарным дням, а не по «меньше 24 часов»: в половине
    // первого ночи срок через 22 часа наступает завтра, а не сегодня.
    const dayShift = target.startOf('day').diff(dayjs().startOf('day'), 'day')

    if (Math.abs(dayShift) > 1) return null

    const time = new Intl.DateTimeFormat(lang, {
        hour: '2-digit',
        minute: '2-digit'
    }).format(target.toDate())

    const pattern = (() => {
        if (dayShift === 0) return texts.today
        if (dayShift === 1) return texts.tomorrow
        return texts.yesterday
    })()

    return pattern.replace('{time}', time)
}
