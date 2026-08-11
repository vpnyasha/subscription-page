import { GetSubscriptionInfoByShortUuidCommand } from '@remnawave/backend-contract'

import { isIndefiniteExpiration } from '@shared/utils/config-parser'

type TUser = GetSubscriptionInfoByShortUuidCommand.Response['response']['user']

export const MINUTE_MS = 60_000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

/** Ниже суток блок краснеет целиком: заголовок, шкала, дата. */
const CRITICAL_MS = DAY_MS
/** Ниже недели — янтарное предупреждение, без паники. */
const WARNING_MS = 7 * DAY_MS

/**
 * Панель не отдаёт дату начала подписки, поэтому период оплаты угадывается:
 * берётся ближайший сверху типовой срок — месяц, квартал, полгода, год, два.
 * Так шкала месячной подписки за пять дней до конца пустеет, а годовая в свои
 * первые дни стоит почти полной.
 */
const BILLING_PERIODS_DAYS = [31, 93, 186, 366, 732]

/**
 * Что показывать в блоке.
 *
 * `onboarding` — человек получил доступ и ни разу не подключился. Для него
 * страница вообще не про «скоро истечёт»: он не дошёл до установки, и остаток
 * срока ему ничего не говорит. Такому нужен не индикатор, а кнопка «Подключить»
 * — это классический instructional empty state, самый недооформленный экран в
 * подписочных продуктах.
 */
export type TSubscriptionKind = 'expired' | 'onboarding' | 'running'

export type TSubscriptionTone = 'critical' | 'expired' | 'normal' | 'warning'

export interface ISubscriptionState {
    /** Подписка кончилась по времени, а не выключена вручную. */
    isRanOut: boolean
    isUnlimited: boolean
    kind: TSubscriptionKind
    msLeft: number
    /** Заполнение шкалы, 0–100. */
    progress: number
    tone: TSubscriptionTone
}

/**
 * Единственное место, где принимается решение о состоянии блока: цвет шкалы,
 * заголовка и бейджа берутся отсюда все разом. Раньше цвет считался только для
 * шкалы, и рядом оказывались красная полоса, чёрный заголовок и зелёный бейдж —
 * три элемента говорили о подписке разное.
 */
export function getSubscriptionState(user: TUser, now: number): ISubscriptionState {
    /*
     * Пустой даты панель не отдаёт: бессрочная подписка приходит датой в 2099
     * году, поэтому одной проверки на отсутствие expiresAt мало — без второй
     * в заголовке вместо «Бессрочно» стояло бы «26 000 дней».
     */
    const isUnlimited = !user.expiresAt || isIndefiniteExpiration(user.expiresAt)

    /*
     * Остаток считается по дате, а не по daysLeft: в последние сутки панель
     * отдаёт daysLeft = 0, и подписка выглядела бы истёкшей, хотя работает.
     */
    const msLeft = user.expiresAt
        ? new Date(user.expiresAt).getTime() - now
        : Number.POSITIVE_INFINITY

    const isRanOut = !isUnlimited && msLeft <= 0
    const isExpired = !user.isActive || isRanOut

    /*
     * Признак «ни разу не подключался» берётся из трафика за всё время, а не за
     * текущий период: при стратегии сброса (MONTH, WEEK) trafficUsedBytes
     * обнуляется, и давний пользователь первого числа снова выглядел бы новичком.
     */
    const lifetimeBytes = Number(user.lifetimeTrafficUsedBytes ?? user.trafficUsedBytes)
    const neverConnected = Number.isFinite(lifetimeBytes) && lifetimeBytes <= 0

    const kind: TSubscriptionKind = (() => {
        if (isExpired) return 'expired'
        if (neverConnected) return 'onboarding'
        return 'running'
    })()

    const tone: TSubscriptionTone = (() => {
        if (isExpired) return 'expired'
        // Новичка тревожить нечем: он ещё не дошёл до установки, а не «теряет» доступ.
        if (kind === 'onboarding' || isUnlimited) return 'normal'
        if (msLeft <= CRITICAL_MS) return 'critical'
        if (msLeft <= WARNING_MS) return 'warning'
        return 'normal'
    })()

    const billingPeriod =
        BILLING_PERIODS_DAYS.find((period) => user.daysLeft <= period) ?? user.daysLeft

    const progress = (() => {
        if (isExpired) return 0
        if (isUnlimited) return 100
        return Math.min(100, Math.max(0, (msLeft / (billingPeriod * DAY_MS)) * 100))
    })()

    return { isRanOut, isUnlimited, kind, msLeft, progress, tone }
}
