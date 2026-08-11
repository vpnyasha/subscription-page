import { TSubscriptionPageLanguageCode } from '@remnawave/subscription-page-types'
import { Button, Card, Center, Image, Stack, Text, Title } from '@mantine/core'
import { IconMessageChatbot } from '@tabler/icons-react'

import { BRAND_LOGO_URL } from '@shared/constants'

/**
 * Заглушка для голого домена: панель отдаёт данные подписки только по ссылке
 * с ключом, поэтому корень сайта остаётся пустым. Тексты живут здесь —
 * baseTranslations такого ключа не содержат.
 */
const TEXTS: Record<string, { hint: string; support: string; title: string }> = {
    en: {
        title: 'Nothing here',
        hint: 'Open your personal subscription link — the one the bot gave you. The bare address shows nothing.',
        support: 'Contact support'
    },
    ru: {
        title: 'Здесь ничего нет',
        hint: 'Откройте персональную ссылку на подписку — ту, что выдал бот. Адрес без ключа ничего не показывает.',
        support: 'Написать в поддержку'
    }
}

interface IProps {
    lang: TSubscriptionPageLanguageCode
    supportUrl: string
}

export function SubscriptionMissingShared({ lang, supportUrl }: IProps) {
    const texts = TEXTS[lang] ?? TEXTS.en

    return (
        <Center h="100%" p="md">
            <Card maw={420} p={{ base: 'lg', sm: 'xl' }} radius="lg" w="100%">
                <Stack align="center" gap="md">
                    <Image
                        alt="logo"
                        fit="contain"
                        src={BRAND_LOGO_URL}
                        style={{ width: '56px', height: '56px' }}
                    />

                    <Title c="var(--mantine-color-text)" order={4} ta="center">
                        {texts.title}
                    </Title>

                    <Text c="dimmed" size="sm" ta="center">
                        {texts.hint}
                    </Text>

                    {supportUrl !== '' && (
                        <Button
                            color="kimiko"
                            component="a"
                            href={supportUrl}
                            leftSection={<IconMessageChatbot size={18} />}
                            radius="md"
                            rel="noopener noreferrer"
                            target="_blank"
                            variant="light"
                        >
                            {texts.support}
                        </Button>
                    )}
                </Stack>
            </Card>
        </Center>
    )
}
