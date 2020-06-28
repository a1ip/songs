---
---
const staticCacheName = 'static-cache-v0';
const dynamicCacheName = 'dynamic-cache-v0';

const staticAssets = [
    '{{ "/" | relative_url }}',
    '{{ "/index.html" | relative_url }}',
    '{{ "/alphabet/" | relative_url }}',
    {% for post in site.posts %}'{{ post.url | relative_url }}',{% endfor %}
    '{{ "/images/icons/icon-128x128.png" | relative_url }}',
    '{{ "/images/icons/icon-192x192.png" | relative_url }}',
    '{{ "/offline/" | relative_url }}',
    '{{ "/assets/css/index.css" | relative_url }}',
    '{{ "/assets/css/classes.css" | relative_url }}',
    {% if site.sidebar %}'{{ "/assets/css/sidebar.css" | relative_url }}',{% endif %}
    '{{ "/assets/fontawesome/icons.svg" | relative_url }}',
    '{{ "/js/app.js" | relative_url }}',
    '{{ "/images/no-image.jpg" | relative_url }}'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(staticCacheName);
    await cache.addAll(staticAssets);
    console.log('Service worker has been installed');
});

self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (![staticCacheName, dynamicCacheName].includes(key)) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker has been activated');
});

self.addEventListener('fetch', event => {
    console.log(`Trying to fetch ${event.request.url}`);
    event.respondWith(checkCache(event.request));
});

async function checkCache(req) {
    const cachedResponse = await caches.match(req);
    return cachedResponse || checkOnline(req);
}

async function checkOnline(req) {
    const cache = await caches.open(dynamicCacheName);
    try {
        const res = await fetch(req);
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        const cachedRes = await cache.match(req);
        if (cachedRes) {
            return cachedRes;
        } else if (req.url.indexOf('.html') !== -1) {
            return caches.match('{{ "/offline.html" | relative_url }}');
        } else {
            return caches.match('{{ "/images/no-image.jpg" | relative_url }}');
        }
    }
}
