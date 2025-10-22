import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [meetingId, setMeetingId] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (meetingId.trim()) {
      router.push(`/dashboard/${encodeURIComponent(meetingId.trim())}`);
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

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Get Started
                </h2>
                <p className="text-gray-600">
                  Enter your meeting ID to view real-time coaching insights
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="meetingId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Meeting ID
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
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
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

            {/* Setup Instructions */}
            <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3">
                🚀 Setup Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Configure your Recall.ai bot for Microsoft Teams</li>
                <li>Set the webhook URL to: <code className="bg-white px-2 py-1 rounded text-xs">/api/webhook/recall</code></li>
                <li>Start your Teams meeting and invite the Recall.ai bot</li>
                <li>Use the meeting ID to access the coaching dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
