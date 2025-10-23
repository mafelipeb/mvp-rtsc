# Deployment Guide

## Quick Start - Using the System

### Creating a Bot for Your Teams Meeting

1. **Go to your deployed app:** https://mvp-rtsc.vercel.app

2. **Get your Teams meeting URL:**
   - In Microsoft Teams, click "Meeting Options" or copy the meeting link
   - URL format: `https://teams.microsoft.com/l/meetup-join/...`

3. **Create the bot:**
   - Paste the Teams URL in the "Start New Coaching Session" section
   - Click "Create Bot & Start Coaching"
   - Wait for success message with Meeting ID

4. **View real-time coaching:**
   - Automatically redirected to dashboard
   - Or manually go to: `https://mvp-rtsc.vercel.app/dashboard/[meeting-id]`
   - Keep dashboard open on second screen during call

5. **During the meeting:**
   - Bot joins and listens silently
   - Real-time transcription with low latency (2-5 seconds)
   - Coaching recommendations appear every 5 seconds
   - Glance at dashboard for AI-powered tips

---

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

## API Endpoints

### Create Bot
**POST** `/api/bot/create`

Create a Recall.ai bot to join a Microsoft Teams meeting.

**Request:**
```json
{
  "meeting_url": "https://teams.microsoft.com/l/meetup-join/...",
  "bot_name": "Sales Coach AI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bot_id": "abc123...",
    "meeting_id": "abc123...",
    "status": "created",
    "dashboard_url": "https://mvp-rtsc.vercel.app/dashboard/abc123"
  }
}
```

### Webhook Endpoint
**POST** `/api/webhook/recall`

Receives real-time events from Recall.ai during meetings.

**Events handled:**
- `bot.status_change` - Bot joined/left meeting
- `transcript.partial` - Real-time partial transcripts (very low latency)
- `transcript.complete` - Complete transcript segments
- `call.ended` - Meeting finished

### Get Coaching Data
**GET** `/api/coaching/[meetingId]?latest=true`

Retrieve latest coaching recommendations for a meeting.

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "abc123",
    "coaching": [...],
    "transcripts": [...],
    "lastUpdate": "2025-10-23T18:00:00Z"
  }
}
```

---

## Architecture Overview

```
Microsoft Teams Meeting (with Recall.ai bot)
    ↓ (real-time audio stream)
Recall.ai Service
    ↓ (webhook POST every 2-5 seconds)
Your App /api/webhook/recall
    ↓ (Claude AI analysis)
Coaching Recommendations Stored
    ↑ (dashboard polls every 5 seconds)
Sales Rep's Dashboard
```

**Key Features:**
- **Low-latency streaming:** `prioritize_low_latency` mode
- **Real-time webhooks:** Events pushed as they happen
- **Frontend polling:** Dashboard updates every 5 seconds
- **Async processing:** Claude AI analysis doesn't block webhooks

---

## Support

For issues or questions:
- Check Vercel deployment logs
- Review this deployment guide
- Check `.env.example` for reference
- Test bot creation: https://mvp-rtsc.vercel.app
