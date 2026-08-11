import { CSSVariablesResolver, v8CssVariablesResolver } from '@mantine/core'

import { kimikoColors } from './palette'

/**
 * Поверх стандартного резолвера Mantine доопределяет семантику Kimiko:
 * фон страницы темнее поверхностей, тексты — графитовые, границы — тёплые.
 *
 * Собственные токены (--kimiko-*) объявлены здесь, а не в global.css, чтобы
 * палитра оставалась единственным источником правды и для CSS, и для TS.
 */
export const kimikoCssVariablesResolver: CSSVariablesResolver = (theme) => {
    const base = v8CssVariablesResolver(theme)

    return {
        ...base,
        variables: {
            ...base.variables,
            '--kimiko-accent': kimikoColors.accent,
            '--kimiko-accent-soft': 'rgba(140, 47, 42, 0.1)',
            '--kimiko-accent-soft-hover': 'rgba(140, 47, 42, 0.16)',
            '--kimiko-border': kimikoColors.border,
            '--kimiko-border-strong': kimikoColors.borderStrong,
            '--kimiko-shadow': 'rgba(43, 39, 36, 0.06)',
            '--kimiko-shadow-strong': 'rgba(43, 39, 36, 0.12)',
            '--kimiko-surface': kimikoColors.surface,
            '--kimiko-surface-hover': kimikoColors.surfaceHover,
            '--kimiko-surface-raised': kimikoColors.surfaceRaised,
            '--kimiko-surface-raised-solid': kimikoColors.surfaceRaisedSolid,
            '--kimiko-surface-solid': kimikoColors.surfaceSolid,
            '--kimiko-track': kimikoColors.track
        },
        light: {
            ...base.light,
            '--mantine-color-body': kimikoColors.body,
            '--mantine-color-default': kimikoColors.surfaceSolid,
            '--mantine-color-default-border': kimikoColors.border,
            '--mantine-color-default-color': kimikoColors.text,
            '--mantine-color-default-hover': kimikoColors.surfaceHover,
            '--mantine-color-dimmed': kimikoColors.dimmed,
            '--mantine-color-text': kimikoColors.text
        }
    }
}
