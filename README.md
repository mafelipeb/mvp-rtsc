# Real-Time Sales Coaching System

An AI-powered real-time sales coaching system for Microsoft Teams calls, integrating Recall.ai for transcription and Claude API for intelligent coaching recommendations.

## Features

- **Real-time Transcription**: Integrates with Recall.ai to capture live Microsoft Teams call transcripts
- **AI-Powered Coaching**: Uses Claude API to analyze conversations and provide actionable sales coaching
- **Live Dashboard**: Real-time web dashboard displaying coaching insights and recommendations
- **Serverless Architecture**: Optimized for Vercel deployment with serverless functions
- **In-Memory Storage**: Fast, ephemeral storage for call contexts (suitable for MVP)

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
- **Transcription**: Recall.ai
- **Deployment**: Vercel
- **API Routes**: Next.js API routes as serverless functions

## Project Structure

```
mvp-rtsc/
├── pages/
│   ├── api/
│   │   ├── webhook/
│   │   │   └── recall.js          # Recall.ai webhook endpoint
│   │   └── coaching/
│   │       └── [meetingId].js     # Coaching data API
│   ├── dashboard/
│   │   └── [meetingId].js         # Real-time coaching dashboard
│   ├── index.js                   # Landing page
│   ├── _app.js                    # Next.js app wrapper
│   └── _document.js               # HTML document structure
├── lib/
│   ├── claude.js                  # Claude API wrapper
│   └── storage.js                 # In-memory storage
├── components/                     # React components
├── styles/
│   └── globals.css                # Global styles with Tailwind
├── public/                        # Static assets
├── vercel.json                    # Vercel configuration
├── next.config.js                 # Next.js configuration
└── package.json                   # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Recall.ai account and API key ([Sign up here](https://recall.ai/))
- Vercel account for deployment ([Sign up here](https://vercel.com/))

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd mvp-rtsc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```env
   CLAUDE_API_KEY=your_claude_api_key_here
   RECALL_API_KEY=your_recall_api_key_here
   RECALL_WEBHOOK_SECRET=your_webhook_secret_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Generate a secret for NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

3. **Configure Environment Variables**:

   In Vercel Dashboard → Settings → Environment Variables, add:

   - `CLAUDE_API_KEY` - Your Anthropic API key
   - `RECALL_API_KEY` - Your Recall.ai API key
   - `RECALL_WEBHOOK_SECRET` - Secret for webhook verification
   - `NEXTAUTH_SECRET` - Random secret (use `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

4. **Set environment variables via CLI**:
   ```bash
   vercel env add CLAUDE_API_KEY production
   vercel env add RECALL_API_KEY production
   vercel env add RECALL_WEBHOOK_SECRET production
   vercel env add NEXTAUTH_SECRET production
   ```

### Option 3: Using Vercel Secrets (Advanced)

For enhanced security, you can use Vercel Secrets instead of environment variables:

1. **Create secrets via CLI**:
   ```bash
   vercel secrets add claude-api-key "your_actual_api_key"
   vercel secrets add recall-api-key "your_actual_api_key"
   vercel secrets add recall-webhook-secret "your_actual_secret"
   vercel secrets add nextauth-secret "your_actual_secret"
   ```

2. **Update vercel.json** to reference secrets:
   ```json
   "env": {
     "CLAUDE_API_KEY": "@claude-api-key",
     "RECALL_API_KEY": "@recall-api-key",
     "RECALL_WEBHOOK_SECRET": "@recall-webhook-secret",
     "NEXTAUTH_SECRET": "@nextauth-secret"
   }
   ```

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

**Note**: The default configuration uses environment variables (simpler). Only use secrets if you need the extra security layer for sensitive production deployments.

## Configuring Recall.ai

Once deployed, configure Recall.ai to send webhooks to your application:

1. **Log in to Recall.ai Dashboard**

2. **Set up webhook**:
   - Go to Webhook Settings
   - Set webhook URL to: `https://your-vercel-app.vercel.app/api/webhook/recall`
   - Set webhook secret (use the same value as `RECALL_WEBHOOK_SECRET`)
   - Enable events: `transcript.segment`, `call.started`, `call.ended`

3. **Create a bot for Microsoft Teams**:
   - Follow Recall.ai documentation to create a Teams bot
   - Configure bot to join your sales calls
   - Bot will automatically send transcripts to your webhook

## Using the System

1. **Start a Microsoft Teams meeting**

2. **Invite the Recall.ai bot** to the meeting

3. **Access the dashboard**:
   - Go to `https://your-app.vercel.app`
   - Enter your meeting ID
   - View real-time coaching insights as the conversation progresses

4. **Review coaching recommendations**:
   - Sentiment analysis
   - Talk ratio (sales vs. customer)
   - Actionable recommendations
   - Key moments in the conversation
   - Suggested next steps

## API Endpoints

### Webhook Endpoint
- **POST** `/api/webhook/recall`
- Receives Recall.ai transcription webhooks
- Validates webhook signature
- Stores transcripts and generates coaching

### Coaching Data Endpoint
- **GET** `/api/coaching/[meetingId]`
- Retrieves coaching data for a meeting
- Query params:
  - `?latest=true` - Get only latest recommendations

## Architecture

### Data Flow

1. **Teams Call** → Recall.ai bot joins and records
2. **Transcription** → Recall.ai sends webhook to `/api/webhook/recall`
3. **Storage** → Transcript stored in memory
4. **AI Analysis** → Claude API analyzes transcript and generates coaching
5. **Dashboard** → Real-time display of coaching recommendations

### Storage

The current implementation uses in-memory storage, which:
- ✅ Fast and simple
- ✅ Perfect for MVP and testing
- ⚠️ Data resets on serverless function cold starts
- ⚠️ Not persistent across deployments

**For Production**: Consider using:
- Redis (Upstash Redis for Vercel)
- PostgreSQL (Vercel Postgres)
- MongoDB Atlas
- Supabase

## Customization

### Modifying Coaching Prompts

Edit `lib/claude.js` to customize the coaching analysis:

```javascript
const prompt = `You are an expert sales coach...`;
```

### Adjusting Polling Interval

Edit `pages/dashboard/[meetingId].js` to change refresh rate:

```javascript
const interval = setInterval(fetchData, 5000); // 5 seconds
```

### Styling

Modify `tailwind.config.js` to customize colors and theme:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ }
    }
  }
}
```

## Troubleshooting

### Environment Variable Errors

**Error**: `Environment Variable "CLAUDE_API_KEY" references Secret "claude-api-key", which does not exist`

This error occurs when `vercel.json` references Vercel Secrets that haven't been created. Solutions:

1. **Use environment variables (recommended)**:
   - Remove the `"env"` section from `vercel.json` (default configuration)
   - Set environment variables via Vercel Dashboard or CLI
   - Redeploy your application

2. **Create Vercel Secrets**:
   - Run: `vercel secrets add claude-api-key "your_actual_key"`
   - Repeat for all required secrets
   - Keep the `"env"` section in `vercel.json` that references them

### Webhooks Not Received

- Verify webhook URL in Recall.ai dashboard
- Check CORS configuration in `next.config.js`
- Ensure `RECALL_WEBHOOK_SECRET` matches in both systems
- Check Vercel function logs

### Claude API Errors

- Verify `CLAUDE_API_KEY` is set correctly
- Check API quota and billing
- Review error logs in Vercel dashboard

### Dashboard Not Updating

- Ensure polling is working (check browser console)
- Verify meeting ID is correct
- Check that transcripts are being received

## Performance Considerations

- **Serverless Function Limits**: Vercel has 10-second timeout for Hobby plan
- **Memory**: In-memory storage suitable for <100 concurrent meetings
- **API Costs**: Monitor Claude API usage (charged per token)

## Security

- ✅ Webhook signature verification
- ✅ CORS configured for API routes
- ✅ Environment variables for secrets
- ✅ No credentials in code

## License

ISC

## Support

For issues or questions:
- Check Vercel deployment logs
- Review Recall.ai webhook logs
- Check browser console for client-side errors

## Next Steps

To enhance this MVP:

1. **Add persistence**: Implement database storage
2. **Authentication**: Add user login and session management
3. **Real-time updates**: Implement WebSockets or Server-Sent Events
4. **Analytics**: Track coaching effectiveness over time
5. **Export features**: Download coaching reports
6. **Multi-user support**: Handle multiple sales reps
7. **Custom coaching models**: Train on your sales methodology
