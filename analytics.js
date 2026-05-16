/**
 * Vercel Web Analytics Initialization
 * This script injects Vercel Web Analytics tracking into the page
 */

// Load the @vercel/analytics package from CDN
(async function initAnalytics() {
  try {
    // Import the inject function from unpkg CDN
    const { inject } = await import('https://cdn.jsdelivr.net/npm/@vercel/analytics@2.0.1/dist/index.mjs');
    
    // Inject Vercel Analytics with automatic mode detection
    inject({
      mode: 'auto', // Automatically detects production/development
      debug: true   // Enable debug logging in development
    });
    
    console.log('Vercel Web Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Vercel Web Analytics:', error);
  }
})();
