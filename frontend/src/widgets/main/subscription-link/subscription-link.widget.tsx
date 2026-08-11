import {
    IconBrandDiscord,
    IconBrandVk,
    IconCopy,
    IconLink,
    IconMessageChatbot
} from '@tabler/icons-react'
import { ActionIcon, Button, Group, Image, Stack, Text } from '@mantine/core'
import { renderSVG } from 'uqr'

import { constructSubscriptionUrl } from '@shared/utils/construct-subscription-url'
import { QR_CODE_COLORS, showCopyNotification } from '@shared/constants'
import { useSubscription } from '@entities/subscription-info-store'
import { openDimmedModal } from '@shared/utils/dim-modal'
import { copyText } from '@shared/utils/copy-text'
import { vibrate } from '@shared/utils/vibrate'
import { useTranslation } from '@shared/hooks'
import { TelegramLogo } from '@shared/ui'

import classes from './subscription-link.module.css'

interface IProps {
    hideGetLink: boolean
    supportUrl: string
}

export const SubscriptionLinkWidget = ({ supportUrl, hideGetLink }: IProps) => {
    const { t, baseTranslations } = useTranslation()
    const subscription = useSubscription()

    const subscriptionUrl = constructSubscriptionUrl(
        window.location.href,
        subscription.user.shortUuid
    )

    const handleCopy = async () => {
        // Уведомление только при удавшемся копировании, иначе оно врёт.
        if (await copyText(subscriptionUrl)) {
            showCopyNotification(
                t(baseTranslations.linkCopied),
                t(baseTranslations.linkCopiedToClipboard)
            )
        }
    }

    const renderSupportLink = (supportUrl: string) => {
        const iconConfig = {
            't.me': { icon: TelegramLogo, color: '#0088cc' },
            'discord.com': { icon: IconBrandDiscord, color: '#5865F2' },
            'vk.com': { icon: IconBrandVk, color: '#0077FF' }
        }

        const matchedPlatform = Object.entries(iconConfig).find(([domain]) =>
            supportUrl.includes(domain)
        )

        const { icon: Icon, color } = matchedPlatform
            ? matchedPlatform[1]
            : { icon: IconMessageChatbot, color: 'kimiko' }

        return (
            <ActionIcon
                c={color}
                component="a"
                href={supportUrl}
                radius="md"
                rel="noopener noreferrer"
                size="xl"
                style={{
                    background: 'var(--kimiko-surface)',
                    border: '1px solid var(--kimiko-border-strong)'
                }}
                target="_blank"
                variant="default"
            >
                <Icon />
            </ActionIcon>
        )
    }

    const handleGetLink = () => {
        vibrate('tap')

        const subscriptionQrCode = renderSVG(subscriptionUrl, QR_CODE_COLORS)

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
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(subscriptionQrCode)}`}
                        style={{ borderRadius: 'var(--mantine-radius-md)' }}
                    />
                    <Text c="var(--mantine-color-text)" fw={600} size="lg" ta="center">
                        {t(baseTranslations.scanQrCode)}
                    </Text>
                    <Text c="dimmed" size="sm" ta="center">
                        {t(baseTranslations.scanQrCodeDescription)}
                    </Text>

                    <Button
                        fullWidth
                        leftSection={<IconCopy />}
                        onClick={handleCopy}
                        radius="md"
                        variant="light"
                    >
                        {t(baseTranslations.copyLink)}
                    </Button>
                </Stack>
            )
        })
    }

    return (
        <Group gap="xs" ml="auto" wrap="nowrap">
            {!hideGetLink && (
                <ActionIcon
                    className={classes.actionIcon}
                    onClick={handleGetLink}
                    radius="md"
                    size="xl"
                    variant="default"
                >
                    <IconLink />
                </ActionIcon>
            )}

            {supportUrl !== '' && renderSupportLink(supportUrl)}
        </Group>
    )
}
