import Anthropic from '@anthropic-ai/sdk';
import storage from '@/lib/storage';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT } from '@/pages/api/settings/prompt';

/**
 * Initialize Claude API client
 */
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Generate sales coaching recommendations based on call transcripts
 * @param {Array} transcripts - Array of transcript objects with speaker and text
 * @param {Object} context - Additional context about the call
 * @returns {Promise<Object>} Coaching recommendations in structured format
 */
export async function generateSalesCoaching(transcripts, context = {}) {
  try {
    // Prepare the transcript text
    const transcriptText = transcripts
      .map((t) => `${t.speaker || 'Unknown'}: ${t.text}`)
      .join('\n');

    // Get custom prompts or use defaults
    const prompts = storage.getPrompts();
    const systemPrompt = prompts.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const userPromptTemplate = prompts.userPrompt || DEFAULT_USER_PROMPT;

    // Replace placeholders with actual data in user prompt
    const userPrompt = userPromptTemplate
      .replace('{{TRANSCRIPT}}', transcriptText)
      .replace('{{MEETING_ID}}', context.meetingId || 'Unknown')
      .replace('{{PARTICIPANTS}}', context.participants?.join(', ') || 'Unknown')
      .replace('{{DURATION}}', context.duration || 'Unknown');

    // Call Claude API with separate system and user prompts
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract and parse the response
    const responseText = message.content[0].text;

    // Try to extract JSON from the response
    let coaching;
    try {
      // Remove any markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      coaching = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      // Return a fallback structure
      coaching = {
        overallSentiment: 'neutral',
        talkRatio: { sales: 0.5, customer: 0.5 },
        recommendations: [
          {
            type: 'improvement',
            category: 'active_listening',
            title: 'Continue the conversation',
            description: 'Keep engaging with the customer and gathering information.',
            priority: 'medium',
          },
        ],
        keyMoments: [],
        nextSteps: ['Follow up on discussed topics'],
        coachingTips: ['Stay engaged and listen actively'],
      };
    }

    return {
      success: true,
      data: coaching,
      metadata: {
        model: message.model,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      },
    };
  } catch (error) {
    console.error('Error generating sales coaching:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Analyze a single transcript segment for immediate feedback
 * @param {string} text - The transcript text
 * @param {string} speaker - The speaker identifier
 * @returns {Promise<Object>} Quick coaching insight
 */
export async function analyzeSegment(text, speaker) {
  try {
    const systemPrompt = `You are a sales coach providing brief real-time insights about sales conversations. Always respond with only a JSON object containing a single coaching tip.`;

    const userPrompt = `Analyze this statement from a ${speaker}:

"${text}"

Respond with a JSON object:
{
  "tip": "Brief actionable tip",
  "category": "questioning|active_listening|objection_handling|rapport_building|closing|other",
  "sentiment": "positive|neutral|negative"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    const insight = JSON.parse(jsonText);

    return {
      success: true,
      data: insight,
    };
  } catch (error) {
    console.error('Error analyzing segment:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export default {
  generateSalesCoaching,
  analyzeSegment,
};
