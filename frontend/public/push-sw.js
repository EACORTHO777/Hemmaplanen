// Loaded into the PWA's service worker (see workbox.importScripts in vite.config.ts).
// Shows notifications sent by the Hemmaplanen API, and opens the app when one is tapped.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Hemmaplanen", {
      body: data.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
