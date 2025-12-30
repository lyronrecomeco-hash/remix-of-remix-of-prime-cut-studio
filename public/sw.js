/**
 * PACK ENTERPRISE: Service Worker v5 com Versionamento e SkipWaiting
 * Cache otimizado e atualização imediata
 */

const SW_VERSION = '5.0.0';
const BUILD_TIMESTAMP = Date.now();
const STATIC_CACHE = `barber-static-v5-${BUILD_TIMESTAMP}`;
const DYNAMIC_CACHE = 'barber-dynamic-v5';

// Assets estáticos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Padrões de URL que devem usar network-first
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\/functions\//,
  /\/auth\//
];

// Padrões de URL que devem usar cache-first
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/
];

/**
 * Instalação: Cache de assets estáticos
 */
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] Instalando...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log(`[SW v${SW_VERSION}] Cacheando assets estáticos`);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log(`[SW v${SW_VERSION}] SkipWaiting ativado`);
        return self.skipWaiting();
      })
  );
});

/**
 * Ativação: Limpa caches antigos e assume controle
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] Ativando...`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('barber-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log(`[SW v${SW_VERSION}] Removendo cache antigo:`, name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log(`[SW v${SW_VERSION}] Assumindo controle de todos os clientes`);
        return self.clients.claim();
      })
      .then(() => {
        return self.clients.matchAll({ type: 'window' });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
            timestamp: BUILD_TIMESTAMP
          });
        });
      })
  );
});

/**
 * Determina a estratégia de cache baseada na URL
 */
function getCacheStrategy(url) {
  const urlString = url.toString();
  
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(urlString))) {
    return 'network-first';
  }
  
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(urlString))) {
    return 'cache-first';
  }
  
  return 'network-first';
}

/**
 * Estratégia Network-First com fallback para cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log(`[SW v${SW_VERSION}] Rede falhou, buscando do cache:`, request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    throw error;
  }
}

/**
 * Estratégia Cache-First com atualização em background
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, response));
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.ok && request.method === 'GET') {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Intercepta requisições e aplica estratégia apropriada
 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  const strategy = getCacheStrategy(url);
  
  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  console.log(`[SW v${SW_VERSION}] Push recebido`);
  
  let data = {
    title: 'Nova Notificação',
    body: 'Você tem uma nova atualização',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Erro ao parsear push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Clique em notificação
 */
self.addEventListener('notificationclick', (event) => {
  console.log(`[SW v${SW_VERSION}] Notificação clicada`);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Background Sync
 */
self.addEventListener('sync', (event) => {
  console.log(`[SW v${SW_VERSION}] Sync event:`, event.tag);
  
  if (event.tag === 'queue-sync') {
    event.waitUntil(Promise.resolve());
  }
});

/**
 * Mensagens do cliente
 */
self.addEventListener('message', (event) => {
  console.log(`[SW v${SW_VERSION}] Mensagem recebida:`, event.data?.type);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      version: SW_VERSION,
      timestamp: BUILD_TIMESTAMP
    });
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
  
  if (event.data?.type === 'SHOW_NOTIFICATION' && event.data?.payload) {
    const { title, body, icon, url } = event.data.payload;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      data: { url: url || '/' }
    });
  }
});

console.log(`[SW v${SW_VERSION}] Service Worker carregado`);
