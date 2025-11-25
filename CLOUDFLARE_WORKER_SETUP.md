# Cloudflare Worker Setup Guide

This guide shows you how to set up a Cloudflare Worker as a secure proxy between your form and Airtable. **Your API key stays on Cloudflare's servers - never exposed to browsers!**

## Why Use Cloudflare Workers?

✅ **Secure**: API key never exposed to browsers  
✅ **Free**: 100,000 requests/day free tier  
✅ **Fast**: Runs on Cloudflare's global network  
✅ **Simple**: No server to manage  

## Step-by-Step Setup

### 1. Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for free account (no credit card needed)
3. Verify your email

### 2. Create a Worker

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click **Create application** → **Create Worker**
3. Name it: `airtable-proxy` (or any name you like)
4. Click **Deploy**

### 3. Add Your Code

1. In the Worker editor, **delete all the default code**
2. Copy the entire contents of `cloudflare-worker.js` from this repo
3. Paste it into the Worker editor
4. Click **Save and deploy**

### 4. Add Environment Variables (Secrets)

Your Airtable credentials go here - they're encrypted and never exposed:

1. In your Worker, go to **Settings** tab
2. Scroll to **Environment Variables**
3. Click **Add variable** for each:

   **Variable 1:**
   - Name: `AIRTABLE_BASE_ID`
   - Value: `appTZRk0ohfz9eEEB` (your Base ID)
   - Type: Encrypted

   **Variable 2:**
   - Name: `AIRTABLE_API_KEY`
   - Value: `pat...` (your Airtable Personal Access Token - get from https://airtable.com/account)
   - Type: Encrypted

   **Variable 3:**
   - Name: `AIRTABLE_TABLE_ID`
   - Value: `tblADRuStujGzFk6v` (your Table ID)
   - Type: Encrypted

4. Click **Save**

### 5. Get Your Worker URL

1. Go back to **Workers & Pages** → Your worker
2. You'll see a URL like: `https://airtable-proxy.your-subdomain.workers.dev`
3. **Copy this URL** - you'll need it for step 6

### 6. Update Your Site Config

1. Edit `assets/js/config.js`
2. Add your Worker URL:

```javascript
AIRTABLE: {
  WORKER_URL: 'https://airtable-proxy.your-subdomain.workers.dev',
},
```

### 7. Test It!

1. Submit a test form on your site
2. Check your Airtable base - you should see a new record
3. Check browser console (F12) - should see "Successfully synced to Airtable"

## Security Settings (Optional but Recommended)

### Restrict CORS to Your Domain

In `cloudflare-worker.js`, change this line:

```javascript
'Access-Control-Allow-Origin': '*',
```

To:

```javascript
'Access-Control-Allow-Origin': 'https://nimbleresolve.com',
```

This prevents other sites from using your Worker.

### Add Rate Limiting

Cloudflare Workers have built-in rate limiting. You can also add custom logic in the Worker code to limit requests per IP.

## Troubleshooting

### Worker returns 500 error

- Check that all 3 environment variables are set correctly
- Check Worker logs: **Workers & Pages** → Your worker → **Logs** tab
- Verify your Airtable API key has permissions to create records

### CORS errors in browser

- **IMPORTANT**: Make sure you've deployed the latest `cloudflare-worker.js` code (it handles OPTIONS preflight correctly)
- The Worker now handles OPTIONS requests BEFORE checking POST method (critical for CORS)
- Check that your domain matches the `Access-Control-Allow-Origin` header
- Verify OPTIONS requests return 204 status with proper CORS headers
- Check Worker logs: **Workers & Pages** → Your worker → **Logs** tab

### Form works but no records in Airtable

- Check Worker logs for errors
- Verify environment variables are set (they're case-sensitive)
- Test Worker directly: Use curl or Postman to POST to Worker URL

### Test Worker Directly

```bash
curl -X POST https://your-worker-url.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company"
  }'
```

Should return: `{"success":true,"message":"Record created successfully"}`

## Cost

**Free Tier:**
- 100,000 requests/day
- Unlimited requests on paid plan ($5/month)

For a lead gen form, the free tier is more than enough!

## Next Steps

Once working:
1. ✅ Monitor Worker logs for any errors
2. ✅ Check Airtable for new records
3. ✅ Consider restricting CORS to your domain
4. ✅ Set up alerts if needed (Cloudflare can email on errors)

---

**Questions?** Check Cloudflare Worker logs or browser console for detailed error messages.

