# Pickup Line Generator

## Overview
A simple Pickup Line Generator that uses a Netlify Function + OpenAI to create a witty, shareable pickup line tailored to a given context or audience. Rate-limited to 3 requests per IP per day.

### Frontend
- `index.html`: Contains the UI (textarea, button, result display).
- Embed in WordPress (Custom HTML) or host anywhere.

### Backend
- `netlify/functions/generatePickupLine.js`: Netlify Function implementing CORS, rate-limiting, and calling OpenAI.

### Dependencies
- `node-fetch` for HTTP requests to OpenAI.

## Deployment

1. Push these files to your Git repository linked with Netlify.
2. Set the `OPENAI_API_KEY` in Netlify Dashboard → Site settings → Build & deploy → Environment variables.
3. Deploy on Netlify.
4. Embed `index.html` in your site or use as a static page.

## Usage

- Type a context (e.g., “coffee shop crush”).
- Click “Generate Pickup Line”.
- Copy the generated pickup line.

## Rate Limiting
Max 3 pickup lines per day per IP.  

