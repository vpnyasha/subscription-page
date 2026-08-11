import { Box, BoxProps, ElementProps } from '@mantine/core'

interface TelegramLogoProps
    extends ElementProps<'svg', keyof BoxProps>, Omit<BoxProps, 'children' | 'ref'> {
    size?: number | string
}

/**
 * Контурный самолётик вместо залитого IconBrandTelegram из tabler: тонкая
 * линия ближе к остальной графике страницы. Обводка — currentColor, поэтому
 * цвет задаётся снаружи, как у любой иконки.
 */
export function TelegramLogo({ size = 22, style, ...props }: TelegramLogoProps) {
    return (
        <Box
            component="svg"
            fill="none"
            style={{ width: size, height: size, ...style }}
            viewBox="0 0 15 15"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M14.5 1.5L0.5 6.5L4.5 8.5L10.5 4.5L6.5 9.5L12.5 13.5L14.5 1.5Z"
                stroke="currentColor"
                strokeLinejoin="round"
            />
        </Box>
    )
}
