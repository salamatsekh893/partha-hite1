// This file serves as the main entry point for hosting providers like Hostinger/cPanel/Passenger
// It is fully compatible with both CommonJS (require) and ES Modules (import) to avoid 503 startup crashes.
(async () => {
  try {
    if (typeof require !== 'undefined') {
      require('./dist/server.cjs');
    } else {
      await import('./dist/server.cjs');
    }
  } catch (error) {
    console.error('Failed to load server bundle:', error);
  }
})();
