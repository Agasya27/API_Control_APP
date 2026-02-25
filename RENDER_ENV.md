# Environment Variables for Render Deployment

## Backend Service Environment Variables

Set these in Render Dashboard → Backend Service → Environment:

```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend-name.onrender.com
OPENROUTER_API_KEY=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
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

**Important:** Replace `your-frontend-name.onrender.com` with your actual frontend URL after first deployment.

## Frontend Service Environment Variables

Set these in Render Dashboard → Frontend Service → Environment:

```
VITE_API_BASE_URL=https://your-backend-name.onrender.com
```

**Important:** Replace `your-backend-name.onrender.com` with your actual backend URL after first deployment.

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Blueprint on Render
- [ ] Note the URLs assigned to both services
- [ ] Update `CORS_ORIGIN` in backend with frontend URL
- [ ] Update `VITE_API_BASE_URL` in frontend with backend URL
- [ ] Redeploy both services
- [ ] Test the application

## Security Note

For production, consider:
1. Using Render's Secret Files feature for the API key
2. Rotating the OPENROUTER_API_KEY regularly
3. Not committing sensitive keys to git
