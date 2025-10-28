import { Webhook } from 'svix';
import storage from '@/lib/storage';
import { generateSalesCoaching } from '@/lib/claude';

/**
 * Helper to read raw body from request
 */
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Webhook endpoint to receive Recall.ai transcriptions
 * Expects POST requests with transcript data
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await getRawBody(req);

    // Verify webhook signature using Svix if secret is configured AND Svix headers are present
    let payload;
    const hasSvixHeaders = req.headers['svix-id'] && req.headers['svix-timestamp'] && req.headers['svix-signature'];

    if (process.env.RECALL_WEBHOOK_SECRET && hasSvixHeaders) {
      // Verify using Svix (for regular webhooks from Recall.ai)
      try {
        const wh = new Webhook(process.env.RECALL_WEBHOOK_SECRET);

        payload = wh.verify(rawBody, {
          'svix-id': req.headers['svix-id'],
          'svix-timestamp': req.headers['svix-timestamp'],
          'svix-signature': req.headers['svix-signature'],
        });

        console.log('✅ Webhook signature verified successfully (Svix)');
      } catch (err) {
        console.error('❌ Invalid webhook signature:', err.message);
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      // No Svix headers - this is likely a realtime_endpoints webhook
      // These webhooks don't use Svix signatures
      payload = JSON.parse(rawBody);
      console.log('ℹ️ Webhook received without Svix signature (realtime_endpoints)');
    }

    // Log the full payload to understand Recall.ai's webhook structure
    console.log('📥 Received webhook payload:', JSON.stringify(payload, null, 2));

    // Extract relevant data from Recall.ai webhook
    const {
      meeting_id: meetingId,
      bot_id: botId,
      transcript,
      speaker,
      event_type: eventType,
      event,
      data,
      metadata,
      type,
    } = payload;

    // Try multiple possible locations for bot_id/meeting_id
    const actualMeetingId =
      meetingId ||
      botId ||
      data?.bot_id ||
      data?.id ||
      data?.meeting_id ||
      data?.bot?.id ||
      payload.id;

    if (!actualMeetingId) {
      console.error('❌ Missing meeting_id/bot_id in webhook payload');
      console.error('Available fields:', Object.keys(payload));
      console.error('Data fields:', data ? Object.keys(data) : 'no data object');
      return res.status(400).json({
        error: 'Missing meeting_id or bot_id',
        available_fields: Object.keys(payload),
        data_fields: data ? Object.keys(data) : null
      });
    }

    // Event name can be in type, event_type, or event fields
    const eventName = type || eventType || event;
    console.log(`✅ Received webhook for meeting ${actualMeetingId}, event: ${eventName}`);

    // Handle real-time transcript events from realtime_endpoints
    // transcript.data = Real-time transcript data from streaming provider
    // transcript.partial_data = Partial/interim transcript data (lower latency)
    if (eventName === 'transcript.data' || eventName === 'transcript.partial_data') {
      console.log(`📝 Processing transcript event: ${eventName}`);
      console.log(`📝 Raw data object:`, JSON.stringify(data, null, 2));

      // Extract transcript text from Deepgram word-level results
      // Data structure: data.data.words = [{text: "word", ...}, ...]
      const words = data?.data?.words || [];
      const transcriptText = words.map(w => w.text).join(' ');

      // Extract speaker name from participant data
      const transcriptSpeaker = data?.data?.participant?.name || 'Unknown';

      console.log(`📝 Extracted transcript: "${transcriptText}" from speaker: ${transcriptSpeaker}`);

      if (transcriptText && transcriptText.trim()) {
        // Store both transcript.data and transcript.partial_data
        // transcript.partial_data contains real-time word-level data from Deepgram
        storage.addTranscript(actualMeetingId, {
          text: transcriptText,
          speaker: transcriptSpeaker,
          metadata: {
            ...metadata,
            event_type: eventName,
            word_count: words.length,
            is_partial: eventName === 'transcript.partial_data'
          },
          timestamp: new Date().toISOString(),
        });
        console.log(`✅ Stored transcript segment (${words.length} words) for meeting ${actualMeetingId}`);

        // Get recent transcripts for context (last 5 segments)
        const recentTranscripts = storage.getRecentTranscripts(actualMeetingId, 5);

        // Generate coaching if we have enough context (at least 3 segments)
        if (recentTranscripts.length >= 3) {
          const call = storage.getCall(actualMeetingId);

          // Generate coaching asynchronously
          generateSalesCoaching(recentTranscripts, {
            meetingId: actualMeetingId,
            participants: call?.participants || [],
            duration: metadata?.duration,
          }).then((coaching) => {
            if (coaching.success) {
              storage.addCoaching(actualMeetingId, coaching.data);
              console.log(`Generated coaching for meeting ${actualMeetingId}`);
            } else {
              console.error(`Failed to generate coaching: ${coaching.error}`);
            }
          }).catch((error) => {
            console.error('Error in coaching generation:', error);
          });
        }
      } else {
        console.log(`⏭️ Skipping empty transcript`);
      }
    }

    // Handle transcript.done event - fetch full transcript from Recall.ai
    if (eventName === 'transcript.done') {
      console.log(`📄 Transcript completed for meeting ${actualMeetingId}`);

      const transcriptId = data?.transcript?.id;
      if (transcriptId) {
        console.log(`📥 Fetching transcript ${transcriptId} from Recall.ai API`);

        try {
          const transcriptResponse = await fetch(
            `https://us-west-2.recall.ai/api/v1/bot/${actualMeetingId}/transcript`,
            {
              headers: {
                'Authorization': `Token ${process.env.RECALL_API_KEY}`,
                'Accept': 'application/json'
              }
            }
          );

          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json();
            console.log(`📝 Received transcript data:`, JSON.stringify(transcriptData, null, 2));

            // Parse transcript segments and store them
            if (transcriptData.words || transcriptData.segments || transcriptData.transcript) {
              const segments = transcriptData.segments || [];

              segments.forEach((segment, index) => {
                if (segment.text) {
                  storage.addTranscript(actualMeetingId, {
                    text: segment.text,
                    speaker: segment.speaker || `Speaker ${segment.speaker_id || index + 1}`,
                    metadata: { ...segment, source: 'transcript.done' },
                    timestamp: new Date(segment.start * 1000).toISOString(),
                  });
                }
              });

              console.log(`✅ Stored ${segments.length} transcript segments`);
            }
          } else {
            console.error(`❌ Failed to fetch transcript: ${transcriptResponse.status}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching transcript:`, error);
        }
      }
    }

    // Handle bot status events directly
    // The event type IS the status (e.g., "bot.in_call_recording")
    console.log(`Event for ${actualMeetingId}: ${eventName}`);

    // Bot is now in the call - mark as active
    if (eventName === 'bot.in_call_not_recording' ||
        eventName === 'bot.in_call_recording' ||
        eventName === 'bot.recording_permission_allowed') {
      console.log(`✅ Bot activated for meeting ${actualMeetingId}`);
      storage.activateCall(actualMeetingId);
    }

    // Bot left or call ended - mark as ended
    if (eventName === 'bot.call_ended' ||
        eventName === 'bot.done' ||
        eventName === 'bot.fatal') {
      console.log(`🛑 Bot ended for meeting ${actualMeetingId}`);
      storage.endCall(actualMeetingId);
    }

    // Legacy support for other event names
    if (eventName === 'call.started' || eventName === 'bot.joined_call') {
      console.log(`Call started: ${actualMeetingId}`);
      storage.activateCall(actualMeetingId);
    }

    if (eventName === 'call.ended' || eventName === 'bot.left_call') {
      console.log(`Call ended: ${actualMeetingId}`);
      storage.endCall(actualMeetingId);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      meetingId: actualMeetingId,
      event: eventName,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Configure Next.js to not parse the body (we need raw body for Svix signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};
