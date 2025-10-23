#!/bin/bash
# Test bot creation API
# Usage: ./test-bot-creation.sh "YOUR_TEAMS_MEETING_URL"

MEETING_URL="${1:-https://teams.microsoft.com/l/meetup-join/example}"
APP_URL="https://mvp-rtsc.vercel.app"

echo "🤖 Testing Bot Creation API"
echo "=============================="
echo "Meeting URL: $MEETING_URL"
echo "App URL: $APP_URL"
echo ""

echo "📤 Sending request..."
curl -X POST "$APP_URL/api/bot/create" \
  -H "Content-Type: application/json" \
  -d "{\"meeting_url\":\"$MEETING_URL\",\"bot_name\":\"Sales Coach AI\"}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response (raw):"

echo ""
echo "✅ Test complete!"
