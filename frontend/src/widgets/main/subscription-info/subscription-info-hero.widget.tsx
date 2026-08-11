import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Image,
    Progress,
    Stack,
    Text
} from '@mantine/core'
import { IconCopy, IconQrcode } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { renderSVG } from 'uqr'

import { ACCOUNT_LABEL, QR_CODE_COLORS, showCopyNotification } from '@shared/constants'
import { constructSubscriptionUrl } from '@shared/utils/construct-subscription-url'
import { formatDate, isIndefiniteExpiration } from '@shared/utils/config-parser'
import { useSubscription } from '@entities/subscription-info-store'
import { useAppConfig } from '@entities/app-config-store'
import { openDimmedModal } from '@shared/utils/dim-modal'
import { copyText } from '@shared/utils/copy-text'
import { vibrate } from '@shared/utils/vibrate'
import { useTranslation } from '@shared/hooks'

import classes from './subscription-info-hero.module.css'

/**
 * Панель не отдаёт дату начала подписки, поэтому период оплаты угадывается:
 * берётся ближайший сверху типовой срок — месяц, квартал, полгода, год, два.
 * Так шкала месячной подписки за пять дней до конца пустеет, а годовая в свои
 * первые дни стоит почти полной.
 */
const BILLING_PERIODS_DAYS = [31, 93, 186, 366, 732]

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

interface IProps {
    isMobile: boolean
}

export const SubscriptionInfoHeroWidget = ({ isMobile }: IProps) => {
    const { t, currentLang, baseTranslations } = useTranslation()
    const config = useAppConfig()
    const subscription = useSubscription()

    const { user } = subscription

    /*
     * Пустой даты панель не отдаёт: бессрочная подписка приходит датой в 2099
     * году, поэтому одной проверки на отсутствие expiresAt мало — без второй
     * в заголовке вместо «Бессрочно» стояло бы «26 000 дней».
     */
    const isUnlimited = !user.expiresAt || isIndefiniteExpiration(user.expiresAt)

    /*
     * Отсчёт живой: страницу держат открытой подолгу, и без пересчёта остаток
     * замирал бы на значении момента загрузки — в последние часы это заметно.
     */
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (isUnlimited) return undefined

        const timer = setInterval(() => setNow(Date.now()), MINUTE_MS)
        return () => clearInterval(timer)
    }, [isUnlimited])

    /*
     * Остаток считается по дате, а не по daysLeft: в последние сутки панель
     * отдаёт daysLeft = 0, и подписка выглядела бы истёкшей, хотя работает.
     */
    const msLeft = user.expiresAt
        ? new Date(user.expiresAt).getTime() - now
        : Number.POSITIVE_INFINITY

    const isActive = user.isActive && msLeft > 0

    const subscriptionUrl = constructSubscriptionUrl(
        window.location.href,
        subscription.user.shortUuid
    )

    // Склонение числительного берёт Intl: «359 дней», «1 день», «16 часов».
    const formatUnit = (value: number, unit: 'day' | 'hour' | 'minute') =>
        new Intl.NumberFormat(currentLang, {
            style: 'unit',
            unit,
            unitDisplay: 'long'
        }).format(value)

    const headline = (() => {
        if (isUnlimited) return t(baseTranslations.indefinitely)
        if (!isActive) return t(baseTranslations.expired)
        // Последние сутки отсчитываются часами, последний час — минутами.
        if (msLeft < HOUR_MS) return formatUnit(Math.max(1, Math.floor(msLeft / MINUTE_MS)), 'minute')
        if (msLeft < DAY_MS) return formatUnit(Math.floor(msLeft / HOUR_MS), 'hour')
        return formatUnit(Math.max(user.daysLeft, 1), 'day')
    })()

    const billingPeriod =
        BILLING_PERIODS_DAYS.find((period) => user.daysLeft <= period) ?? user.daysLeft

    const progress = isUnlimited
        ? 100
        : Math.min(100, Math.max(0, (msLeft / (billingPeriod * DAY_MS)) * 100))

    const progressColor = (() => {
        if (!isActive) return 'red'
        if (msLeft <= 3 * DAY_MS) return 'red'
        if (msLeft <= 7 * DAY_MS) return 'orange'
        return 'teal'
    })()

    const expiresValue = isUnlimited
        ? t(baseTranslations.indefinitely)
        : formatDate(user.expiresAt, currentLang, baseTranslations)

    const trafficValue =
        user.trafficLimit === '0'
            ? `${user.trafficUsed} / ∞`
            : `${user.trafficUsed} / ${user.trafficLimit}`

    const handleCopy = async () => {
        vibrate('drop')

        if (!(await copyText(subscriptionUrl))) return

        showCopyNotification(
            t(baseTranslations.linkCopied),
            t(baseTranslations.linkCopiedToClipboard)
        )
    }

    const handleShowQr = () => {
        vibrate('tap')

        const qrCode = renderSVG(subscriptionUrl, QR_CODE_COLORS)

        openDimmedModal({
            centered: true,
            title: t(baseTranslations.getLink),
            classNames: {
                content: classes.modalContent,
                header: classes.modalHeader,
                title: classes.modalTitle
            },
            children: (
                <Stack align="center">
                    <Image
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
                        style={{ borderRadius: 'var(--mantine-radius-md)' }}
                    />
                    <Text c="var(--mantine-color-text)" fw={600} size="lg" ta="center">
                        {t(baseTranslations.scanQrCode)}
                    </Text>
                    <Text c="dimmed" size="sm" ta="center">
                        {t(baseTranslations.scanQrCodeDescription)}
                    </Text>
                </Stack>
            )
        })
    }

    const rows: Array<{ label: string; value: string }> = [
        { label: ACCOUNT_LABEL, value: user.username },
        { label: t(baseTranslations.bandwidth), value: trafficValue },
        { label: t(baseTranslations.expires), value: expiresValue }
    ]

    return (
        <Card
            className={classes.card}
            p={{ base: 'sm', xs: 'md', sm: 'lg', md: 'xl' }}
            radius="lg"
        >
            <Stack gap={isMobile ? 'sm' : 'md'}>
                <Group gap="sm" wrap="nowrap">
                    <Text className={classes.username} fw={700} size={isMobile ? 'lg' : 'xl'}>
                        {user.username}
                    </Text>
                    <Badge color={isActive ? 'teal' : 'red'} radius="sm" tt="none" variant="light">
                        {isActive ? t(baseTranslations.active) : t(baseTranslations.inactive)}
                    </Badge>
                </Group>

                <Stack gap={6}>
                    <Text className={classes.headline}>{headline}</Text>

                    <Progress
                        classNames={{ root: classes.progressRoot }}
                        color={progressColor}
                        radius="xl"
                        size="sm"
                        value={progress}
                    />
                </Stack>

                <Stack gap={0}>
                    {rows.map((row) => (
                        <Group
                            className={classes.row}
                            gap="sm"
                            justify="space-between"
                            key={row.label}
                            wrap="nowrap"
                        >
                            <Text c="dimmed" size="sm">
                                {row.label}
                            </Text>
                            <Text className={classes.rowValue} fw={600} size="sm">
                                {row.value}
                            </Text>
                        </Group>
                    ))}
                </Stack>

                {!config.baseSettings.hideGetLinkButton && (
                    <Group gap="xs" wrap="nowrap">
                        <Button
                            color="kimiko"
                            flex={1}
                            leftSection={<IconCopy size={18} />}
                            onClick={handleCopy}
                            radius="md"
                            variant="light"
                        >
                            {t(baseTranslations.copyLink)}
                        </Button>
                        <ActionIcon
                            className={classes.qrButton}
                            onClick={handleShowQr}
                            radius="md"
                            size={36}
                            variant="default"
                        >
                            <IconQrcode size={18} />
                        </ActionIcon>
                    </Group>
                )}
            </Stack>
        </Card>
    )
}
