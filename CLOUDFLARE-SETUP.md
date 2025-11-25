# Cloudflare Security Headers Setup

**CRITICAL:** Add these HTTP response headers via Cloudflare Transform Rules

## Step-by-Step Instructions

### 1. Login to Cloudflare Dashboard
- Go to: https://dash.cloudflare.com
- Select: `nimbleresolve.com`

### 2. Navigate to Transform Rules
- Click: **Rules** (left sidebar)
- Click: **Transform Rules**
- Click: **Modify Response Header**
- Click: **Create rule**

### 3. Create Rule: "Security Headers"

**Rule name:** `Add Security Headers`

**When incoming requests match:**
- Field: `Hostname`
- Operator: `equals`
- Value: `nimbleresolve.com`

**Then:**
Click **+ Set static** for each header below:

---

#### Header 1: Strict-Transport-Security (HSTS) ⚠️ CRITICAL

**Action:** Set static
**Header name:** `Strict-Transport-Security`
**Value:** `max-age=31536000; includeSubDomains; preload`

**What it does:**
- Forces HTTPS for 1 year (31536000 seconds)
- Applies to all subdomains
- Eligible for browser preload list

⚠️ **WARNING:** Once enabled, you MUST keep HTTPS working. Don't enable if you might disable HTTPS.

---

#### Header 2: Content-Security-Policy

**Action:** Set static
**Header name:** `Content-Security-Policy`
**Value:** `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://assets.calendly.com https://api.web3forms.com https://fonts.googleapis.com https://cdnjs.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.web3forms.com https://www.google-analytics.com https://soft-hat-6547.nimbleresolve.workers.dev https://cloudflareinsights.com https://static.cloudflareinsights.com; frame-src https://calendly.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com; upgrade-insecure-requests`

**What it does:**
- Prevents XSS attacks by whitelisting allowed sources
- Same policy as your meta tag (line 16) but stronger
- Added `upgrade-insecure-requests` directive

**Why HTTP header instead of meta tag:**
- Can't be bypassed by injected scripts
- Applied before any page parsing
- Industry best practice

---

#### Header 3: X-Content-Type-Options

**Action:** Set static
**Header name:** `X-Content-Type-Options`
**Value:** `nosniff`

**What it does:**
- Prevents MIME type sniffing attacks
- You have this in meta tag, but HTTP header is better

---

#### Header 4: X-Frame-Options

**Action:** Set static
**Header name:** `X-Frame-Options`
**Value:** `DENY`

**What it does:**
- Prevents clickjacking attacks
- You have this in meta tag, but HTTP header is better

---

#### Header 5: Referrer-Policy

**Action:** Set static
**Header name:** `Referrer-Policy`
**Value:** `strict-origin-when-cross-origin`

**What it does:**
- Controls what referrer information is sent
- Privacy protection

---

#### Header 6: Permissions-Policy

**Action:** Set static
**Header name:** `Permissions-Policy`
**Value:** `geolocation=(), microphone=(), camera=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`

**What it does:**
- Disables unnecessary browser features
- Reduces attack surface
- You have this in meta tag, but HTTP header is proper way

---

### 3b. Create Rule: "Secure Cookies" (CRITICAL for Cookie Security)

**⚠️ IMPORTANT:** This fixes the `Set-Cookie` header missing `HttpOnly` flag vulnerability.

**Method 1: Using Cloudflare Transform Rules (Recommended)**

1. Go to **Rules** → **Transform Rules** → **Modify Response Header**
2. Click **Create rule**
3. **Rule name:** `Add HttpOnly to Cookies`
4. **When incoming requests match:**
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `nimbleresolve.com`
5. **Then:**
   - Click **+ Set static**
   - **Action:** Set static
   - **Header name:** `Set-Cookie`
   - **Value:** Click the **dynamic expression** button (</> icon) and use:
     ```
     concat(http.response.headers["Set-Cookie"][0], "; HttpOnly; Secure; SameSite=Strict")
     ```
   - **Note:** If multiple Set-Cookie headers exist, you may need to create separate rules or use a Worker

**Method 2: Using Cloudflare Worker (More Flexible)**

If Transform Rules don't work, create a Worker that runs on your main domain:

1. Go to **Workers & Pages** → **Create application** → **Create Worker**
2. Name it: `cookie-secure`
3. Paste this code:

```javascript
export default {
  async fetch(request, env) {
    // Fetch the original response
    const response = await fetch(request);
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response);
    
    // Get all Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    
    // Remove old Set-Cookie headers
    newResponse.headers.delete('Set-Cookie');
    
    // Add HttpOnly, Secure, and SameSite to each cookie
    setCookieHeaders.forEach(cookie => {
      let secureCookie = cookie;
      
      // Add HttpOnly if not present
      if (!secureCookie.includes('HttpOnly')) {
        secureCookie += '; HttpOnly';
      }
      
      // Add Secure if not present
      if (!secureCookie.includes('Secure')) {
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
```

4. Deploy the worker
5. Go to **Workers & Pages** → **Routes** → **Add route**
6. Set route: `nimbleresolve.com/*`
7. Select worker: `cookie-secure`

**What it does:**
- Adds `HttpOnly` flag to all cookies (prevents JavaScript access)
- Adds `Secure` flag (cookies only sent over HTTPS)
- Adds `SameSite=Strict` (prevents CSRF attacks)
- Fixes security vulnerability: "Set-Cookie header missing HttpOnly flag"

**Why this matters:**
- Without `HttpOnly`, cookies can be accessed by JavaScript (XSS risk)
- Without `Secure`, cookies sent over HTTP (man-in-the-middle risk)
- Without `SameSite`, cookies vulnerable to CSRF attacks

---

### 4. Save and Deploy

- Click **Deploy** button
- Changes are instant (takes ~30 seconds globally)

---

## After Deployment: Verify Headers

### Method 1: Browser DevTools
```
1. Open DevTools (F12)
2. Network tab
3. Visit https://nimbleresolve.com
4. Click first request
5. Check Response Headers section
```

### Method 2: Command Line
```bash
curl -I https://nimbleresolve.com
```

Should show:
```
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src...
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=()...
set-cookie: cookiename=value; HttpOnly; Secure; SameSite=Strict
```

**Verify Cookie Security:**
```bash
curl -I https://nimbleresolve.com | grep -i set-cookie
```

Should show cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` flags.

### Method 3: Security Headers Checker
```
Visit: https://securityheaders.com
Enter: nimbleresolve.com
Target Grade: A or A+
```

---

## Expected Results

### Before (Current):
- **Grade:** C or D
- **Missing:** HSTS, proper CSP, proper Permissions-Policy
- **Risk:** Downgrade attacks, XSS vulnerabilities

### After (With Headers):
- **Grade:** A or A+
- **Protected:** HTTPS enforcement, XSS prevention, clickjacking prevention
- **Bonus:** Better SEO (Google favors HSTS sites)

---

## Cleanup: Remove Redundant Meta Tags (Optional)

After adding HTTP headers via Cloudflare, you can optionally remove these meta tags from `index.html` (they're now redundant):

```html
<!-- Can remove lines 17-20 after Cloudflare headers are active -->
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="...">
```

**KEEP the CSP meta tag** as a fallback until you verify Cloudflare headers are working.

---

## Important Notes

### HSTS Considerations:
- ⚠️ **CRITICAL:** HSTS forces HTTPS for 1 year
- Don't enable if you might disable SSL
- Once enabled, can't easily undo (users' browsers will cache it)
- GitHub Pages always uses HTTPS, so you're safe

### CSP Strict Mode (Future Enhancement):
Current CSP uses `'unsafe-inline'` for scripts/styles. To strengthen:
1. Remove `'unsafe-inline'`
2. Add nonces or hashes for inline scripts
3. Move inline styles to external CSS

**For now:** Current CSP is good - prevents external script injection

### Permissions-Policy vs Feature-Policy:
- `Permissions-Policy` is the new standard
- Replaces old `Feature-Policy` header
- Some browsers still recognize both (we use new standard)

---

## Testing Checklist

After enabling headers, test:

- [ ] Homepage loads correctly: https://nimbleresolve.com
- [ ] Forms submit successfully (test contact form)
- [ ] Google Analytics still tracks (check console for errors)
- [ ] Calendly embeds still work (if used)
- [ ] Check securityheaders.com shows A/A+ grade
- [ ] **Verify cookies have HttpOnly flag** (check DevTools → Application → Cookies)
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile site works correctly

---

## Troubleshooting

### If site breaks after adding headers:

1. **CSP errors in console:**
   - Check browser DevTools console
   - Look for "Content Security Policy" violations
   - Add missing sources to CSP header in Cloudflare

2. **Forms don't submit:**
   - Verify `form-action 'self' https://api.web3forms.com` in CSP
   - Check network tab for blocked requests

3. **Analytics not tracking:**
   - Verify Google Analytics domains in `script-src` and `connect-src`
   - Check console for CSP violations

4. **Emergency rollback:**
   - Go to Cloudflare → Rules → Transform Rules
   - Toggle off "Add Security Headers" rule
   - Headers will stop being added immediately

---

## Additional Resources

- **HSTS Preload:** https://hstspreload.org/
- **CSP Evaluator:** https://csp-evaluator.withgoogle.com/
- **Header Checker:** https://securityheaders.com/
- **MDN CSP Guide:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

**Last Updated:** 2025-11-09
**Status:** Pending implementation
**Priority:** HIGH - Critical security headers missing
