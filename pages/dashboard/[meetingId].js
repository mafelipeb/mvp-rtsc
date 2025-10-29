import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { meetingId } = router.query;

  const [coachingData, setCoachingData] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingStatus, setMeetingStatus] = useState('unknown');

  // Fetch coaching data
  useEffect(() => {
    if (!meetingId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/coaching/${meetingId}?latest=true`);
        const result = await response.json();

        if (result.success) {
          setCoachingData(result.data.coaching);
          setTranscripts(result.data.transcripts);
          setMeetingStatus(result.data.status || 'unknown');
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 5 seconds
    // If meeting ended, slow down polling to every 30 seconds
    const pollInterval = meetingStatus === 'ended' ? 30000 : 5000;
    const interval = setInterval(fetchData, pollInterval);

    return () => clearInterval(interval);
  }, [meetingId, meetingStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coaching data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - {meetingId} | Sales Coaching</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-1 block">
                  ← Back to Home
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sales Coaching Dashboard
                </h1>
                <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
              </div>
              <div className="flex items-center space-x-2">
                {meetingStatus === 'ended' ? (
                  <>
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Meeting Ended</span>
                  </>
                ) : meetingStatus === 'active' ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Waiting...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Meeting Ended Banner */}
          {meetingStatus === 'ended' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✅</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Meeting Has Ended</h3>
                  <p className="text-sm text-blue-800">
                    The bot has left the meeting. You can still review all transcripts and coaching recommendations below.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coaching Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Coaching Insights
                </h2>

                {error && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      {error === 'Meeting not found' ? (
                        <>
                          No data yet for this meeting. Make sure:
                          <ul className="list-disc list-inside mt-2 ml-2">
                            <li>The Recall.ai bot is in your Teams call</li>
                            <li>The webhook is properly configured</li>
                            <li>The meeting ID is correct</li>
                          </ul>
                        </>
                      ) : (
                        error
                      )}
                    </p>
                  </div>
                )}

                {!coachingData || coachingData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-600">
                      Waiting for coaching insights...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Insights will appear as the conversation progresses
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coachingData.map((coaching, index) => (
                      <CoachingCard key={index} coaching={coaching} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Recent Transcript
                </h2>

                {transcripts.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No transcript available yet...
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcripts.map((transcript, index) => (
                      <div key={index} className="border-l-2 border-primary-300 pl-3">
                        <p className="text-sm font-medium text-gray-700">
                          {transcript.speaker}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {transcript.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(transcript.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function CoachingCard({ coaching }) {
  // Handle both old and new format for backwards compatibility
  const isNewFormat = coaching.phase && coaching.action && coaching.tip;

  if (!isNewFormat && !coaching.recommendations) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Processing coaching data...</p>
      </div>
    );
  }

  // Render new format
  if (isNewFormat) {
    return (
      <div className="border border-gray-200 rounded-lg p-5 space-y-4">
        {/* Phase & Context */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {coaching.phase?.methodology}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                {coaching.phase?.stage}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{coaching.phase?.context}</p>
          </div>
        </div>

        {/* Suggested Script Action */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 text-sm mb-1">Say This Next</h4>
              <p className="text-green-800 font-medium">"{coaching.action?.script}"</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800 mt-2">
                {coaching.action?.language}
              </span>
            </div>
          </div>
        </div>

        {/* Insight & Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Insight</h4>
              <p className="text-blue-800 text-sm mb-2">{coaching.tip?.insight}</p>
              <p className="text-blue-700 text-xs italic">Why: {coaching.tip?.rationale}</p>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        {coaching.risk && (coaching.risk.warning || coaching.risk.consequence) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 text-sm mb-1">Risk Alert</h4>
                <p className="text-red-800 text-sm mb-1">{coaching.risk.warning}</p>
                <p className="text-red-700 text-xs">⚡ {coaching.risk.consequence}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        {coaching.metrics && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 text-sm mb-3">📊 Sales Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <MetricBar label="Discovery" value={coaching.metrics.discovery} />
              <MetricBar label="Pain Quantified" value={coaching.metrics.pain_quantified} />
              <MetricBar label="DM Engagement" value={coaching.metrics.dm_engagement} />
              <MetricBar label="Alignment" value={coaching.metrics.alignment} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Stakeholders:</span> {coaching.metrics.stakeholders || 0}
              </p>
            </div>
          </div>
        )}

        {/* Next Action */}
        {coaching.next && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">🎯</span>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 text-sm mb-1">Next Action</h4>
                <p className="text-purple-800 text-sm">{coaching.next.action}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-200 text-purple-800 mt-2">
                  {coaching.next.timeline}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Legacy format rendering (kept for backwards compatibility)
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          Legacy Format
        </span>
      </div>
      <p className="text-sm text-gray-600">Displaying data in old format. Please update prompts.</p>
    </div>
  );
}

function MetricBar({ label, value }) {
  const getColor = (val) => {
    if (val >= 70) return 'bg-green-500';
    if (val >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor(value)}`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
