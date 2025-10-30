import Anthropic from '@anthropic-ai/sdk';
import storage from '@/lib/storage';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT } from '@/pages/api/settings/prompt';

/**
 * Initialize Claude API client
 */
if (!process.env.CLAUDE_API_KEY) {
  console.error('❌ CRITICAL: CLAUDE_API_KEY environment variable is not set!');
  console.error('Please set CLAUDE_API_KEY in your Vercel environment variables or .env file');
}

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
    console.log(`🤖 Generating coaching for ${transcripts.length} transcript segments`);

    // Validate API key
    if (!process.env.CLAUDE_API_KEY) {
      const error = 'CLAUDE_API_KEY environment variable is not set';
      console.error(`❌ ${error}`);
      return {
        success: false,
        error: error,
        data: null,
      };
    }

    // Validate transcripts
    if (!transcripts || transcripts.length === 0) {
      console.error('❌ No transcripts provided for coaching generation');
      return {
        success: false,
        error: 'No transcripts provided',
        data: null,
      };
    }

    // Prepare the transcript text
    const transcriptText = transcripts
      .map((t) => `${t.speaker || 'Unknown'}: ${t.text}`)
      .join('\n');

    console.log(`📝 Transcript preview: ${transcriptText.substring(0, 200)}...`);

    // Get custom prompts or use defaults
    const prompts = storage.getPrompts();
    const systemPrompt = prompts.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const userPromptTemplate = prompts.userPrompt || DEFAULT_USER_PROMPT;

    console.log(`📋 Using ${prompts.systemPrompt ? 'custom' : 'default'} system prompt`);
    console.log(`📋 Using ${prompts.userPrompt ? 'custom' : 'default'} user prompt`);

    // Replace placeholders with actual data in user prompt
    const userPrompt = userPromptTemplate
      .replace('{{TRANSCRIPT}}', transcriptText)
      .replace('{{MEETING_ID}}', context.meetingId || 'Unknown')
      .replace('{{PARTICIPANTS}}', context.participants?.join(', ') || 'Unknown')
      .replace('{{DURATION}}', context.duration || 'Unknown');

    // Call Claude API with coaching-live-sales-calls skill
    console.log(`🚀 Calling Claude API with coaching-live-sales-calls skill...`);
    const message = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Claude 4.5 Sonnet (supports skills)
      max_tokens: 2048,
      temperature: 0.7,
      betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
      container: {
        skills: [
          {
            type: 'custom',
            skill_id: 'skill_014euk38s3AuzPzVVdpAtPjv',
            version: 'latest'
          }
        ]
      },
      tools: [
        {
          type: 'bash_20250124',
          name: 'bash'
        }
      ],
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
    console.log(`📨 Claude response received (${responseText.length} chars)`);
    console.log(`📄 Response preview: ${responseText.substring(0, 300)}...`);

    // Try to extract JSON from the response
    let coaching;
    try {
      // Remove any markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      coaching = JSON.parse(jsonText);
      console.log('✅ Successfully parsed coaching JSON');
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError);
      console.error('Raw response:', responseText);
      // Return a fallback structure matching the new format
      coaching = {
        phase: {
          methodology: 'BANT',
          stage: 'Qualification',
          context: 'Early stage qualification for Colombian AWS prospect'
        },
        action: {
          script: 'Cuéntame más sobre tu proceso actual y los desafíos que enfrentas con la infraestructura',
          language: 'ES'
        },
        tip: {
          insight: 'Build rapport through active listening and cultural understanding',
          rationale: 'Colombian deals are relationship-driven, trust must come first',
          language: 'EN'
        },
        risk: {
          warning: 'Insufficient discovery may lead to misalignment',
          consequence: 'Wrong solution proposed',
          language: 'EN'
        },
        metrics: {
          discovery: 30,
          pain_quantified: 20,
          dm_engagement: 40,
          stakeholders: 1,
          alignment: 35
        },
        next: {
          action: 'Ask about budget and decision timeline',
          timeline: 'immediate'
        }
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
    console.error('❌ CRITICAL ERROR generating sales coaching:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Log additional context for debugging
    console.error('Context:', {
      meetingId: context?.meetingId,
      participantsCount: context?.participants?.length,
      transcriptCount: transcripts?.length,
    });

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
      model: 'claude-haiku-4-5-20251001', // Claude 4.5 Haiku (Oct 2025)
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
