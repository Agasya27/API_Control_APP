# Deploy to Render

This guide will help you deploy the API Insight Studio to Render using Docker.

## Prerequisites

- A [Render account](https://render.com) (free tier available)
- Your code pushed to a GitHub repository

## Deployment Steps

### 1. Push your code to GitHub

Make sure all your Docker files are committed:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create a new Blueprint on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

### 3. Configure Environment Variables

Before deploying, you need to set these environment variables in Render:

#### For Backend Service (`api-insight-backend`):

- **CORS_ORIGIN**: The URL of your frontend (e.g., `https://api-insight-frontend.onrender.com`)
  - You'll get this URL after the first deployment, then update it
- **OPENROUTER_API_KEY**: Your OpenRouter API key (from server/.env)
  - Get it from https://openrouter.ai/

#### For Frontend Service (`api-insight-frontend`):

- **VITE_API_BASE_URL**: The URL of your backend (e.g., `https://api-insight-backend.onrender.com`)
  - You'll get this URL after the first deployment

### 4. Deploy

1. Click **"Apply"** to start the deployment
2. Render will build and deploy both services
3. Wait for both services to show "Live" status (5-10 minutes)

### 5. Update Environment Variables (Important!)

After the first deployment:

1. Go to **Backend Service** → **Environment** → Edit **CORS_ORIGIN**
   - Set it to your frontend URL: `https://your-frontend-name.onrender.com`
   
2. Go to **Frontend Service** → **Environment** → Edit **VITE_API_BASE_URL**
   - Set it to your backend URL: `https://your-backend-name.onrender.com`

3. **Redeploy both services** for changes to take effect:
   - Click **"Manual Deploy"** → **"Deploy latest commit"** on each service

### 6. Access Your Application

Once both services are live, visit your frontend URL:
- Frontend: `https://your-frontend-name.onrender.com`
- Backend API: `https://your-backend-name.onrender.com`

## Troubleshooting

### Services won't start

Check the logs:
- Click on the service name
- Go to the **"Logs"** tab
- Look for error messages

### CORS errors in browser

Make sure:
1. Backend's `CORS_ORIGIN` matches your frontend URL exactly (including https://)
2. You redeployed the backend after updating the variable

### Frontend can't reach backend

Make sure:
1. Frontend's `VITE_API_BASE_URL` is set to the backend URL
2. You redeployed the frontend after updating the variable
3. The backend service is healthy (check /health endpoint)

### Free tier limitations

Render's free tier:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month of runtime

## Manual Deployment Alternative

If you prefer to deploy services individually:

### Deploy Backend:

```bash
# In Render Dashboard
New + → Web Service
- Connect repository
- Name: api-insight-backend
- Runtime: Docker
- Dockerfile Path: ./server/Dockerfile
- Docker Context: ./server
- Add environment variables (see above)
```

### Deploy Frontend:

```bash
# In Render Dashboard
New + → Web Service
- Connect repository
- Name: api-insight-frontend
- Runtime: Docker
- Dockerfile Path: ./Dockerfile
- Docker Context: .
- Add environment variables (see above)
```

## Update Deployment

To deploy changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically detect the changes and redeploy.

## Custom Domain (Optional)

1. Go to your service → **Settings**
2. Scroll to **Custom Domain**
3. Add your domain
4. Update DNS records as instructed
5. Update environment variables with your new domain
6. Redeploy services

## Cost Optimization

For production:
- Upgrade to paid tier ($7/month per service) to avoid spin-down
- Enable auto-scaling if needed
- Monitor usage in Render dashboard
