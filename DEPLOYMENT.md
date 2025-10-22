# Deployment Guide

## Vercel Deployment

### Quick Start

1. **Import your GitHub repository** to Vercel
2. **Configure environment variables** (see below)
3. **Deploy**

### Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | How to Get It |
|----------|-------------|---------------|
| `CLAUDE_API_KEY` | Anthropic Claude API key | Get from [console.anthropic.com](https://console.anthropic.com/) |
| `RECALL_API_KEY` | Recall.ai API key | Get from [recall.ai](https://recall.ai/) dashboard |
| `RECALL_WEBHOOK_SECRET` | Recall webhook secret | Configure in Recall.ai webhook settings |
| `NEXTAUTH_SECRET` | NextAuth session secret | Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Use your Vercel URL: `https://your-app.vercel.app` |

### Step-by-Step Environment Variable Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. For each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `CLAUDE_API_KEY`)
   - Enter the **Value** (your actual API key)
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Getting API Keys

#### Claude API Key
1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

#### Recall.ai API Key
1. Visit https://recall.ai/
2. Sign up or log in
3. Go to your dashboard
4. Find your API key in settings
5. Copy the key

#### Recall Webhook Secret
1. In Recall.ai dashboard, go to Webhooks
2. Create or view your webhook configuration
3. Set webhook URL to: `https://your-app.vercel.app/api/webhook/recall`
4. Copy the webhook secret

#### NextAuth Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

### Troubleshooting

#### "routes cannot be present" error
This has been fixed in the latest commit. Make sure you're deploying from the branch `claude/fix-vercel-routing-config-011CUP35GcyqjUVYSVSjoNSk` or merge it to main first.

#### "Secret does not exist" error
Don't use the `@secret-name` syntax in `vercel.json`. Instead, add environment variables directly in the Vercel dashboard as described above.

#### Environment variables not working
- Make sure you selected all three environments (Production, Preview, Development)
- Redeploy after adding new environment variables
- Check that variable names match exactly (case-sensitive)

### Deployment Checklist

- [ ] All 5 environment variables added in Vercel
- [ ] Latest code merged to main branch
- [ ] `vercel.json` has no `routes` property
- [ ] `vercel.json` has no `env` section
- [ ] Webhook URL configured in Recall.ai
- [ ] First deployment successful
- [ ] Test the application

## Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys in `.env.local`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Support

For issues or questions:
- Check Vercel deployment logs
- Review this deployment guide
- Check `.env.example` for reference
