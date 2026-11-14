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
                            const mod = await server.ssrLoadModule('./server/chat.ts');
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

                            const mod = await server.ssrLoadModule('./server/chat.ts');
                            const webReq = new Request('http://127.0.0.1:5173/api/chat', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(req.headers['authorization'] ? { Authorization: req.headers['authorization'] } : {}),
                                },
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

                if (url.startsWith('/api/module-studio')) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mentor-id');

                    if (req.method === 'OPTIONS') {
                        res.statusCode = 204;
                        res.end();
                        return;
                    }

                    try {
                        let body = '';
                        for await (const chunk of req) {
                            body += chunk;
                        }

                        const mod = await server.ssrLoadModule('./server/moduleStudioApi.ts');
                        const fullUrl = `http://127.0.0.1:5173${req.url}`;
                        const webReq = new Request(fullUrl, {
                            method: req.method,
                            headers: {
                                'Content-Type': 'application/json',
                                ...(req.headers['authorization'] ? { Authorization: req.headers['authorization'] } : {}),
                                ...(req.headers['x-mentor-id'] ? { 'x-mentor-id': req.headers['x-mentor-id'] } : {}),
                            },
                            body: req.method === 'POST' ? body : undefined,
                        });

                        const webRes = await mod.handleModuleStudioRequest(webReq);
                        res.statusCode = webRes.status || 200;
                        webRes.headers.forEach((val, key) => {
                            res.setHeader(key, val);
                        });
                        const text = await webRes.text();
                        res.end(text);
                    } catch (err) {
                        console.error('[Module Studio API Error]:', err);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: err.message }));
                    }
                    return;
                }
                next();
            });
        },
    };
}

function htmlProxyPlugin() {
    return {
        name: 'vite-laravel-html-proxy',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const accept = req.headers.accept || '';
                const url = req.url ? req.url.split('?')[0] : '';

                // Do not intercept Vite internals, assets, or chat API
                const isInternal = url.startsWith('/@') || 
                                   url.startsWith('/resources/') || 
                                   url.startsWith('/node_modules/') || 
                                   url.startsWith('/vendor/') ||
                                   url.startsWith('/api/chat') ||
                                   url.startsWith('/api/module-studio') ||
                                   url.endsWith('.js') || 
                                   url.endsWith('.css') || 
                                   url.endsWith('.svg') || 
                                   url.endsWith('.png') || 
                                   url.endsWith('.jpg') || 
                                   url.endsWith('.ico') || 
                                   url.endsWith('.json') ||
                                   url.endsWith('.woff') ||
                                   url.endsWith('.woff2') ||
                                   url.endsWith('.ttf');

                if (isInternal) {
                    return next();
                }

                // If it's an API route (e.g. /api/modules, /api/profile), forward to Laravel
                if (url.startsWith('/api/')) {
                    try {
                        const targetUrl = `http://127.0.0.1:8000${req.url}`;
                        let reqBody = undefined;
                        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                            const chunks = [];
                            for await (const chunk of req) {
                                chunks.push(chunk);
                            }
                            reqBody = Buffer.concat(chunks);
                        }
                        const proxyRes = await fetch(targetUrl, {
                            method: req.method,
                            headers: {
                                ...req.headers,
                                host: '127.0.0.1:8000',
                            },
                            body: reqBody,
                        });
                        res.statusCode = proxyRes.status;
                        proxyRes.headers.forEach((val, key) => {
                            if (key.toLowerCase() !== 'content-encoding') {
                                res.setHeader(key, val);
                            }
                        });
                        const buffer = await proxyRes.arrayBuffer();
                        res.end(Buffer.from(buffer));
                        return;
                    } catch (err) {
                        console.warn('[Vite API Proxy Error]:', err.message);
                        return next();
                    }
                }

                // If it's a page navigation request (GET or HEAD with text/html or root / or route path)
                const isNav = (req.method === 'GET' || req.method === 'HEAD') && (accept.includes('text/html') || url === '/' || !url.includes('.'));
                if (isNav) {
                    try {
                        const targetUrl = `http://127.0.0.1:8000${req.url || '/'}`;
                        const proxyRes = await fetch(targetUrl, {
                            headers: {
                                ...req.headers,
                                host: '127.0.0.1:8000',
                            },
                        });
                        if (proxyRes.ok) {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/html; charset=utf-8');
                            const html = await proxyRes.text();
                            res.end(html);
                            return;
                        }
                    } catch (err) {
                        console.warn('[Vite HTML Proxy Error]:', err.message);
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
        htmlProxyPlugin(),
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

