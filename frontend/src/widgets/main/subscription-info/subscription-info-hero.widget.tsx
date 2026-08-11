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
import { IconCopy, IconPlugConnected, IconQrcode } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { renderSVG } from 'uqr'
import clsx from 'clsx'

import {
    ACCOUNT_LABEL,
    INSTALL_ANCHOR_ID,
    QR_CODE_COLORS,
    showCopyNotification
} from '@shared/constants'
import { constructSubscriptionUrl } from '@shared/utils/construct-subscription-url'
import { formatDate, isIndefiniteExpiration } from '@shared/utils/config-parser'
import { useSubscription } from '@entities/subscription-info-store'
import { scrollToElement, useTranslation } from '@shared/hooks'
import { useAppConfig } from '@entities/app-config-store'
import { openDimmedModal } from '@shared/utils/dim-modal'
import { TelegramLogo } from '@shared/ui/telegram-logo'
import { copyText } from '@shared/utils/copy-text'
import { vibrate } from '@shared/utils/vibrate'

import {
    DAY_MS,
    getSubscriptionState,
    HOUR_MS,
    MINUTE_MS
} from './subscription-info-hero.state'
import { formatNearMoment, getHeroTexts } from './subscription-info-hero.texts'
import classes from './subscription-info-hero.module.css'

interface IProps {
    isMobile: boolean
}

export const SubscriptionInfoHeroWidget = ({ isMobile }: IProps) => {
    const { t, currentLang, baseTranslations } = useTranslation()
    const config = useAppConfig()
    const subscription = useSubscription()

    const { user } = subscription

    const texts = getHeroTexts(currentLang)

    /*
     * Отсчёт живой: страницу держат открытой подолгу, и без пересчёта остаток
     * замирал бы на значении момента загрузки — в последние часы это заметно.
     */
    const [now, setNow] = useState(() => Date.now())

    const state = getSubscriptionState(user, now)

    useEffect(() => {
        if (state.isUnlimited) return undefined

        const timer = setInterval(() => setNow(Date.now()), MINUTE_MS)
        return () => clearInterval(timer)
    }, [state.isUnlimited])

    const subscriptionUrl = constructSubscriptionUrl(
        window.location.href,
        subscription.user.shortUuid
    )

    /*
     * Склонение числительного берёт Intl: он знает правила CLDR и покрывает все
     * ветки русского — «1 час», «2 часа», «5 часов», «21 час», «22 часа».
     */
    const formatUnit = (value: number, unit: 'day' | 'hour' | 'minute') =>
        new Intl.NumberFormat(currentLang, {
            style: 'unit',
            unit,
            unitDisplay: 'long'
        }).format(value)

    const headline = (() => {
        /*
         * Выключенная вручную подписка со сроком в запасе — не «Истекла»:
         * панель отдаёт isActive = false, а дата ещё впереди.
         */
        if (state.kind === 'expired') {
            return state.isRanOut
                ? t(baseTranslations.expired)
                : t(baseTranslations.inactive)
        }
        if (state.isUnlimited) return t(baseTranslations.indefinitely)
        /*
         * Последние сутки отсчитываются часами, последний час — минутами.
         * Округление вниз, но не ниже единицы: «0 часов» не бывает — на этом
         * рубеже строка уже показывает минуты, а на нуле подписка истекла.
         */
        if (state.msLeft < HOUR_MS) {
            return formatUnit(Math.max(1, Math.floor(state.msLeft / MINUTE_MS)), 'minute')
        }
        if (state.msLeft < DAY_MS) return formatUnit(Math.floor(state.msLeft / HOUR_MS), 'hour')
        return formatUnit(Math.max(user.daysLeft, 1), 'day')
    })()

    /*
     * Дата подменяется временем, когда до срока меньше суток: «11 августа 2026»
     * в день окончания — это сегодняшнее число, строка не сообщает ничего.
     */
    const expiresValue = (() => {
        if (state.isUnlimited || isIndefiniteExpiration(user.expiresAt)) {
            return t(baseTranslations.indefinitely)
        }

        return (
            formatNearMoment(user.expiresAt, currentLang, texts) ??
            formatDate(user.expiresAt, currentLang, baseTranslations)
        )
    })()

    const trafficValue =
        user.trafficLimit === '0'
            ? `${user.trafficUsed} / ∞`
            : `${user.trafficUsed} / ${user.trafficLimit}`

    const badge = (() => {
        if (state.kind === 'onboarding') {
            return { label: texts.neverConnectedStatus, tone: 'muted' }
        }
        if (state.kind === 'expired') {
            return {
                label: state.isRanOut
                    ? t(baseTranslations.expired)
                    : t(baseTranslations.inactive),
                tone: 'expired'
            }
        }
        /*
         * На тревожных порогах бейдж уходит в янтарь и меняет слово: зелёная
         * «Активна» рядом с красной шкалой успокаивала ровно тогда, когда нужно
         * встревожить.
         */
        if (state.tone === 'critical' || state.tone === 'warning') {
            return { label: texts.expiring, tone: 'warning' }
        }
        return { label: t(baseTranslations.active), tone: 'ok' }
    })()

    const handleCopy = async () => {
        vibrate('drop')

        if (!(await copyText(subscriptionUrl))) return

        showCopyNotification(
            t(baseTranslations.linkCopied),
            t(baseTranslations.linkCopiedToClipboard)
        )
    }

    const handleConnect = () => {
        vibrate('tap')

        const target = document.getElementById(INSTALL_ANCHOR_ID)
        if (target) scrollToElement(target)
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

    /*
     * У новичка строка «Трафик 0 / ∞» — не факт, а тот самый признак, по
     * которому блок и переключился: показывать её значит занимать место пустым
     * значением.
     */
    const rows: Array<{ label: string; value: string }> = [
        { label: ACCOUNT_LABEL, value: user.username },
        ...(state.kind === 'onboarding'
            ? []
            : [{ label: t(baseTranslations.bandwidth), value: trafficValue }]),
        { label: t(baseTranslations.expires), value: expiresValue }
    ]

    const { supportUrl } = config.brandingSettings

    return (
        <Card
            className={classes.card}
            data-tone={state.tone}
            p={{ base: 'sm', xs: 'md', sm: 'lg', md: 'xl' }}
            radius="lg"
        >
            <Stack gap={isMobile ? 'sm' : 'md'}>
                <Group gap="sm" wrap="nowrap">
                    <Text className={classes.username} fw={700} size={isMobile ? 'lg' : 'xl'}>
                        {user.username}
                    </Text>
                    <Badge
                        className={classes.badge}
                        data-badge-tone={badge.tone}
                        radius="sm"
                        tt="none"
                        variant="light"
                    >
                        {badge.label}
                    </Badge>
                </Group>

                {state.kind === 'onboarding' ? (
                    <Stack gap={6}>
                        <Text className={clsx(classes.headline, classes.headlineCompact)}>
                            {texts.neverConnectedTitle}
                        </Text>
                        <Text c="dimmed" size="sm">
                            {texts.neverConnectedHint}
                        </Text>
                    </Stack>
                ) : (
                    <Stack gap={6}>
                        <Text className={classes.headline}>{headline}</Text>

                        {/*
                            Заполнение не тоньше 10px: при остатке в доли процента
                            полоса вырождалась в точку у левого края, которую легко
                            принять за артефакт рендера. Дорожка тонируется в цвет
                            состояния — тогда полоса читается целиком, а не одним
                            заполнением.
                        */}
                        <Progress
                            classNames={{
                                root: classes.progressRoot,
                                section: clsx(
                                    classes.progressSection,
                                    state.progress > 0 && classes.progressSectionFilled
                                )
                            }}
                            radius="xl"
                            size="sm"
                            value={state.progress}
                        />
                    </Stack>
                )}

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

                {/*
                    У истёкшей подписки ссылка мертва: копировать и сканировать
                    нечего, единственное осмысленное действие — продлить.
                */}
                {state.kind === 'expired' && supportUrl !== '' && (
                    <Button
                        color="kimiko"
                        component="a"
                        fullWidth
                        href={supportUrl}
                        leftSection={<TelegramLogo size={18} />}
                        onClick={() => vibrate('tap')}
                        radius="md"
                        rel="noopener noreferrer"
                        target="_blank"
                        variant="filled"
                    >
                        {state.isRanOut ? texts.renew : texts.support}
                    </Button>
                )}

                {state.kind === 'onboarding' && (
                    <Button
                        color="kimiko"
                        fullWidth
                        leftSection={<IconPlugConnected size={18} />}
                        onClick={handleConnect}
                        radius="md"
                        size="md"
                        variant="filled"
                    >
                        {texts.connect}
                    </Button>
                )}

                {state.kind !== 'expired' && !config.baseSettings.hideGetLinkButton && (
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
