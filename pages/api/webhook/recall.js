import crypto from 'crypto';
import storage from '@/lib/storage';
import { generateSalesCoaching } from '@/lib/claude';

/**
 * Verify Recall.ai webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from request headers
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret || !signature) return false;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
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
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature if secret is configured
    if (process.env.RECALL_WEBHOOK_SECRET) {
      const signature = req.headers['x-recall-signature'];
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        process.env.RECALL_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Parse the webhook payload
    const payload = req.body;

    // Extract relevant data from Recall.ai webhook
    // Adjust these fields based on actual Recall.ai webhook format
    const {
      meeting_id: meetingId,
      bot_id: botId,
      transcript,
      speaker,
      event_type: eventType,
      event,
      data,
      metadata,
    } = payload;

    // Use bot_id as meeting_id if meeting_id not present
    const actualMeetingId = meetingId || botId || data?.bot_id;

    if (!actualMeetingId) {
      console.error('Missing meeting_id/bot_id in webhook payload:', payload);
      return res.status(400).json({ error: 'Missing meeting_id or bot_id' });
    }

    const eventName = eventType || event;
    console.log(`Received webhook for meeting ${actualMeetingId}, event: ${eventName}`);

    // Handle real-time transcript events (streaming with low latency)
    // transcript.partial = Real-time partial transcripts (very low latency)
    // transcript.complete = Complete transcript segments (finalized)
    if (eventName === 'transcript.partial' || eventName === 'transcript.complete' || eventName === 'transcript.segment') {
      const transcriptText = transcript || data?.transcript?.text || data?.text;
      const transcriptSpeaker = speaker || data?.speaker?.name || data?.speaker || 'Unknown';

      if (transcriptText) {
        // Only store complete transcripts (not partials) to avoid duplicates
        if (eventName === 'transcript.complete' || eventName === 'transcript.segment') {
          storage.addTranscript(actualMeetingId, {
            text: transcriptText,
            speaker: transcriptSpeaker,
            metadata,
            timestamp: new Date().toISOString(),
          });
        }

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
      }
    }

    // Handle bot status changes
    if (eventName === 'bot.status_change') {
      const status = data?.status?.code || data?.code;
      console.log(`Bot status change for ${actualMeetingId}: ${status}`);

      // Bot is now in the call - mark as active
      if (status === 'bot.in_call_not_recording' ||
          status === 'bot.in_call_recording' ||
          status === 'bot.recording_permission_allowed') {
        console.log(`Bot activated for meeting ${actualMeetingId}`);
        storage.activateCall(actualMeetingId);
      }

      // Bot left or call ended - mark as ended
      if (status === 'bot.call_ended' ||
          status === 'bot.done' ||
          status === 'bot.fatal') {
        console.log(`Bot ended for meeting ${actualMeetingId}`);
        storage.endCall(actualMeetingId);
      }
    }

    // Handle other event types
    if (eventName === 'call.started' || eventName === 'bot.joined_call') {
      console.log(`Call started: ${actualMeetingId}`);
      storage.activateCall(actualMeetingId);
    }

    if (eventName === 'call.ended' || eventName === 'bot.left_call') {
      console.log(`Call ended: ${actualMeetingId}`);
      storage.endCall(actualMeetingId);
      // You might want to trigger a final comprehensive analysis here
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

// Configure Next.js to not parse the body (we need raw body for signature verification)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
