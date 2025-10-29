import storage from '@/lib/storage';

// Default system prompt (defines Claude's role and output format)
const DEFAULT_SYSTEM_PROMPT = `You are an expert sales coach analyzing real-time sales calls. Your role is to provide actionable coaching recommendations based on conversation transcripts.

Analyze conversations and provide coaching recommendations in the following JSON format:
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

Always provide only the JSON response, no additional text.`;

// Default user prompt template (contains the actual data to analyze)
const DEFAULT_USER_PROMPT = `Analyze the following sales call and provide coaching recommendations.

TRANSCRIPT:
{{TRANSCRIPT}}

CONTEXT:
- Meeting ID: {{MEETING_ID}}
- Participants: {{PARTICIPANTS}}
- Call Duration: {{DURATION}}

Please analyze this conversation and provide your coaching recommendations in JSON format.`;

/**
 * API endpoint to manage coaching prompt settings
 * GET: Retrieve current prompt
 * POST: Update prompt
 * DELETE: Reset to default prompt
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get current prompts (custom or default)
      const prompts = storage.getPrompts();
      return res.status(200).json({
        systemPrompt: prompts.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        userPrompt: prompts.userPrompt || DEFAULT_USER_PROMPT,
        isDefault: !prompts.systemPrompt && !prompts.userPrompt
      });
    }

    if (req.method === 'POST') {
      // Update prompts
      const { systemPrompt, userPrompt } = req.body;

      if (!systemPrompt || typeof systemPrompt !== 'string') {
        return res.status(400).json({
          error: 'Invalid system prompt',
          message: 'System prompt must be a non-empty string'
        });
      }

      if (!userPrompt || typeof userPrompt !== 'string') {
        return res.status(400).json({
          error: 'Invalid user prompt',
          message: 'User prompt must be a non-empty string'
        });
      }

      // Save custom prompts
      storage.setPrompts({ systemPrompt, userPrompt });

      return res.status(200).json({
        success: true,
        message: 'Prompts updated successfully',
        systemPrompt,
        userPrompt
      });
    }

    if (req.method === 'DELETE') {
      // Reset to default prompts
      storage.setPrompts({ systemPrompt: null, userPrompt: null });

      return res.status(200).json({
        success: true,
        message: 'Prompts reset to default',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        userPrompt: DEFAULT_USER_PROMPT
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

// Export default prompts for use in other modules
export { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT };
