// Dynamically determine the base URL so the service worker can be registered
// correctly when the app is served from a sub-path (e.g. GitHub Pages).
// iOS Safari fails to load offline when the scope/path is wrong, so we derive
// the base from the current script location instead of hardcoding "/".
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const currentScript = document.currentScript;
    const base = currentScript && currentScript.src
      ? new URL('.', currentScript.src).pathname
      : '/';

    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.showNotification) {
                window.showNotification('New version available. Refreshing...', 'info');
              }
              setTimeout(() => window.location.reload(), 1000);
            }
          });
        }
      });
    });
  });
}
