# Airtable Integration Setup Guide

This guide explains how to connect your Web3Forms submissions to Airtable **without paying for Web3Forms webhooks**.

## How It Works

- **Web3Forms** (free): Handles email delivery to ProtonMail
- **Airtable** (free tier): Stores leads in database via direct API call
- **No webhooks needed**: Data is sent directly from your form JavaScript

## Setup Steps

### 1. Create Your Airtable Base

Use Omni (Airtable AI) with this prompt:

```
Build a CRM database for WiFi assessment lead management:

Base Structure:
- Create a table called "Leads" with these fields:
  - Name (Single line text, required)
  - Email (Email, required)
  - Company (Single line text, required)
  - Phone (Phone number, optional)
  - Facility Size (Single select: "Under 10,000 sq ft", "10,000 - 25,000 sq ft", "25,000 - 50,000 sq ft", "50,000 - 100,000 sq ft", "Over 100,000 sq ft", optional)
  - Primary Challenge (Single select: "Dead zones / Coverage gaps", "RF interference issues", "Dropped connections", "Planning facility expansion", "Performance optimization", "Other", optional)
  - Form ID (Single line text)
  - Form Variant (Single line text)
  - Source (Single line text, default: "Website Form")
  - Status (Single select: "New Lead", "Contacted", "Consultation Scheduled", "Assessment Scheduled", "Converted", "Lost", default: "New Lead")
  - Notes (Long text, optional)

Views:
- "All Leads" - Grid view
- "New Leads" - Filtered: Status = "New Lead", sorted by Created time (newest first)
- "This Week" - Filtered: Created in last 7 days
```

### 2. Get Your Airtable API Credentials

1. Go to https://airtable.com/api
2. Select your base
3. Find your **Base ID** (starts with `app...`)
4. Go to https://airtable.com/account
5. Create a **Personal Access Token**:
   - Click "Create new token"
   - Name it "WiFi Landing Page"
   - Give it access to your base
   - Copy the token (starts with `pat...`)

### 3. Update Your Config File

Edit `assets/js/config.js` and add your credentials:

```javascript
AIRTABLE: {
  BASE_ID: 'appXXXXXXXXXXXXXX', // Your Base ID from step 2
  API_KEY: 'patXXXXXXXXXXXXXX', // Your Personal Access Token from step 2
  TABLE_NAME: 'Leads', // Name of your table (usually "Leads")
},
```

### 4. Test the Integration

1. Submit a test form on your site
2. Check your Airtable base - you should see a new record
3. Check browser console for any errors

## How It Works

When someone submits a form:

1. ✅ Form validates and sanitizes data
2. ✅ Data is sent to Web3Forms (for email to ProtonMail)
3. ✅ **After successful submission**, data is also sent to Airtable API
4. ✅ Airtable stores the lead in your database
5. ✅ User sees success page (even if Airtable fails - non-blocking)

## Troubleshooting

### No records appearing in Airtable?

1. **Check browser console** for errors
2. **Verify credentials** in `config.js`:
   - BASE_ID should start with `app`
   - API_KEY should start with `pat`
   - TABLE_NAME should match exactly (case-sensitive)
3. **Check field names** match exactly (case-sensitive):
   - "Name", "Email", "Company", etc.
4. **Verify Airtable token permissions** - must have access to your base

### Form still works but Airtable fails?

That's expected! The integration is **non-blocking** - form submission succeeds even if Airtable is down. Check console for warnings.

### Want to disable Airtable temporarily?

Edit `assets/js/config.js`:

```javascript
FEATURES: {
  ENABLE_AIRTABLE: false, // Disable Airtable sync
},
```

## Security Notes

- API key is visible in client-side code (this is normal for static sites)
- Airtable Personal Access Tokens can be scoped to specific bases
- Consider using environment variables if deploying via build process
- Rate limiting: Airtable free tier allows 5 requests/second

## Field Mapping

Form fields → Airtable fields:
- `name` → `Name`
- `email` → `Email`
- `company` → `Company`
- `phone` → `Phone`
- `facility_size` → `Facility Size`
- `primary_challenge` → `Primary Challenge`
- `_form_id` → `Form ID`
- `_form_variant` → `Form Variant`
- Always sets `Source` = "Website Form"
- Always sets `Status` = "New Lead"

## Next Steps

Once setup:
1. ✅ Leads automatically sync to Airtable
2. ✅ Set up Airtable automations (notifications, assignments)
3. ✅ Create views for different lead stages
4. ✅ Add custom fields as needed

---

**Questions?** Check browser console for detailed error messages.

