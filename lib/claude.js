import Anthropic from '@anthropic-ai/sdk';

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

    // Create the coaching prompt
    const prompt = `You are an expert sales coach analyzing a real-time sales call. Based on the following transcript, provide actionable coaching recommendations.

TRANSCRIPT:
${transcriptText}

CONTEXT:
- Meeting ID: ${context.meetingId || 'Unknown'}
- Participants: ${context.participants?.join(', ') || 'Unknown'}
- Call Duration: ${context.duration || 'Unknown'}

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

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
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
    const prompt = `As a sales coach, provide a brief real-time insight about this statement from a ${speaker}:

"${text}"

Respond with a JSON object containing a single coaching tip:
{
  "tip": "Brief actionable tip",
  "category": "questioning|active_listening|objection_handling|rapport_building|closing|other",
  "sentiment": "positive|neutral|negative"
}

Provide only the JSON response.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: prompt,
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
