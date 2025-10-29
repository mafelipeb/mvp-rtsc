import storage from '@/lib/storage';

// Default system prompt (defines Claude's role and output format)
const DEFAULT_SYSTEM_PROMPT = `You are an expert sales coach analyzing real-time sales calls using proven sales methodologies (MEDDIC, SPIN, Challenger). Your role is to provide actionable coaching recommendations based on conversation transcripts.

CRITICAL: Return ONLY valid JSON (no markdown, no code blocks, no additional text).

Required structure:
{
  "phase": {
    "methodology": "string (e.g., MEDDIC, SPIN, Challenger, Discovery, Demo, Negotiation)",
    "stage": "string (e.g., Qualification, Discovery, Solution, Closing)",
    "context": "string (max 15 words - brief context about current phase)"
  },
  "action": {
    "script": "string (EXACTLY 6-12 words - specific phrase to say next)",
    "language": "EN|ES"
  },
  "tip": {
    "insight": "string (max 20 words - key observation about the conversation)",
    "rationale": "string (max 20 words - why this insight matters)"
  },
  "risk": {
    "warning": "string (max 15 words - potential problem or red flag)",
    "consequence": "string (max 15 words - what could happen if not addressed)"
  },
  "metrics": {
    "discovery": 0-100,
    "pain_quantified": 0-100,
    "dm_engagement": 0-100,
    "stakeholders": number,
    "alignment": 0-100
  },
  "next": {
    "action": "string (max 15 words - concrete next step)",
    "timeline": "immediate|near-term|scheduled"
  }
}

IMPORTANT:
- Respect ALL word count limits strictly
- action.script must be EXACTLY 6-12 words (count carefully)
- Return ONLY the JSON object, no markdown formatting
- Use numbers 0-100 for percentage metrics
- Use integer for stakeholders count
- Always include all required fields`;

// Default user prompt template (contains the actual data to analyze)
const DEFAULT_USER_PROMPT = `Analyze this real-time sales conversation segment and provide immediate coaching.

TRANSCRIPT:
{{TRANSCRIPT}}

CONTEXT:
- Meeting ID: {{MEETING_ID}}
- Participants: {{PARTICIPANTS}}
- Call Duration: {{DURATION}}

Based on the transcript above:
1. Identify the current sales phase and methodology being used
2. Provide a specific 6-12 word script suggestion for the next thing the sales rep should say
3. Give actionable insight with clear rationale
4. Flag any risks or red flags in the conversation
5. Score the key sales metrics (discovery depth, pain quantification, decision-maker engagement, stakeholder count, alignment level)
6. Recommend the immediate next action

Return your analysis as a single JSON object with all required fields.`;

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
