/*
 * Генерирует данные для локального запуска фронтенда без панели Remnawave:
 *   - dev-fixtures/app-config-v2.json — конфиг страницы, который dev-сервер отдаёт
 *     по тому же адресу, что и бэкенд (см. плагин kimiko-dev-config в vite.config.ts);
 *   - .env с PANEL_DATA — base64 ответа /subscription-info, который бэкенд вшивает в index.html.
 *
 * Файлы намеренно лежат вне public/, иначе фикстура попала бы в dist и поехала в образ.
 *
 * Запуск: npm run dev:fixtures
 */

import { SubscriptionPageRawConfigSchema } from '@remnawave/subscription-page-types'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['ru', 'en']

/*
 * Контурные иконки в стиле Tabler — тем же набором пользуется сама страница.
 * В боевом окружении svgLibrary приходит из панели, здесь это только фикстура.
 */
const stroke = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

// Логотипы платформ читаются только силуэтом, контур из них делает кашу.
const filled = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">${body}</svg>`

const svgLibrary = {
    windows: filled(
        '<path d="M3 5.5l7.5-1v7H3v-6zm0 13l7.5 1v-7H3v6zm8.5 1.2L21 21V12.5h-9.5v7.2zM11.5 3v7.5H21V3l-9.5 1.3z"/>'
    ),
    apple: filled(
        '<path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.5-.1-2.8.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.4-1-2.3-3.7zM14 5.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.7-1.3z"/>'
    ),
    android: filled(
        '<path d="M17.6 9.5l1.6-2.8a.3.3 0 00-.5-.3l-1.6 2.8A9.6 9.6 0 0012 8.3c-1.8 0-3.5.4-5.1 1l-1.6-2.9a.3.3 0 10-.5.3l1.6 2.8A8.4 8.4 0 002 16.4h20a8.4 8.4 0 00-4.4-6.9zM7.5 13.8a.8.8 0 110-1.6.8.8 0 010 1.6zm9 0a.8.8 0 110-1.6.8.8 0 010 1.6z"/>'
    ),
    download: stroke(
        '<path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/><path d="M7 11l5 5 5-5"/><path d="M12 4v12"/>'
    ),
    cloudDownload: stroke(
        '<path d="M19 18a3.5 3.5 0 000-7h-1a5 4.5 0 00-11-2 4.6 4.4 0 00-2.1 8.4"/><path d="M12 13v9"/><path d="M9 19l3 3 3-3"/>'
    ),
    check: stroke('<path d="M5 12l5 5 10-10"/>')
}

const text = (ru, en) => ({ ru, en })

/** Шаг «скачайте приложение» с кнопкой-ссылкой. */
const installBlock = (platformLabel, link, iconKey) => ({
    svgIconKey: 'download',
    svgIconColor: 'cyan',
    title: text('Установка приложения', 'App installation'),
    description: text(
        'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
        'Pick the build for your device, press the button below and install the app.'
    ),
    buttons: [
        {
            link,
            type: 'external',
            text: text(platformLabel, platformLabel),
            svgIconKey: iconKey
        }
    ]
})

/** Шаг «добавьте подписку» — кнопка подставляет ссылку подписки. */
const subscriptionBlock = () => ({
    svgIconKey: 'cloudDownload',
    svgIconColor: 'cyan',
    title: text('Добавление подписки', 'Adding a subscription'),
    description: text(
        'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
        'Press the button below — the app opens and the subscription is added automatically.'
    ),
    buttons: [
        {
            link: 'happ://add/',
            type: 'subscriptionLink',
            text: text('Добавить подписку', 'Add subscription'),
            svgIconKey: 'cloudDownload'
        }
    ]
})

/** Финальный шаг — подключение. */
const connectBlock = () => ({
    svgIconKey: 'check',
    svgIconColor: 'green',
    title: text('Подключение', 'Connecting'),
    description: text(
        'Выберите сервер в списке и нажмите кнопку подключения.',
        'Choose a server from the list and press connect.'
    ),
    buttons: []
})

const app = (name, featured, iconKey, downloadLabel, downloadLink) => ({
    name,
    featured,
    svgIconKey: iconKey,
    blocks: [installBlock(downloadLabel, downloadLink, iconKey), subscriptionBlock(), connectBlock()]
})

const config = {
    version: '1',
    locales: LOCALES,
    brandingSettings: {
        title: 'Kimiko',
        logoUrl: '',
        supportUrl: 'https://t.me/remnawave'
    },
    uiConfig: {
        subscriptionInfoBlockType: 'expanded',
        installationGuidesBlockType: 'cards'
    },
    baseSettings: {
        metaTitle: 'Kimiko — подписка',
        metaDescription: 'Тестовая страница подписки',
        showConnectionKeys: true,
        hideGetLinkButton: false
    },
    baseTranslations: {
        installationGuideHeader: text('Установка', 'Installation'),
        connectionKeysHeader: text('Ключи подключения', 'Connection keys'),
        linkCopied: text('Ссылка скопирована', 'Link copied'),
        linkCopiedToClipboard: text('Ссылка скопирована в буфер обмена', 'Link copied to clipboard'),
        getLink: text('Ссылка на подписку', 'Subscription link'),
        scanQrCode: text('Отсканируйте QR-код', 'Scan the QR code'),
        scanQrCodeDescription: text(
            'Наведите камеру телефона на код, чтобы открыть подписку',
            'Point your phone camera at the code to open the subscription'
        ),
        copyLink: text('Скопировать ссылку', 'Copy link'),
        name: text('Имя пользователя', 'Username'),
        status: text('Статус', 'Status'),
        active: text('Активна', 'Active'),
        inactive: text('Неактивна', 'Inactive'),
        expires: text('Истекает', 'Expires'),
        bandwidth: text('Трафик', 'Bandwidth'),
        scanToImport: text('Отсканируйте для импорта', 'Scan to import'),
        // Дальше подставляется относительный срок (dayjs .fromNow), поэтому
        // предлог в самой строке не нужен: «Истекает» + «через год».
        expiresIn: text('Истекает', 'Expires'),
        expired: text('Истекла', 'Expired'),
        unknown: text('Неизвестно', 'Unknown'),
        indefinitely: text('Бессрочно', 'Indefinitely')
    },
    svgLibrary,
    /*
     * Набор приложений повторяет public/assets/app-config.json из апстрима,
     * чтобы локальная страница была похожа на боевую. Иконки приложений в бою
     * приходят из svgLibrary панели; здесь вместо них иконка платформы.
     */
    platforms: {
        windows: {
            displayName: text('Windows', 'Windows'),
            svgIconKey: 'windows',
            apps: [
                app('FlClashX', false, 'windows', 'Windows', 'https://github.com/chen08209/FlClash'),
                app('Koala Clash', false, 'windows', 'Windows', 'https://github.com/koalaclash'),
                app('Prizrak-Box', false, 'windows', 'Windows', 'https://github.com/prizrak-box'),
                app('Happ', true, 'windows', 'Windows', 'https://happ.su/main/download'),
                app('Clash Verge', false, 'windows', 'Windows', 'https://github.com/clash-verge-rev/clash-verge-rev/releases')
            ]
        },
        macos: {
            displayName: text('macOS', 'macOS'),
            svgIconKey: 'apple',
            apps: [
                app('Happ', true, 'apple', 'App Store', 'https://apps.apple.com/app/id6504287215'),
                app('Koala Clash', false, 'apple', 'GitHub', 'https://github.com/koalaclash'),
                app('FlClashX', false, 'apple', 'GitHub', 'https://github.com/chen08209/FlClash'),
                app('Clash Verge', false, 'apple', 'GitHub', 'https://github.com/clash-verge-rev/clash-verge-rev/releases')
            ]
        },
        ios: {
            displayName: text('iOS', 'iOS'),
            svgIconKey: 'apple',
            apps: [
                app('Happ', true, 'apple', 'App Store', 'https://apps.apple.com/app/id6504287215'),
                app('Stash', false, 'apple', 'App Store', 'https://apps.apple.com/app/id1596063349'),
                app('Streisand', false, 'apple', 'App Store', 'https://apps.apple.com/app/id6450534064'),
                app('Shadowrocket', false, 'apple', 'App Store', 'https://apps.apple.com/app/id932747118')
            ]
        },
        android: {
            displayName: text('Android', 'Android'),
            svgIconKey: 'android',
            apps: [
                app('FlClashX', false, 'android', 'GitHub', 'https://github.com/chen08209/FlClash'),
                app('Clash Meta', false, 'android', 'GitHub', 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases'),
                app('Happ', true, 'android', 'Google Play', 'https://play.google.com/store/apps/details?id=com.happproxy'),
                app('v2rayNG', false, 'android', 'GitHub', 'https://github.com/2dust/v2rayNG/releases')
            ]
        },
        linux: {
            displayName: text('Linux', 'Linux'),
            svgIconKey: 'download',
            apps: [
                app('FlClashX', false, 'download', 'GitHub', 'https://github.com/chen08209/FlClash'),
                app('Koala Clash', false, 'download', 'GitHub', 'https://github.com/koalaclash'),
                app('Clash Verge', false, 'download', 'GitHub', 'https://github.com/clash-verge-rev/clash-verge-rev/releases')
            ]
        }
    }
}

const parsed = SubscriptionPageRawConfigSchema.safeParse(config)

if (!parsed.success) {
    console.error('Конфиг не прошёл валидацию:')
    console.error(JSON.stringify(parsed.error.issues, null, 2))
    process.exit(1)
}

const configPath = path.join(ROOT, 'dev-fixtures/app-config-v2.json')
fs.mkdirSync(path.dirname(configPath), { recursive: true })
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 4)}\n`)

// Подписка: срок — год вперёд, трафик частично израсходован.
const expiresAt = new Date('2027-08-05T12:00:00.000Z')
const shortUuid = 'kimikodev123456'
const subscriptionUrl = `http://localhost:3334/${shortUuid}`

/*
 * Имена серверов percent-encoded — ровно так их отдаёт панель. Бэкенд кладёт
 * подписку в base64, а фронтенд читает её через atob(), который не понимает
 * многобайтовый UTF-8, поэтому сырые эмодзи здесь развалились бы.
 */
const server = (code, host, label) =>
    `vless://11111111-1111-1111-1111-111111111111@${host}:443?type=tcp&security=reality&sni=www.google.com#${encodeURIComponent(`${code} ${label}`)}`

const links = [
    server('🇳🇱', 'nl-1.example.com', 'Netherlands-1'),
    server('🇩🇪', 'de-1.example.com', 'Germany-1'),
    server('🇫🇮', 'fi-1.example.com', 'Finland-1'),
    server('🇯🇵', 'jp-1.example.com', 'Japan-1')
]

const panelData = {
    response: {
        isFound: true,
        user: {
            shortUuid,
            daysLeft: 359,
            trafficUsed: '12.51 GiB',
            trafficLimit: '0',
            lifetimeTrafficUsed: '148.3 GiB',
            trafficUsedBytes: '13432012800',
            trafficLimitBytes: '0',
            lifetimeTrafficUsedBytes: '159254220800',
            username: 'kimiko-dev',
            expiresAt: expiresAt.toISOString(),
            isActive: true,
            userStatus: 'ACTIVE',
            trafficLimitStrategy: 'NO_RESET'
        },
        links,
        ssConfLinks: {},
        subscriptionUrl
    }
}

const envPath = path.join(ROOT, '.env')
const envContent = [
    '# Сгенерировано npm run dev:fixtures — только для локального запуска.',
    `PANEL_DATA=${Buffer.from(JSON.stringify(panelData)).toString('base64')}`,
    `META_TITLE=${config.baseSettings.metaTitle}`,
    `META_DESCRIPTION=${config.baseSettings.metaDescription}`,
    ''
].join('\n')

fs.writeFileSync(envPath, envContent)

console.log(`✅ ${path.relative(ROOT, configPath)}`)
console.log(`✅ ${path.relative(ROOT, envPath)}`)
