/**
 * Cloudflare Worker - Cookie Security
 * 
 * This worker adds HttpOnly, Secure, and SameSite flags to all Set-Cookie headers
 * to fix the security vulnerability: "Set-Cookie header missing HttpOnly flag"
 * 
 * Setup:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create application → Create Worker
 * 2. Name it: cookie-secure
 * 3. Paste this code
 * 4. Deploy the worker
 * 5. Go to Workers & Pages → Routes → Add route
 * 6. Set route: nimbleresolve.com/*
 * 7. Select worker: cookie-secure
 * 
 * What it does:
 * - Adds HttpOnly flag (prevents JavaScript access, protects against XSS)
 * - Adds Secure flag (cookies only sent over HTTPS)
 * - Adds SameSite=Strict (prevents CSRF attacks)
 */

export default {
  async fetch(request, env) {
    // Fetch the original response
    const response = await fetch(request);
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response);
    
    // Get all Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    
    // If no cookies, return response as-is
    if (setCookieHeaders.length === 0) {
      return response;
    }
    
    // Remove old Set-Cookie headers
    newResponse.headers.delete('Set-Cookie');
    
    // Add HttpOnly, Secure, and SameSite to each cookie
    setCookieHeaders.forEach(cookie => {
      let secureCookie = cookie;
      
      // Add HttpOnly if not present
      if (!secureCookie.includes('HttpOnly')) {
        secureCookie += '; HttpOnly';
      }
      
      // Add Secure if not present (only if HTTPS)
      if (request.url.startsWith('https://') && !secureCookie.includes('Secure')) {
        secureCookie += '; Secure';
      }
      
      // Add SameSite if not present
      if (!secureCookie.match(/SameSite=\w+/i)) {
        secureCookie += '; SameSite=Strict';
      }
      
      newResponse.headers.append('Set-Cookie', secureCookie);
    });
    
    return newResponse;
  }
};


