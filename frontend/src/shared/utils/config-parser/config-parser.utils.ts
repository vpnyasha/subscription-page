import {
    TSubscriptionPageLanguageCode,
    TSubscriptionPageLocalizedText,
    TSubscriptionPageRawConfig
} from '@remnawave/subscription-page-types'
import dayjs from 'dayjs'

/*
 * Бессрочную подписку панель отдаёт не пустой датой, а датой в 2099 году —
 * поля «без срока» в контракте нет. Проверка нужна везде, где дата попадает
 * на экран, иначе вместо «Бессрочно» считаются десятки тысяч дней.
 */
const INDEFINITE_YEAR = 2099

export const isIndefiniteExpiration = (dateStr: Date | null | string | undefined) =>
    !!dateStr && dayjs(dateStr).year() === INDEFINITE_YEAR

export function getIconFromLibrary(iconKey: string, svgLibrary: Record<string, string>) {
    return svgLibrary[iconKey]
}

export function getLocalizedText(
    textObj: TSubscriptionPageLocalizedText,
    lang: TSubscriptionPageLanguageCode
): string {
    if (!textObj) return ''
    return textObj[lang]
}

export function getExpirationTextUtil(
    expireAt: Date | null | string,
    currentLang: TSubscriptionPageLanguageCode,
    baseTranslations: TSubscriptionPageRawConfig['baseTranslations']
): string {
    if (!expireAt) {
        return getLocalizedText(baseTranslations.unknown, currentLang)
    }

    const expiration = dayjs(expireAt).locale(currentLang)
    const now = dayjs()

    if (expiration.isBefore(now)) {
        return `${getLocalizedText(baseTranslations.expired, currentLang)} ${expiration.fromNow(false)}`
    }

    if (isIndefiniteExpiration(expireAt)) {
        return getLocalizedText(baseTranslations.indefinitely, currentLang)
    }

    return `${getLocalizedText(baseTranslations.expiresIn, currentLang)} ${expiration.fromNow(false)}`
}

export const formatDate = (
    dateStr: Date | string,
    currentLang: TSubscriptionPageLanguageCode,
    baseTranslations: TSubscriptionPageRawConfig['baseTranslations']
) => {
    if (isIndefiniteExpiration(dateStr)) {
        return getLocalizedText(baseTranslations.indefinitely, currentLang)
    }
    if (currentLang === 'fa') {
        return Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: undefined,
            minute: undefined
        }).format(new Date(dateStr))
    }
    return dayjs(dateStr).locale(currentLang).format('DD MMMM, YYYY')
}
