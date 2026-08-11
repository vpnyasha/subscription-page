import { GetSubscriptionInfoByShortUuidCommand } from '@remnawave/backend-contract'

type TUser = GetSubscriptionInfoByShortUuidCommand.Response['response']['user']

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export interface IMockState {
    group: string
    key: string
    label: string
    /** Что подменить в пользователе. Пустой патч возвращает исходные данные. */
    patch: () => Partial<TUser>
}

/**
 * Срок отсчитывается от момента переключения, а не от загрузки страницы:
 * состояния перебирают руками, и «три часа» должны оставаться тремя часами.
 *
 * daysLeft считается так же, как его считает панель — целыми сутками вниз.
 * Именно поэтому в последние сутки оттуда приходит ноль, и виджет опирается на
 * expiresAt, а не на это поле.
 */
const at = (offsetMs: number): Partial<TUser> => ({
    expiresAt: new Date(Date.now() + offsetMs),
    daysLeft: Math.max(0, Math.floor(offsetMs / DAY_MS))
})

/** Трафик приходит парой: строкой для показа и байтами для расчётов. */
const traffic = (used: string, usedBytes: string, lifetime: string, lifetimeBytes: string) => ({
    trafficUsed: used,
    trafficUsedBytes: usedBytes,
    lifetimeTrafficUsed: lifetime,
    lifetimeTrafficUsedBytes: lifetimeBytes
})

const USED = traffic('12.51 GiB', '13432012800', '148.3 GiB', '159254220800')
const UNUSED = traffic('0 B', '0', '0 B', '0')

const hours = (value: number, label: string): IMockState => ({
    group: 'Склонения',
    key: `h${value}`,
    label,
    // Полминуты запаса: без него ровно 3 часа тут же становятся 2 часами 59 минутами.
    patch: () => ({ ...at(value * HOUR_MS + 30_000), ...USED })
})

/**
 * Набор состояний для визуальной проверки блока подписки. Живёт только в dev:
 * в прод-сборке вызов обёрнут в import.meta.env.DEV и вырезается вместе с
 * импортом.
 */
export const MOCK_STATES: IMockState[] = [
    {
        group: 'Срок',
        key: 'year',
        label: 'Год',
        patch: () => ({ ...at(359 * DAY_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'days10',
        label: '10 дней',
        patch: () => ({ ...at(10 * DAY_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'days6',
        label: '6 дней · янтарь',
        patch: () => ({ ...at(6 * DAY_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'days2',
        label: '2 дня · янтарь',
        patch: () => ({ ...at(2 * DAY_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'h23',
        label: '23 часа · красный',
        patch: () => ({ ...at(23 * HOUR_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'h3',
        label: '3 часа · красный',
        patch: () => ({ ...at(3 * HOUR_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'min40',
        label: '40 минут',
        patch: () => ({ ...at(40 * MINUTE_MS), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Срок',
        key: 'min1',
        label: '1 минута',
        patch: () => ({ ...at(MINUTE_MS + 5_000), ...USED, isActive: true, userStatus: 'ACTIVE' })
    },

    hours(1, '1 час'),
    hours(2, '2 часа'),
    hours(5, '5 часов'),
    hours(21, '21 час'),
    hours(22, '22 часа'),

    {
        group: 'Особые',
        key: 'unlimited',
        label: 'Бессрочная',
        patch: () => ({
            ...USED,
            daysLeft: 26_806,
            expiresAt: new Date('2099-01-01T00:00:00.000Z'),
            isActive: true,
            userStatus: 'ACTIVE'
        })
    },
    {
        group: 'Особые',
        key: 'limited',
        label: 'Лимит трафика',
        patch: () => ({
            ...at(45 * DAY_MS),
            ...traffic('45.2 GiB', '48533041152', '210.7 GiB', '226248785920'),
            trafficLimit: '100 GiB',
            trafficLimitBytes: '107374182400',
            isActive: true,
            userStatus: 'ACTIVE'
        })
    },
    {
        group: 'Особые',
        key: 'never',
        label: 'Не подключался · 3 часа',
        patch: () => ({ ...at(3 * HOUR_MS), ...UNUSED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Особые',
        key: 'neverYear',
        label: 'Не подключался · год',
        patch: () => ({ ...at(359 * DAY_MS), ...UNUSED, isActive: true, userStatus: 'ACTIVE' })
    },
    {
        group: 'Особые',
        key: 'expired',
        label: 'Истекла 2 часа назад',
        patch: () => ({ ...at(-2 * HOUR_MS), ...USED, isActive: false, userStatus: 'EXPIRED' })
    },
    {
        group: 'Особые',
        key: 'expiredLong',
        label: 'Истекла 9 дней назад',
        patch: () => ({ ...at(-9 * DAY_MS), ...USED, isActive: false, userStatus: 'EXPIRED' })
    },
    {
        group: 'Особые',
        key: 'disabled',
        label: 'Отключена вручную',
        patch: () => ({ ...at(30 * DAY_MS), ...USED, isActive: false, userStatus: 'DISABLED' })
    },
    {
        group: 'Особые',
        key: 'expiredNever',
        label: 'Истекла, не подключался',
        patch: () => ({ ...at(-DAY_MS), ...UNUSED, isActive: false, userStatus: 'EXPIRED' })
    }
]
