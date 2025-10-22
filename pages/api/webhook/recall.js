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
      transcript,
      speaker,
      event_type: eventType,
      metadata,
    } = payload;

    if (!meetingId) {
      return res.status(400).json({ error: 'Missing meeting_id' });
    }

    console.log(`Received webhook for meeting ${meetingId}, event: ${eventType}`);

    // Store the transcript segment
    if (transcript && eventType === 'transcript.segment') {
      storage.addTranscript(meetingId, {
        text: transcript,
        speaker: speaker || 'Unknown',
        metadata,
      });

      // Get recent transcripts for context (last 5 segments)
      const recentTranscripts = storage.getRecentTranscripts(meetingId, 5);

      // Generate coaching if we have enough context (at least 3 segments)
      if (recentTranscripts.length >= 3) {
        const call = storage.getCall(meetingId);

        // Generate coaching asynchronously
        generateSalesCoaching(recentTranscripts, {
          meetingId,
          participants: call.participants,
          duration: metadata?.duration,
        }).then((coaching) => {
          if (coaching.success) {
            storage.addCoaching(meetingId, coaching.data);
            console.log(`Generated coaching for meeting ${meetingId}`);
          } else {
            console.error(`Failed to generate coaching: ${coaching.error}`);
          }
        }).catch((error) => {
          console.error('Error in coaching generation:', error);
        });
      }
    }

    // Handle other event types
    if (eventType === 'call.started') {
      console.log(`Call started: ${meetingId}`);
      storage.getOrCreateCall(meetingId);
    }

    if (eventType === 'call.ended') {
      console.log(`Call ended: ${meetingId}`);
      // You might want to trigger a final comprehensive analysis here
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      meetingId,
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
