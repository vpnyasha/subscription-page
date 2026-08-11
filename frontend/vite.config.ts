// import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'
// import { visualizer } from 'rollup-plugin-visualizer'
// import deadFile from 'vite-plugin-deadfile'
import removeConsole from 'vite-plugin-remove-console'
import webfontDownload from 'vite-plugin-webfont-dl'
import { ViteEjsPlugin } from 'vite-plugin-ejs'
import react from '@vitejs/plugin-react'
import { defineConfig, Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import 'dotenv/config'

const APP_CONFIG_ROUTE = '/assets/.app-config-v2.json'

/**
 * В проде конфиг страницы отдаёт бэкенд, поэтому локально его подменяет этот
 * плагин: фикстура читается из dev-fixtures/ и не попадает в сборку.
 * Сгенерировать её — npm run dev:fixtures.
 */
function devAppConfig(): Plugin {
    return {
        name: 'kimiko-dev-config',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!req.url?.split('?')[0]?.endsWith(APP_CONFIG_ROUTE)) {
                    return next()
                }

                try {
                    const body = readFileSync(
                        new URL('./dev-fixtures/app-config-v2.json', import.meta.url),
                        'utf8'
                    )
                    res.setHeader('Content-Type', 'application/json')
                    res.end(body)
                } catch {
                    res.statusCode = 404
                    res.end('{"error":"run: npm run dev:fixtures"}')
                }
            })
        }
    }
}

export default defineConfig({
    plugins: [
        react(),
        devAppConfig(),
        removeConsole(),
        webfontDownload(undefined, {}),
        ViteEjsPlugin((viteConfig) => {
            if (process.env.NODE_ENV === 'production') {
                return {
                    root: viteConfig.root,
                    panelData: '<%- panelData %>',
                    metaDescription: '<%= metaDescription %>',
                    metaTitle: '<%= metaTitle %>'
                }
            }
            return {
                root: viteConfig.root,
                panelData: process.env.PANEL_DATA,
                metaDescription: process.env.META_DESCRIPTION,
                metaTitle: process.env.META_TITLE
            }
        })
    ],
    optimizeDeps: {
        include: ['html-parse-stringify']
    },
    build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'icons',
                            test: /node_modules[\\/](react-icons|@tabler[\\/]icons-react)[\\/]/
                        },
                        {
                            name: 'date',
                            test: /node_modules[\\/]dayjs[\\/]/
                        },
                        {
                            name: 'react',
                            test: /node_modules[\\/](react|zustand|react-dom|react-router|react-error-boundary)[\\/]/
                        },
                        {
                            name: 'mantine',
                            test: /node_modules[\\/]@mantine[\\/](core|hooks|nprogress|notifications|modals)[\\/]/
                        },
                        {
                            name: 'i18n',
                            test: /node_modules[\\/](i18next-browser-languagedetector|@remnawave[\\/](backend-contract|subscription-page-types))[\\/]/
                        }
                    ]
                }
            }
        }
    },
    server: {
        host: '0.0.0.0',
        port: 3334,
        cors: false,
        strictPort: true,
        allowedHosts: true
    },
    resolve: { tsconfigPaths: true }
})
