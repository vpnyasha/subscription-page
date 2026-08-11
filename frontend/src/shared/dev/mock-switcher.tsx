import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'

import {
    useSubscriptionInfoStoreActions,
    useSubscriptionInfoStoreInfo
} from '@entities/subscription-info-store'

import { IMockState, MOCK_STATES } from './mock-states'

const QUERY_KEY = 'mock'

/**
 * Панель состояний блока подписки — только для локального запуска.
 *
 * Данные подписки лежат в одном сторе, поэтому проще подменять их целиком и
 * смотреть настоящую страницу, чем городить отдельный стенд с копиями виджета:
 * так проверяется тот же код, что уедет в прод.
 *
 * Выбор пишется в query-строку, чтобы состояние переживало перезагрузку и его
 * можно было открыть на телефоне по ссылке.
 */
export function MockSwitcher() {
    const actions = useSubscriptionInfoStoreActions()
    const { subscription } = useSubscriptionInfoStoreInfo()

    // Исходные данные запоминаются до первой подмены — иначе «Как есть»
    // возвращал бы предыдущий мок, а не то, что отдала панель.
    const baseRef = useRef(subscription)

    const [active, setActive] = useState(
        () => new URLSearchParams(window.location.search).get(QUERY_KEY) ?? ''
    )

    useEffect(() => {
        const base = baseRef.current
        if (!base) return

        const state = MOCK_STATES.find((item) => item.key === active)

        actions.setSubscriptionInfo({
            subscription: state ? { ...base, user: { ...base.user, ...state.patch() } } : base
        })

        const url = new URL(window.location.href)

        if (active) url.searchParams.set(QUERY_KEY, active)
        else url.searchParams.delete(QUERY_KEY)

        window.history.replaceState(null, '', url)
    }, [active, actions])

    const groups = MOCK_STATES.reduce<Record<string, IMockState[]>>((acc, state) => {
        acc[state.group] = [...(acc[state.group] ?? []), state]
        return acc
    }, {})

    return (
        <Card p="sm" radius="lg">
            <Stack gap="xs">
                <Group gap="xs">
                    <Badge color="gray" radius="sm" size="sm" tt="none" variant="light">
                        dev
                    </Badge>
                    <Text c="dimmed" fw={600} size="sm">
                        Состояния подписки
                    </Text>
                </Group>

                <Group gap={6}>
                    <Button
                        onClick={() => setActive('')}
                        radius="md"
                        size="compact-xs"
                        variant={active === '' ? 'filled' : 'default'}
                    >
                        Как есть
                    </Button>
                </Group>

                {Object.entries(groups).map(([group, states]) => (
                    <Group gap={6} key={group}>
                        <Text c="dimmed" size="xs" w={80}>
                            {group}
                        </Text>
                        {states.map((state) => (
                            <Button
                                key={state.key}
                                onClick={() => setActive(state.key)}
                                radius="md"
                                size="compact-xs"
                                variant={active === state.key ? 'filled' : 'default'}
                            >
                                {state.label}
                            </Button>
                        ))}
                    </Group>
                ))}
            </Stack>
        </Card>
    )
}
