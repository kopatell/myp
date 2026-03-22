/**
 * Умный Service Worker для обхода ограничений IPTV
 * Очищает URL от спец-заголовков перед запросом
 */

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    let url = event.request.url;

    // Если в ссылке есть разделитель заголовков
    if (url.includes('|') || url.includes('%7C')) {
        const cleanUrl = url.replace(/%7C/g, '|');
        const parts = cleanUrl.split('|');
        const targetUrl = parts[0]; // Чистая ссылка на поток

        // Мы не пытаемся установить User-Agent здесь, так как браузер это заблокирует.
        // Мы просто перенаправляем запрос на чистый URL.
        // На ПК это подхватит Tampermonkey и добавит нужные заголовки.
        
        const modifiedRequest = new Request(targetUrl, {
            method: event.request.method,
            headers: event.request.headers,
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        });

        event.respondWith(
            fetch(modifiedRequest).catch(err => {
                console.error('SW Proxy Error:', err);
                return fetch(targetUrl);
            })
        );
    }
});
