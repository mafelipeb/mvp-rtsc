import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Settings() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load current prompt on mount
  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    try {
      const response = await fetch('/api/settings/prompt');
      const data = await response.json();
      setPrompt(data.prompt || '');
    } catch (error) {
      console.error('Error fetching prompt:', error);
      setMessage({ type: 'error', text: 'Failed to load prompt' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/settings/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Prompt saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save prompt' });
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      setMessage({ type: 'error', text: 'Failed to save prompt' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default prompt? This cannot be undone.')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/prompt', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt);
        setMessage({ type: 'success', text: 'Prompt reset to default' });
      }
    } catch (error) {
      console.error('Error resetting prompt:', error);
      setMessage({ type: 'error', text: 'Failed to reset prompt' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Settings - Sales Coaching</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Configure your AI coaching prompt</p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Prompt Editor */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                AI Coaching Prompt
              </h2>
              <p className="text-sm text-gray-600">
                Customize the prompt sent to Claude for generating sales coaching recommendations.
                Use <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{TRANSCRIPT}}'}</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{MEETING_ID}}'}</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{PARTICIPANTS}}'}</code>, and{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{DURATION}}'}</code> as placeholders.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 bg-white font-mono text-sm resize-y"
                  placeholder="Enter your custom prompt here..."
                />

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Prompt'}
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    Reset to Default
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              💡 Prompt Customization Tips
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Use placeholders to inject dynamic data: <code className="bg-white px-1 py-0.5 rounded">{'{{TRANSCRIPT}}'}</code>, <code className="bg-white px-1 py-0.5 rounded">{'{{MEETING_ID}}'}</code>, etc.</li>
              <li>Request structured JSON output for consistent parsing</li>
              <li>Be specific about the coaching categories you want (questioning, active listening, etc.)</li>
              <li>Include examples in your prompt for better results</li>
              <li>Test your custom prompt with a sample call before using in production</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
