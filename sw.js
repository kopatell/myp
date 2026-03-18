/**
 * Умный Service Worker для обхода ограничений IPTV (Referer/Origin/UA)
 * Поддерживает авто-определение разделителей | и %7C
 */

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    let url = event.request.url;

    // Проверяем наличие разделителя (обычного или закодированного)
    if (url.includes('|') || url.includes('%7C')) {
        // Заменяем %7C на | для удобства обработки
        const cleanUrl = url.replace(/%7C/g, '|');
        const parts = cleanUrl.split('|');
        
        const targetUrl = parts[0]; // Чистая ссылка на видео
        const rawParams = parts[1].replace(/&amp;/g, '&');
        const headerParams = new URLSearchParams(rawParams);

        // Создаем объект заголовков
        const newHeaders = new Headers(event.request.headers);

        // Автоматически переносим ВСЕ параметры из ссылки в заголовки запроса
        headerParams.forEach((value, key) => {
            // Переводим ключи в правильный регистр (напр. user-agent -> User-Agent)
            const normalizedKey = key.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join('-');
            
            newHeaders.set(normalizedKey, value);
        });

        // Формируем модифицированный запрос
        // Используем mode: 'cors' для имитации обычного браузерного запроса
        const modifiedRequest = new Request(targetUrl, {
            method: event.request.method,
            headers: newHeaders,
            mode: 'cors', 
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        });

        event.respondWith(
            fetch(modifiedRequest).catch(err => {
                console.error('SW Fetch Error:', err);
                // Если произошла ошибка CORS, пробуем запросить без доп. параметров
                return fetch(targetUrl);
            })
        );
    }
});
