import {
    ActionIcon,
    Box,
    Card,
    CopyButton,
    Group,
    Image,
    ScrollArea,
    Stack,
    Text,
    Title
} from '@mantine/core'
import { IconCheck, IconCopy, IconQrcode } from '@tabler/icons-react'
import { modals } from '@mantine/modals'
import { renderSVG } from 'uqr'

import { useSubscription } from '@entities/subscription-info-store'
import { QR_CODE_COLORS } from '@shared/constants'
import { vibrate } from '@shared/utils/vibrate'
import { useTranslation } from '@shared/hooks'

import classes from './raw-keys.module.css'

interface ParsedLink {
    fullLink: string
    name: string
}

/**
 * Маркер строки: флаг в названии сервера уже работает как иконка, поэтому
 * рядом стоит нейтральная точка, а не второй рисунок.
 */
const KeyMarker = () => (
    <Box
        style={{
            width: 6,
            height: 6,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'var(--mantine-color-kimiko-4)'
        }}
    />
)

const parseLinks = (links: string[]): ParsedLink[] => {
    return links.map((link) => {
        const hashIndex = link.lastIndexOf('#')
        let name = 'Unknown'

        if (hashIndex !== -1) {
            const encodedName = link.substring(hashIndex + 1)
            try {
                name = decodeURIComponent(encodedName)
            } catch {
                name = encodedName
            }
        }

        return {
            name,
            fullLink: link
        }
    })
}

interface IProps {
    isMobile: boolean
}

export const RawKeysWidget = ({ isMobile }: IProps) => {
    const { t, baseTranslations } = useTranslation()
    const subscription = useSubscription()

    if (subscription.links.length === 0) return null

    const parsedLinks = parseLinks(subscription.links)

    const handleShowQr = (link: ParsedLink) => {
        const qrCode = renderSVG(link.fullLink, QR_CODE_COLORS)

        modals.open({
            centered: true,
            title: link.name,
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
                    <Text c="dimmed" size="sm" ta="center">
                        {t(baseTranslations.scanToImport)}
                    </Text>
                </Stack>
            )
        })
    }

    return (
        <Card p={{ base: 'sm', xs: 'md', sm: 'lg', md: 'xl' }} radius="lg">
            <Stack gap="md">
                {/* Счётчик стоит вплотную к заголовку: в правом углу карточки
                    он налезал на орнамент (см. card.module.css). */}
                <Group align="center" gap="xs" wrap="nowrap">
                    <Title c="var(--mantine-color-text)" fw={600} order={4}>
                        {t(baseTranslations.connectionKeysHeader)}
                    </Title>
                    {parsedLinks.length > 1 && (
                        <Text c="dimmed" fw={600} size="lg">
                            {parsedLinks.length}
                        </Text>
                    )}
                </Group>

                <ScrollArea.Autosize mah={300} scrollbars="y">
                    <Stack gap="xs">
                        {parsedLinks.map((link, index) => (
                            <Box className={classes.keyBox} key={index} p="xs">
                                <Box className={classes.keyRow}>
                                    <Box className={classes.keyInfo}>
                                        <KeyMarker />
                                        <Box className={classes.keyName}>
                                            <Text
                                                c="var(--mantine-color-text)"
                                                fw={500}
                                                size={isMobile ? 'xs' : 'sm'}
                                                span
                                            >
                                                {link.name}
                                            </Text>
                                        </Box>
                                    </Box>

                                    <Group gap={4} wrap="nowrap">
                                        <CopyButton value={link.fullLink}>
                                            {({ copied, copy }) => (
                                                <ActionIcon
                                                    color={copied ? 'teal' : 'gray'}
                                                    onClick={() => {
                                                        vibrate('drop')
                                                        copy()
                                                    }}
                                                    size={isMobile ? 'sm' : 'md'}
                                                    variant="subtle"
                                                >
                                                    {copied ? (
                                                        <IconCheck size={isMobile ? 14 : 16} />
                                                    ) : (
                                                        <IconCopy size={isMobile ? 14 : 16} />
                                                    )}
                                                </ActionIcon>
                                            )}
                                        </CopyButton>

                                        <ActionIcon
                                            color="kimiko"
                                            onClick={() => {
                                                vibrate('tap')
                                                handleShowQr(link)
                                            }}
                                            size={isMobile ? 'sm' : 'md'}
                                            variant="subtle"
                                        >
                                            <IconQrcode size={isMobile ? 14 : 16} />
                                        </ActionIcon>
                                    </Group>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </ScrollArea.Autosize>
            </Stack>
        </Card>
    )
}
