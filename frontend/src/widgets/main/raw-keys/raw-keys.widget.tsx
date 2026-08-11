import {
    ActionIcon,
    Box,
    Card,
    Group,
    Image,
    ScrollArea,
    Stack,
    Text,
    Title
} from '@mantine/core'
import { IconCheck, IconCopy, IconQrcode } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { renderSVG } from 'uqr'

import { useSubscription } from '@entities/subscription-info-store'
import { openDimmedModal } from '@shared/utils/dim-modal'
import { QR_CODE_COLORS } from '@shared/constants'
import { copyText } from '@shared/utils/copy-text'
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

    /* Какой ключ скопирован последним — по нему кнопка показывает галочку. */
    const [copiedLink, setCopiedLink] = useState<null | string>(null)

    useEffect(() => {
        if (!copiedLink) return undefined

        const timer = setTimeout(() => setCopiedLink(null), 2000)
        return () => clearTimeout(timer)
    }, [copiedLink])

    if (subscription.links.length === 0) return null

    const parsedLinks = parseLinks(subscription.links)

    const handleCopyKey = async (fullLink: string) => {
        vibrate('drop')

        // Галочка только при удавшемся копировании, иначе она врёт.
        if (await copyText(fullLink)) {
            setCopiedLink(fullLink)
        }
    }

    const handleShowQr = (link: ParsedLink) => {
        const qrCode = renderSVG(link.fullLink, QR_CODE_COLORS)

        openDimmedModal({
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

                {/* Потолок рассчитан примерно на шесть строк: с прежними 300px
                    после укрупнения не помещались даже четыре и список начинал
                    прокручиваться. Полоса появляется только когда ключей много. */}
                <ScrollArea.Autosize mah={480} scrollbars="y" scrollbarSize={6} type="auto">
                    <Stack gap="xs">
                        {parsedLinks.map((link, index) => (
                            <Box className={classes.keyBox} key={index} p="sm">
                                <Box className={classes.keyRow}>
                                    <Box className={classes.keyInfo}>
                                        <KeyMarker />
                                        <Box className={classes.keyName}>
                                            <Text
                                                c="var(--mantine-color-text)"
                                                fw={500}
                                                size={isMobile ? 'sm' : 'md'}
                                                span
                                            >
                                                {link.name}
                                            </Text>
                                        </Box>
                                    </Box>

                                    {/* Кнопки крупнее подписи: по ним попадают пальцем,
                                        а мелкие иконки на телефоне почти не видно. */}
                                    <Group gap={4} wrap="nowrap">
                                        {/* Не Mantine CopyButton: он ходит только
                                            в navigator.clipboard, а тот молчит вне
                                            защищённого контекста — по http кнопка
                                            не переключалась на галочку. */}
                                        <ActionIcon
                                            color={copiedLink === link.fullLink ? 'teal' : 'gray'}
                                            onClick={() => handleCopyKey(link.fullLink)}
                                            size={isMobile ? 'lg' : 'xl'}
                                            variant="subtle"
                                        >
                                            {copiedLink === link.fullLink ? (
                                                <IconCheck size={isMobile ? 20 : 22} />
                                            ) : (
                                                <IconCopy size={isMobile ? 20 : 22} />
                                            )}
                                        </ActionIcon>

                                        <ActionIcon
                                            color="kimiko"
                                            onClick={() => {
                                                vibrate('tap')
                                                handleShowQr(link)
                                            }}
                                            size={isMobile ? 'lg' : 'xl'}
                                            variant="subtle"
                                        >
                                            <IconQrcode size={isMobile ? 20 : 22} />
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
