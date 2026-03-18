/**
 * Service Worker для подмены заголовков IPTV потоков
 */

self.addEventListener('install', (event) => {
    // Немедленная активация при установке
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Берем под контроль все открытые вкладки сразу
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Перехватываем только те запросы, где есть знак трубы "|"
    if (url.includes('|')) {
        const parts = url.split('|');
        const targetUrl = parts[0];
        
        // Очищаем параметры заголовков от возможных html-сущностей
        const rawParams = parts[1].replace(/&amp;/g, '&');
        const headerParams = new URLSearchParams(rawParams);

        // Клонируем исходные заголовки запроса
        const newHeaders = new Headers(event.request.headers);

        // Переносим данные из ссылки в HTTP-заголовки
        headerParams.forEach((value, key) => {
            // Service Worker имеет право перезаписывать Referer и User-Agent
            newHeaders.set(key, value);
        });

        // Формируем новый запрос к серверу провайдера
        const modifiedRequest = new Request(targetUrl, {
            headers: newHeaders,
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        });

        // Отправляем модифицированный запрос и возвращаем ответ плееру
        event.respondWith(
            fetch(modifiedRequest).catch(err => {
                console.error('Ошибка Service Worker при запросе потока:', err);
                // Если произошла ошибка, пробуем запросить как есть
                return fetch(event.request);
            })
        );
    }
});