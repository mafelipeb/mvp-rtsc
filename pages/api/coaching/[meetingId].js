import storage from '@/lib/storage';

/**
 * API endpoint to retrieve coaching data for a specific meeting
 * GET /api/coaching/[meetingId] - Get all coaching data
 * GET /api/coaching/[meetingId]?latest=true - Get only latest recommendations
 */
export default async function handler(req, res) {
  const { meetingId } = req.query;

  if (!meetingId) {
    return res.status(400).json({ error: 'Meeting ID is required' });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if only latest data is requested
    const latestOnly = req.query.latest === 'true';

    if (latestOnly) {
      // Return only the latest coaching recommendations
      const latestCoaching = storage.getLatestCoaching(meetingId, 5);
      const recentTranscripts = storage.getRecentTranscripts(meetingId, 10);

      return res.status(200).json({
        success: true,
        data: {
          meetingId,
          coaching: latestCoaching,
          transcripts: recentTranscripts,
          lastUpdate: new Date().toISOString(),
        },
      });
    }

    // Return full call data
    const callData = storage.getCall(meetingId);

    if (!callData) {
      return res.status(404).json({
        error: 'Meeting not found',
        message: `No data found for meeting ${meetingId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: callData,
    });
  } catch (error) {
    console.error('Error retrieving coaching data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
