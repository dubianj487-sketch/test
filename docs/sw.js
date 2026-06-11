self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data.json(); } catch(e) {
    data = { title: 'SILDE', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SILDE', {
      body: data.body || '',
      icon: './favicon.ico',
      badge: './favicon.ico',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) { list[i].focus(); return; }
      }
      return clients.openWindow('./');
    })
  );
});
