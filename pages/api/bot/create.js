/**
 * API endpoint to create a Recall.ai bot for a Microsoft Teams meeting
 * POST /api/bot/create
 *
 * Request body:
 * {
 *   "meeting_url": "https://teams.microsoft.com/l/meetup-join/...",
 *   "bot_name": "Sales Coach Bot" (optional)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { meeting_url, bot_name } = req.body;

  // Validate required fields
  if (!meeting_url) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'meeting_url is required'
    });
  }

  // Validate RECALL_API_KEY is configured
  if (!process.env.RECALL_API_KEY) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'RECALL_API_KEY not configured'
    });
  }

  try {
    // Construct webhook URL for this deployment
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/recall`;

    // Prepare bot configuration with low-latency streaming
    const botConfig = {
      meeting_url: meeting_url,
      bot_name: bot_name || 'Sales Coach AI',

      // Recording configuration for streaming
      recording_config: {
        transcript: {
          provider: {
            // Use Recall.ai's streaming for real-time transcripts
            recallai_streaming: {
              mode: 'prioritize_low_latency',
              language_code: 'en'
            }
          }
        }
      },

      // Webhook configuration
      webhook: {
        url: webhookUrl,
        events: [
          'bot.status_change',
          'transcript.partial',  // Real-time partial transcripts
          'transcript.complete', // Complete transcript segments
          'call.ended'
        ]
      },

      // Automatic actions
      automatic_leave: {
        waiting_room_timeout: 600, // Leave after 10 min in waiting room
        noone_joined_timeout: 300   // Leave after 5 min if no one joins
      }
    };

    console.log('Creating Recall.ai bot for meeting:', meeting_url);
    console.log('Webhook URL:', webhookUrl);

    // Call Recall.ai API to create bot
    const recallResponse = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botConfig)
    });

    const responseData = await recallResponse.json();

    if (!recallResponse.ok) {
      console.error('Recall.ai API error:', responseData);
      return res.status(recallResponse.status).json({
        error: 'Failed to create bot',
        message: responseData.message || 'Recall.ai API error',
        details: responseData
      });
    }

    console.log('Bot created successfully:', responseData.id);

    // Return success with bot details
    return res.status(200).json({
      success: true,
      message: 'Bot created successfully',
      data: {
        bot_id: responseData.id,
        meeting_id: responseData.id, // Use bot ID as meeting ID
        status: responseData.status_changes?.[0]?.code || 'created',
        join_url: responseData.join_at,
        webhook_url: webhookUrl,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${responseData.id}`
      },
      raw_response: responseData
    });

  } catch (error) {
    console.error('Error creating bot:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
