import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [meetingId, setMeetingId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [botCreated, setBotCreated] = useState(null);
  const router = useRouter();

  const handleViewDashboard = (e) => {
    e.preventDefault();
    if (meetingId.trim()) {
      router.push(`/dashboard/${encodeURIComponent(meetingId.trim())}`);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBotCreated(null);

    try {
      const response = await fetch('/api/bot/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_url: meetingUrl,
          bot_name: 'Sales Coach AI',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBotCreated(result.data);
        setError('');
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push(result.data.dashboard_url);
        }, 3000);
      } else {
        setError(result.message || 'Failed to create bot');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Real-Time Sales Coaching System</title>
        <meta name="description" content="AI-powered real-time sales coaching for Microsoft Teams calls" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Real-Time Sales Coaching
              </h1>
              <p className="text-xl text-gray-600">
                AI-powered coaching for your Microsoft Teams sales calls
              </p>
            </div>

            {/* Create Bot Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  🤖 Start New Coaching Session
                </h2>
                <p className="text-gray-600">
                  Create a bot to join your Microsoft Teams meeting
                </p>
              </div>

              {botCreated && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">✅</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 mb-2">Bot Created Successfully!</h3>
                      <p className="text-sm text-green-700 mb-2">
                        Meeting ID: <code className="bg-white px-2 py-1 rounded">{botCreated.meeting_id}</code>
                      </p>
                      <p className="text-sm text-green-700 mb-3">
                        Redirecting to dashboard in 3 seconds...
                      </p>
                      <a
                        href={botCreated.dashboard_url}
                        className="text-sm text-green-800 underline hover:text-green-900"
                      >
                        Click here to go now →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">❌ {error}</p>
                </div>
              )}

              <form onSubmit={handleCreateBot} className="space-y-4">
                <div>
                  <label
                    htmlFor="meetingUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Microsoft Teams Meeting URL
                  </label>
                  <input
                    type="url"
                    id="meetingUrl"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://teams.microsoft.com/l/meetup-join/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste your Teams meeting link here
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Bot...
                    </span>
                  ) : (
                    '🚀 Create Bot & Start Coaching'
                  )}
                </button>
              </form>
            </div>

            {/* View Existing Dashboard Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  📊 View Existing Session
                </h2>
                <p className="text-gray-600">
                  Enter a meeting ID to view coaching insights
                </p>
              </div>

              <form onSubmit={handleViewDashboard} className="space-y-4">
                <div>
                  <label
                    htmlFor="meetingId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Meeting ID or Bot ID
                  </label>
                  <input
                    type="text"
                    id="meetingId"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="Enter meeting ID..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  View Dashboard
                </button>
              </form>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-primary-600 text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Real-Time Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Get instant coaching insights as the conversation unfolds
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-primary-600 text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Actionable Tips
                </h3>
                <p className="text-sm text-gray-600">
                  Receive specific recommendations to improve your sales technique
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-primary-600 text-3xl mb-3">🤖</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  AI-Powered
                </h3>
                <p className="text-sm text-gray-600">
                  Leveraging Claude AI for intelligent sales coaching
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3">
                🚀 How It Works
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Paste your Microsoft Teams meeting URL above</li>
                <li>Click "Create Bot" - our AI assistant will join your meeting</li>
                <li>The bot listens and transcribes in real-time with low latency</li>
                <li>View the dashboard on a second screen during your call</li>
                <li>Get instant AI-powered coaching recommendations as you speak</li>
              </ol>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  <strong>Webhook URL:</strong> <code className="bg-white px-2 py-1 rounded">https://mvp-rtsc.vercel.app/api/webhook/recall</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
