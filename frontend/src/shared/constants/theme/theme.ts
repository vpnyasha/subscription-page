import { createTheme } from '@mantine/core'

import { kimikoAccent, kimikoColors, kimikoSand } from './palette'
import components from './overrides'

export const theme = createTheme({
    components,
    cursorType: 'pointer',
    fontFamily:
        'Montserrat, Vazirmatn, Apple Color Emoji, Noto Sans SC, Twemoji Country Flags, sans-serif',
    fontFamilyMonospace: 'Fira Mono, monospace',
    breakpoints: {
        xs: '25em',
        sm: '30em',
        md: '48em',
        lg: '64em',
        xl: '80em',
        '2xl': '96em',
        '3xl': '120em',
        '4xl': '160em'
    },
    scale: 1,
    fontSmoothing: true,
    focusRing: 'never',
    white: kimikoColors.surfaceRaised,
    black: kimikoColors.text,
    colors: {
        // Основной акцент темы. Имена вроде `cyan` намеренно не переопределены:
        // ими пользуется конфиг панели (svgIconColor), и иконка, заказавшая
        // голубой, должна остаться голубой.
        kimiko: kimikoAccent,

        // Нейтраль Mantine в светлой схеме берётся из `gray`:
        // отсюда цвет границ, плейсхолдеров и приглушённого текста.
        gray: kimikoSand,

        dark: [
            '#2b2724',
            '#3a3531',
            '#514a43',
            '#6e665d',
            '#ab9f8d',
            '#d5cabb',
            '#ebe5da',
            '#f2eee7',
            '#faf8f4',
            '#ffffff'
        ],

        blue: [
            '#ddf4ff',
            '#b6e3ff',
            '#80ccff',
            '#54aeff',
            '#218bff',
            '#0969da',
            '#0550ae',
            '#033d8b',
            '#0a3069',
            '#002155'
        ],
        green: [
            '#dafbe1',
            '#aceebb',
            '#6fdd8b',
            '#4ac26b',
            '#2da44e',
            '#1a7f37',
            '#116329',
            '#044f1e',
            '#003d16',
            '#002d11'
        ],
        yellow: [
            '#fff8c5',
            '#fae17d',
            '#eac54f',
            '#d4a72c',
            '#bf8700',
            '#9a6700',
            '#7d4e00',
            '#633c01',
            '#4d2d00',
            '#3b2300'
        ],
        orange: [
            '#fff1e5',
            '#ffd8b5',
            '#ffb77c',
            '#fb8f44',
            '#e16f24',
            '#bc4c00',
            '#953800',
            '#762c00',
            '#5c2200',
            '#471700'
        ],

        // Статусные цвета приглушены под тёплую бумагу: дефолтные Mantine
        // teal/red/violet на кремовом фоне выглядят кислотными.
        teal: [
            '#e9f2ec',
            '#d3e5da',
            '#a8cbb8',
            '#7db095',
            '#549677',
            '#3b7d5e',
            '#2f6b52',
            '#255744',
            '#1c4335',
            '#132f25'
        ],
        red: [
            '#fbeceb',
            '#f6dbd9',
            '#e9b4b0',
            '#dc8d87',
            '#cb6960',
            '#b34a41',
            '#9c342c',
            '#832823',
            '#6a1e1a',
            '#4f1512'
        ],
        violet: [
            '#f1eef6',
            '#e2dcee',
            '#c5b9dc',
            '#a795c9',
            '#8c76b6',
            '#755d9f',
            '#644e88',
            '#523f6f',
            '#413156',
            '#2f233e'
        ]
    },
    primaryShade: { light: 6, dark: 6 },
    primaryColor: 'kimiko',
    autoContrast: true,
    luminanceThreshold: 0.3,
    headings: {
        fontFamily: 'Unbounded, Vazirmatn, Apple Color Emoji, Noto Sans SC, sans-serif',
        fontWeight: '600'
    },
    defaultRadius: 'md'
})
