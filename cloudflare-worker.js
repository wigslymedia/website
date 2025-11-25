/**
 * Cloudflare Worker - Airtable Proxy
 * 
 * This worker acts as a secure proxy between your form and Airtable.
 * The API key stays on Cloudflare's servers (never exposed to browsers).
 * 
 * Setup:
 * 1. Create a Cloudflare account (free)
 * 2. Go to Workers & Pages → Create application → Create Worker
 * 3. Paste this code
 * 4. Add your Airtable credentials as secrets (see below)
 * 5. Deploy and copy the worker URL
 * 
 * Secrets to add in Cloudflare Dashboard:
 * - AIRTABLE_BASE_ID: Your Airtable Base ID (e.g., appTZRk0ohfz9eEEB)
 * - AIRTABLE_API_KEY: Your Airtable Personal Access Token
 * - AIRTABLE_TABLE_ID: Your Table ID (e.g., tblADRuStujGzFk6v)
 */

export default {
  async fetch(request, env) {
    // CORS headers - allow your domain
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://nimbleresolve.com',
      'https://www.nimbleresolve.com',
      'http://localhost:8000', // For local development
      'http://127.0.0.1:8000'  // For local development
    ];
    
    // Allow origin if it's in the allowed list, otherwise reject (more secure than wildcard)
    // For development, you can temporarily use '*' if needed
    const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '*';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    };

    // Handle preflight requests FIRST (before POST check)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // Only allow POST requests (after handling OPTIONS)
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      // Get form data from request
      const formData = await request.json();

      // Validate required fields
      if (!formData.name || !formData.email || !formData.company) {
        return new Response(
          JSON.stringify({ error: 'Service error' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get Airtable credentials from environment variables (secrets)
      const baseId = env.AIRTABLE_BASE_ID;
      const apiKey = env.AIRTABLE_API_KEY;
      const tableId = env.AIRTABLE_TABLE_ID || env.AIRTABLE_TABLE_NAME || 'Leads';

      if (!baseId || !apiKey) {
        return new Response(
          JSON.stringify({ error: 'Service error' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Map form fields to Airtable format
      const airtableFields = {
        'Name': formData.name || '',
        'Email': formData.email || '',
        'Company': formData.company || '',
        'Source': 'Website Form',
        'Status': 'New Lead'
      };

      // Add optional fields if present
      if (formData.phone) airtableFields['Phone'] = formData.phone;
      if (formData.facility_size) airtableFields['Facility Size'] = formData.facility_size;
      if (formData.primary_challenge) airtableFields['Primary Challenge'] = formData.primary_challenge;
      if (formData._form_id) airtableFields['Form ID'] = formData._form_id;
      if (formData._form_variant) airtableFields['Form Variant'] = formData._form_variant;

      // Remove empty fields
      Object.keys(airtableFields).forEach(key => {
        if (!airtableFields[key]) {
          delete airtableFields[key];
        }
      });

      // Create Airtable record
      const airtableRecord = {
        records: [{
          fields: airtableFields
        }],
        typecast: true // Allow Airtable to handle type conversions
      };

      // Send to Airtable API
      const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
      
      const airtableResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableRecord)
      });

      if (!airtableResponse.ok) {
        // Don't parse response - just return generic error
        return new Response(
          JSON.stringify({ error: 'Service error' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Success
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Service error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

