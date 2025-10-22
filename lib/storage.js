/**
 * In-memory storage for call contexts and coaching data
 * Note: This is ephemeral storage that resets on serverless function cold starts
 * For production, consider using Redis, Upstash, or a database
 */

class CallStorage {
  constructor() {
    this.calls = new Map();
  }

  /**
   * Initialize or get a call context
   * @param {string} meetingId - The unique meeting identifier
   * @returns {Object} Call context
   */
  getOrCreateCall(meetingId) {
    if (!this.calls.has(meetingId)) {
      this.calls.set(meetingId, {
        meetingId,
        transcripts: [],
        coachingRecommendations: [],
        participants: new Set(),
        startTime: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
      });
    }
    return this.calls.get(meetingId);
  }

  /**
   * Add a transcript segment to a call
   * @param {string} meetingId - The unique meeting identifier
   * @param {Object} transcript - The transcript data
   */
  addTranscript(meetingId, transcript) {
    const call = this.getOrCreateCall(meetingId);
    call.transcripts.push({
      ...transcript,
      timestamp: new Date().toISOString(),
    });
    call.lastUpdate = new Date().toISOString();

    // Track participants
    if (transcript.speaker) {
      call.participants.add(transcript.speaker);
    }
  }

  /**
   * Add coaching recommendations to a call
   * @param {string} meetingId - The unique meeting identifier
   * @param {Object} coaching - The coaching data
   */
  addCoaching(meetingId, coaching) {
    const call = this.getOrCreateCall(meetingId);
    call.coachingRecommendations.push({
      ...coaching,
      timestamp: new Date().toISOString(),
    });
    call.lastUpdate = new Date().toISOString();
  }

  /**
   * Get all data for a specific call
   * @param {string} meetingId - The unique meeting identifier
   * @returns {Object|null} Call data or null if not found
   */
  getCall(meetingId) {
    const call = this.calls.get(meetingId);
    if (!call) return null;

    // Convert participants Set to Array for JSON serialization
    return {
      ...call,
      participants: Array.from(call.participants),
    };
  }

  /**
   * Get the latest coaching recommendations for a call
   * @param {string} meetingId - The unique meeting identifier
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Array} Coaching recommendations
   */
  getLatestCoaching(meetingId, limit = 5) {
    const call = this.calls.get(meetingId);
    if (!call) return [];

    return call.coachingRecommendations
      .slice(-limit)
      .reverse();
  }

  /**
   * Get recent transcript segments
   * @param {string} meetingId - The unique meeting identifier
   * @param {number} limit - Maximum number of segments to return
   * @returns {Array} Transcript segments
   */
  getRecentTranscripts(meetingId, limit = 10) {
    const call = this.calls.get(meetingId);
    if (!call) return [];

    return call.transcripts
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all active calls
   * @returns {Array} List of all call IDs
   */
  getAllCalls() {
    return Array.from(this.calls.keys());
  }

  /**
   * Delete a call from storage
   * @param {string} meetingId - The unique meeting identifier
   */
  deleteCall(meetingId) {
    this.calls.delete(meetingId);
  }

  /**
   * Clear all data (for testing purposes)
   */
  clear() {
    this.calls.clear();
  }
}

// Singleton instance
const storage = new CallStorage();

module.exports = storage;
