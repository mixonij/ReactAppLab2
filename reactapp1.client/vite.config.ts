import {fileURLToPath, URL} from 'node:url';

import {defineConfig} from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import {env} from 'process';
import {VitePWA} from "vite-plugin-pwa";

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "reactapp1.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], {stdio: 'inherit',}).status) {
        throw new Error("Could not create certificate.");
    }
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7217';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin(),
        VitePWA({
            devOptions: {
                enabled: true,
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5000000, // <---- increasing the file size to cached 5mb
            },
            includeAssets: ['vite.svg', 'Logo-180x180.png', 'Logo-128x128.svg'],
            manifest: {
                name: 'React Lab 2',
                short_name: 'RL2',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'Logo-180x180.svg',
                        sizes: '180x180',
                        type: 'image/png',
                    },
                    {
                        src: 'Logo-192x192.svg',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'Logo-512x512.svg',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/api': {
                target,
                secure: false
            }
        },
        port: 5173,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
