import storage from '@/lib/storage';

// Default coaching prompt
const DEFAULT_PROMPT = `You are an expert sales coach analyzing a real-time sales call. Based on the following transcript, provide actionable coaching recommendations.

TRANSCRIPT:
{{TRANSCRIPT}}

CONTEXT:
- Meeting ID: {{MEETING_ID}}
- Participants: {{PARTICIPANTS}}
- Call Duration: {{DURATION}}

Analyze the conversation and provide coaching recommendations in the following JSON format:
{
  "overallSentiment": "positive|neutral|negative",
  "talkRatio": {
    "sales": 0.0-1.0,
    "customer": 0.0-1.0
  },
  "recommendations": [
    {
      "type": "strength|improvement|warning",
      "category": "questioning|active_listening|objection_handling|rapport_building|closing",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "high|medium|low"
    }
  ],
  "keyMoments": [
    {
      "timestamp": "relative timestamp or speaker turn",
      "moment": "Description of the key moment",
      "impact": "positive|negative|neutral"
    }
  ],
  "nextSteps": [
    "Suggested action item 1",
    "Suggested action item 2"
  ],
  "coachingTips": [
    "Real-time tip 1",
    "Real-time tip 2"
  ]
}

Provide only the JSON response, no additional text.`;

/**
 * API endpoint to manage coaching prompt settings
 * GET: Retrieve current prompt
 * POST: Update prompt
 * DELETE: Reset to default prompt
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get current prompt (custom or default)
      const customPrompt = storage.getPrompt();
      return res.status(200).json({
        prompt: customPrompt || DEFAULT_PROMPT,
        isDefault: !customPrompt
      });
    }

    if (req.method === 'POST') {
      // Update prompt
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: 'Invalid prompt',
          message: 'Prompt must be a non-empty string'
        });
      }

      // Save custom prompt
      storage.setPrompt(prompt);

      return res.status(200).json({
        success: true,
        message: 'Prompt updated successfully',
        prompt: prompt
      });
    }

    if (req.method === 'DELETE') {
      // Reset to default prompt
      storage.setPrompt(null);

      return res.status(200).json({
        success: true,
        message: 'Prompt reset to default',
        prompt: DEFAULT_PROMPT
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in prompt settings API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Export default prompt for use in other modules
export { DEFAULT_PROMPT };
