import { ActionIcon, Badge, Box, Button, Card, Group, Progress, Stack, Text } from '@mantine/core'
import { IconCopy, IconQrcode } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useClipboard } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { renderSVG } from 'uqr'

import { constructSubscriptionUrl } from '@shared/utils/construct-subscription-url'
import { useSubscription } from '@entities/subscription-info-store'
import { ACCOUNT_LABEL, QR_CODE_COLORS } from '@shared/constants'
import { useAppConfig } from '@entities/app-config-store'
import { formatDate } from '@shared/utils/config-parser'
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

interface IProps {
    isMobile: boolean
}

export const SubscriptionInfoHeroWidget = ({ isMobile }: IProps) => {
    const { t, currentLang, baseTranslations } = useTranslation()
    const config = useAppConfig()
    const subscription = useSubscription()
    const clipboard = useClipboard({ timeout: 10000 })

    const { user } = subscription
    const isActive = user.userStatus === 'ACTIVE' && user.daysLeft > 0
    const isUnlimited = !user.expiresAt

    const subscriptionUrl = constructSubscriptionUrl(
        window.location.href,
        subscription.user.shortUuid
    )

    // Склонение числительного берёт Intl: «359 дней», «1 день», «2 дня».
    const daysLabel = new Intl.NumberFormat(currentLang, {
        style: 'unit',
        unit: 'day',
        unitDisplay: 'long'
    }).format(Math.max(user.daysLeft, 0))

    const headline = (() => {
        if (isUnlimited) return t(baseTranslations.indefinitely)
        if (!isActive) return t(baseTranslations.expired)
        return daysLabel
    })()

    const billingPeriod =
        BILLING_PERIODS_DAYS.find((period) => user.daysLeft <= period) ?? user.daysLeft

    const progress = isUnlimited
        ? 100
        : Math.min(100, Math.max(0, (user.daysLeft / billingPeriod) * 100))

    const progressColor = (() => {
        if (!isActive) return 'red'
        if (user.daysLeft <= 3) return 'red'
        if (user.daysLeft <= 7) return 'orange'
        return 'teal'
    })()

    const expiresValue = isUnlimited
        ? t(baseTranslations.indefinitely)
        : formatDate(user.expiresAt, currentLang, baseTranslations)

    const trafficValue =
        user.trafficLimit === '0'
            ? `${user.trafficUsed} / ∞`
            : `${user.trafficUsed} / ${user.trafficLimit}`

    const handleCopy = () => {
        vibrate('drop')
        clipboard.copy(subscriptionUrl)
        notifications.show({
            title: t(baseTranslations.linkCopied),
            message: t(baseTranslations.linkCopiedToClipboard),
            color: 'kimiko'
        })
    }

    const handleShowQr = () => {
        vibrate('tap')

        modals.open({
            centered: true,
            title: t(baseTranslations.getLink),
            children: (
                <Stack align="center">
                    <Box
                        className={classes.qr}
                        dangerouslySetInnerHTML={{
                            __html: renderSVG(subscriptionUrl, QR_CODE_COLORS)
                        }}
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
