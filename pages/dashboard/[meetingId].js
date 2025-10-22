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
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [meetingId]);

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
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
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
  const getTypeColor = (type) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'improvement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'strength':
        return '✅';
      case 'improvement':
        return '💡';
      case 'warning':
        return '⚠️';
      default:
        return '📋';
    }
  };

  if (!coaching.recommendations) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Processing coaching data...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Overall Sentiment */}
      {coaching.overallSentiment && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Sentiment: {coaching.overallSentiment}
          </span>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        {coaching.recommendations?.map((rec, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 ${getTypeColor(rec.type)}`}
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg">{getTypeIcon(rec.type)}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
                <p className="text-sm">{rec.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-white rounded">
                    {rec.category}
                  </span>
                  <span className="text-xs px-2 py-1 bg-white rounded">
                    {rec.priority} priority
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coaching Tips */}
      {coaching.coachingTips && coaching.coachingTips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            💬 Real-Time Tips
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {coaching.coachingTips.map((tip, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {coaching.nextSteps && coaching.nextSteps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            🎯 Next Steps
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {coaching.nextSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
