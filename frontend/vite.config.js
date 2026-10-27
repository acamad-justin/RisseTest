import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';

function chatApiPlugin() {
    return {
        name: 'vite-chat-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ? req.url.split('?')[0] : '';
                if (url === '/api/chat') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                    if (req.method === 'OPTIONS') {
                        res.statusCode = 204;
                        res.end();
                        return;
                    }

                    if (req.method === 'GET') {
                        try {
                            const mod = await server.ssrLoadModule('./api/chat.ts');
                            const webRes = await mod.GET();
                            res.statusCode = webRes.status || 200;
                            webRes.headers.forEach((val, key) => {
                                res.setHeader(key, val);
                            });
                            const text = await webRes.text();
                            res.end(text);
                        } catch (err) {
                            console.error('[Chat API GET Error]:', err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: err.message }));
                        }
                        return;
                    }

                    if (req.method === 'POST') {
                        try {
                            let body = '';
                            for await (const chunk of req) {
                                body += chunk;
                            }
                            const json = body ? JSON.parse(body) : {};

                            const mod = await server.ssrLoadModule('./api/chat.ts');
                            const webReq = new Request('http://127.0.0.1:5173/api/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(json),
                            });

                            const webRes = await mod.POST(webReq);

                            res.statusCode = webRes.status || 200;
                            webRes.headers.forEach((val, key) => {
                                res.setHeader(key, val);
                            });

                            if (webRes.body) {
                                const reader = webRes.body.getReader();
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    res.write(value);
                                }
                                res.end();
                            } else {
                                res.end();
                            }
                        } catch (err) {
                            console.error('[Chat API Error]:', err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: err.message }));
                        }
                        return;
                    }
                }
                next();
            });
        },
    };
}

export default defineConfig({
    server: {
        host: '127.0.0.1',
        port: 5173,
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            publicDirectory: '../backend/public',
            refresh: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        chatApiPlugin(),
    ],
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
            '@': path.resolve(process.cwd(), 'resources/js'),
            '@lucide/vue': 'lucide-vue-next',
        },
    },
});

