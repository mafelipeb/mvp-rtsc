# Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ All environment variables are set in Vercel
- ✅ Deployment is successful (status: Ready)
- ✅ You have a Microsoft Teams meeting scheduled or can create one
- ✅ You have access to your Recall.ai account

---

## Test 1: Homepage Access

**Goal:** Verify the application loads correctly

**Steps:**
1. Open browser
2. Go to: https://mvp-rtsc.vercel.app
3. **Expected result:**
   - Page loads successfully
   - See "Real-Time Sales Coaching" header
   - See "Start New Coaching Session" section
   - See bot creation form with Teams URL input
   - See "View Existing Session" section

**Status:** [ ] Pass / [ ] Fail

---

## Test 2: Bot Creation via UI

**Goal:** Create a bot using the web interface

**Prerequisites:**
- Have a Microsoft Teams meeting URL ready
- Format: `https://teams.microsoft.com/l/meetup-join/...`

**Steps:**

1. **Get Teams Meeting URL:**
   - Create or open a Teams meeting
   - Click "Meeting options" or copy meeting link
   - Copy the full URL

2. **Create Bot via UI:**
   - Go to: https://mvp-rtsc.vercel.app
   - In "Start New Coaching Session" section
   - Paste your Teams meeting URL
   - Click "🚀 Create Bot & Start Coaching"

3. **Expected results:**
   - Loading spinner appears
   - After 2-5 seconds: Success message shows
   - Message displays: "Bot Created Successfully!"
   - Shows Meeting ID (bot ID)
   - Message: "Redirecting to dashboard in 3 seconds..."
   - Auto-redirect to: `/dashboard/[meeting-id]`

4. **If successful, note down:**
   - Meeting ID: _______________
   - Dashboard URL: _______________

**Status:** [ ] Pass / [ ] Fail

**Errors encountered (if any):**
```
[Paste error message here]
```

---

## Test 3: Dashboard Access

**Goal:** Verify dashboard loads and polls correctly

**Steps:**

1. **Access Dashboard:**
   - Use URL from Test 2, or
   - Go to: `https://mvp-rtsc.vercel.app/dashboard/[your-meeting-id]`

2. **Expected results:**
   - Page loads successfully
   - Shows "Sales Coaching Dashboard" header
   - Shows meeting ID in subtitle
   - Shows "Live" indicator (green dot)
   - Shows "Waiting for coaching insights..." message
   - No errors in browser console

3. **Check Console (Developer Tools):**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for polling requests every 5 seconds
   - Should see: `GET /api/coaching/[meeting-id]?latest=true`
   - Status should be 200 or 404 (404 is OK if meeting hasn't started)

**Status:** [ ] Pass / [ ] Fail

---

## Test 4: Bot Creation via API (CLI)

**Goal:** Test bot creation using command line

**Prerequisites:**
- Terminal/command line access
- curl installed
- jq installed (optional, for pretty JSON)

**Steps:**

1. **Run test script:**
   ```bash
   cd /home/user/mvp-rtsc
   ./test-bot-creation.sh "YOUR_TEAMS_MEETING_URL_HERE"
   ```

2. **Expected response:**
   ```json
   {
     "success": true,
     "message": "Bot created successfully",
     "data": {
       "bot_id": "abc123...",
       "meeting_id": "abc123...",
       "status": "created",
       "join_url": "...",
       "webhook_url": "https://mvp-rtsc.vercel.app/api/webhook/recall",
       "dashboard_url": "https://mvp-rtsc.vercel.app/dashboard/abc123"
     }
   }
   ```

3. **HTTP Status:** Should be 200

**Status:** [ ] Pass / [ ] Fail

---

## Test 5: Full End-to-End Test (Real Meeting)

**Goal:** Test the complete real-time coaching flow

**Prerequisites:**
- Teams meeting created
- Bot created (from Test 2 or Test 4)
- Dashboard open on second screen

**Steps:**

1. **Setup:**
   - Create bot using Test 2
   - Keep dashboard open: `https://mvp-rtsc.vercel.app/dashboard/[meeting-id]`
   - Join your Teams meeting

2. **Wait for bot to join:**
   - Bot should appear in meeting participants
   - Name: "Sales Coach AI" or "Recall Bot"
   - May take 30-60 seconds to join

3. **Speak in the meeting:**
   - Have a conversation (can be test dialogue)
   - Speak for at least 30-60 seconds
   - Say at least 3-5 sentences

4. **Watch the dashboard:**
   - After ~15-30 seconds of speaking
   - Transcripts should appear in "Recent Transcript" section
   - After 3+ transcript segments
   - Coaching insights should appear in "Coaching Insights" section

5. **Expected results:**
   - ✅ Bot joins meeting successfully
   - ✅ Transcripts appear in real-time (with 5-10 second delay)
   - ✅ Speaker names shown correctly
   - ✅ Coaching recommendations generated
   - ✅ Recommendations categorized (strength/improvement/warning)
   - ✅ Dashboard updates every 5 seconds

6. **Check Vercel Logs:**
   - Go to: Vercel Dashboard → Functions → `/api/webhook/recall`
   - Should see incoming webhook calls
   - Should see log messages like:
     - "Received webhook for meeting [id], event: transcript.complete"
     - "Generated coaching for meeting [id]"

**Status:** [ ] Pass / [ ] Fail

**Observations:**
- Time for bot to join: _____ seconds
- Time for first transcript: _____ seconds
- Time for first coaching: _____ seconds
- Quality of transcription: [ ] Good / [ ] Fair / [ ] Poor
- Quality of coaching: [ ] Relevant / [ ] Somewhat Relevant / [ ] Not Relevant

---

## Test 6: Webhook Endpoint

**Goal:** Verify webhook endpoint is accessible and secure

**Steps:**

1. **Test GET request (should fail):**
   ```bash
   curl https://mvp-rtsc.vercel.app/api/webhook/recall
   ```

   **Expected:** `{"error":"Method not allowed"}`

2. **Test POST without signature (should fail if secret configured):**
   ```bash
   curl -X POST https://mvp-rtsc.vercel.app/api/webhook/recall \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```

   **Expected:**
   - If `RECALL_WEBHOOK_SECRET` set: `{"error":"Invalid signature"}`
   - If not set: `{"error":"Missing meeting_id or bot_id"}`

**Status:** [ ] Pass / [ ] Fail

---

## Test 7: Environment Variables

**Goal:** Verify all environment variables are set correctly

**Steps:**

1. Go to: Vercel Dashboard → Settings → Environment Variables

2. **Check these variables exist:**
   - [ ] `CLAUDE_API_KEY` (Production, Preview, Development)
   - [ ] `RECALL_API_KEY` (Production, Preview, Development)
   - [ ] `RECALL_WEBHOOK_SECRET` (Production, Preview, Development)
   - [ ] `NEXTAUTH_SECRET` (Production, Preview, Development)
   - [ ] `NEXT_PUBLIC_APP_URL` = `https://mvp-rtsc.vercel.app`

3. **Verify values:**
   - CLAUDE_API_KEY starts with: `sk-ant-`
   - RECALL_API_KEY: (check format from Recall.ai)
   - RECALL_WEBHOOK_SECRET: At least 32 characters
   - NEXTAUTH_SECRET: At least 32 characters
   - NEXT_PUBLIC_APP_URL: Correct domain

**Status:** [ ] Pass / [ ] Fail

---

## Common Issues and Solutions

### Issue 1: "Failed to create bot"

**Possible causes:**
- Invalid RECALL_API_KEY
- Invalid meeting URL format
- Recall.ai API down
- Network error

**Solution:**
1. Check Vercel function logs
2. Verify RECALL_API_KEY is correct
3. Verify meeting URL format
4. Try again in a few minutes

### Issue 2: "Bot doesn't join meeting"

**Possible causes:**
- Meeting hasn't started yet
- Bot creation failed
- Teams meeting settings block bots
- Waiting room enabled

**Solution:**
1. Start the meeting first
2. Check bot status in Recall.ai dashboard
3. Check Teams meeting settings allow bots
4. Admit bot from waiting room if present

### Issue 3: "No transcripts appear"

**Possible causes:**
- No one speaking in meeting
- Webhook not configured correctly
- RECALL_WEBHOOK_SECRET mismatch
- Network/firewall issues

**Solution:**
1. Speak in the meeting for 10+ seconds
2. Check Vercel function logs for webhook calls
3. Verify RECALL_WEBHOOK_SECRET matches
4. Check Recall.ai webhook configuration

### Issue 4: "No coaching insights"

**Possible causes:**
- Less than 3 transcript segments
- CLAUDE_API_KEY invalid
- Claude API quota exceeded
- Error in coaching generation

**Solution:**
1. Speak more (need 3+ segments)
2. Check Vercel function logs for errors
3. Verify CLAUDE_API_KEY is valid
4. Check Claude API usage/quota

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Homepage Access | [ ] | |
| 2. Bot Creation UI | [ ] | |
| 3. Dashboard Access | [ ] | |
| 4. Bot Creation API | [ ] | |
| 5. End-to-End Flow | [ ] | |
| 6. Webhook Endpoint | [ ] | |
| 7. Environment Variables | [ ] | |

**Overall Status:** [ ] All Pass / [ ] Some Failures

**Date Tested:** _____________

**Tested By:** _____________

---

## Next Steps

After successful testing:
- [ ] Document any issues found
- [ ] Create GitHub issues for bugs
- [ ] Plan improvements based on feedback
- [ ] Set up monitoring/alerting
- [ ] Test with real sales calls
- [ ] Train sales team on usage
