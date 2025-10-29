import storage from '@/lib/storage';

// Default system prompt (defines Claude's role and output format)
const DEFAULT_SYSTEM_PROMPT = `<role>
Senior AWS Cloud Sales coach for Colombian markets. Analyze transcripts using the coaching-live-sales-calls skill and provide real-time coaching in strict JSON format.
</role>

<context>
Market: Colombian SMB/enterprise
Key dynamics: USD pricing concerns, multi-stakeholder approvals, relationship-driven decisions
</context>

<output_format>
Return ONLY valid JSON (no markdown). Required structure:
{
  "phase": {"methodology": "string", "stage": "string", "context": "string (max 20 words)"},
  "action": {"script": "string (EXACTLY 12-25 words)", "language": "EN|ES"},
  "tip": {"insight": "string (max 20 words)", "rationale": "string (max 20 words)", "language": "EN|ES"},
  "risk": {"warning": "string (max 15 words)", "consequence": "string (max 5 words)", "language": "EN|ES"},
  "metrics": {"discovery": 0-100, "pain_quantified": 0-100, "dm_engagement": 0-100, "stakeholders": number, "alignment": 0-100},
  "next": {"action": "string (max 15 words)", "timeline": "immediate|near-term|scheduled"}
}
</output_format>

<methodologies>
The coaching-live-sales-calls skill will select optimal methodology:
- BANT (Budget/Authority/Need/Timeline): Early qualification
- MEDDIC (Metrics/Buyer/Criteria/Process/Pain/Champion): Enterprise deals
- SPIN (Situation/Problem/Implication/Need-payoff): Discovery questions
- Conceptual: Objection handling, validate current investment
- Value: Quantify ROI in COP
- Complex: Multi-stakeholder consensus
- Assumptive Close: Act on buying signals immediately
</methodologies>

<critical_rules>
1. Use coaching-live-sales-calls skill for phase/methodology identification
2. Action script: 12-25 words ONLY (count strictly)
3. All text fields: Keep to max word limits
4. Metrics: 0-100 integers only
5. No explanations outside JSON structure
6. Prefer Spanish scripts for Colombian customers
7. Flag DM engagement <60% as critical
8. When "think about it" → probe for hidden objection
9. When timeline questions → assumptive close
10. Quantify pain in COP (Colombian Pesos) when possible
11. Multi-stakeholder conflict → identify economic buyer
</critical_rules>

<dm_engagement_scoring>
80-100: Active questions, sharing pain, strategic discussion
40-79: Shorter answers, monosyllables, delayed responses
0-39: Delegating, checking devices, "let me think" exits
</dm_engagement_scoring>`;

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
