import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import '@mantine/nprogress/styles.layer.css'
import '@gfazioli/mantine-spinner/styles.css'

import './global.css'

import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import { DirectionProvider, MantineProvider } from '@mantine/core'
import { enableMainThreadBlocking } from 'ios-vibrator-pro-max'
import { NavigationProgress } from '@mantine/nprogress'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { useMediaQuery } from '@mantine/hooks'

import { kimikoCssVariablesResolver, theme } from '@shared/constants'
import { initDayjs } from '@shared/utils/time-utils'
import { useSmoothScroll } from '@shared/hooks'

import { Router } from './app/router/router'

polyfillCountryFlagEmojis()

enableMainThreadBlocking(false)

initDayjs()

export function App() {
    const mq = useMediaQuery('(min-width: 40em)')

    useSmoothScroll()

    return (
        <DirectionProvider>
            <MantineProvider
                cssVariablesResolver={kimikoCssVariablesResolver}
                defaultColorScheme="light"
                forceColorScheme="light"
                theme={theme}
            >
                <ModalsProvider>
                    {/*
                     * limit: даже с общим id очередь может накопиться, если
                     * нажимать быстрее, чем уведомление успевает закрыться.
                     *
                     * top: стек — fixed-элемент, и стоя у верхнего края он
                     * попадал в зону, по которой Safari 26 красит статус-бар:
                     * пока висело уведомление, бар терял прозрачность и белел
                     * от его подложки. Опущен под шапку, где браузер его уже
                     * не сэмплит.
                     */}
                    <Notifications
                        limit={1}
                        position={mq ? 'top-right' : 'top-center'}
                        styles={{
                            /*
                             * pointer-events: контейнер растянут по ширине и
                             * ловит нажатия даже пустым — под ним переставал
                             * открываться дропдаун платформ. Клики принимают
                             * только сами уведомления, ради кнопки закрытия.
                             */
                            root: { top: 72, pointerEvents: 'none' },
                            notification: { pointerEvents: 'auto' }
                        }}
                    />
                    {/*
                     * className нужен глобальному правилу .nav-progress
                     * в global.css: полоса висит fixed у верхнего края, и пока
                     * она в отрисовке, Safari 26 берёт тинт статус-бара из неё
                     * вместо стекла. Правило прячет её через display: none.
                     */}
                    <NavigationProgress className="nav-progress" />

                    <Router />
                </ModalsProvider>
            </MantineProvider>
        </DirectionProvider>
    )
}
