import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Settings() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load current prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/settings/prompt');
      const data = await response.json();
      setSystemPrompt(data.systemPrompt || '');
      setUserPrompt(data.userPrompt || '');
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setMessage({ type: 'error', text: 'Failed to load prompts' });
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
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Prompts saved successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save prompts' });
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      setMessage({ type: 'error', text: 'Failed to save prompts' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default prompts? This cannot be undone.')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/prompt', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.systemPrompt);
        setUserPrompt(data.userPrompt);
        setMessage({ type: 'success', text: 'Prompts reset to default' });
      }
    } catch (error) {
      console.error('Error resetting prompts:', error);
      setMessage({ type: 'error', text: 'Failed to reset prompts' });
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
            <p className="text-gray-600 mt-2">Configure your AI coaching prompts</p>
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* System Prompt Editor */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    System Prompt
                  </h2>
                  <p className="text-sm text-gray-600">
                    Defines Claude's role, personality, and output format. This sets the context for how Claude should behave.
                  </p>
                </div>

                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 bg-white font-mono text-sm resize-y"
                  placeholder="Enter system prompt here..."
                />
              </div>

              {/* User Prompt Editor */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    User Prompt Template
                  </h2>
                  <p className="text-sm text-gray-600">
                    Contains the actual data to analyze. Use placeholders:{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{TRANSCRIPT}}'}</code>,{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{MEETING_ID}}'}</code>,{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{PARTICIPANTS}}'}</code>,{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{DURATION}}'}</code>
                  </p>
                </div>

                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 bg-white font-mono text-sm resize-y"
                  placeholder="Enter user prompt template here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Prompts'}
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

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              💡 Best Practices for Prompt Engineering
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li><strong>System Prompt:</strong> Define Claude's role, expertise, and output format. Keep it focused on "who" Claude is and "how" to respond.</li>
              <li><strong>User Prompt:</strong> Provide the specific task and data to analyze. Use placeholders for dynamic content.</li>
              <li><strong>Separation Benefits:</strong> Separating prompts improves Claude's understanding and response quality.</li>
              <li><strong>Placeholders:</strong> Use <code className="bg-white px-1 py-0.5 rounded">{'{{TRANSCRIPT}}'}</code>, <code className="bg-white px-1 py-0.5 rounded">{'{{MEETING_ID}}'}</code>, <code className="bg-white px-1 py-0.5 rounded">{'{{PARTICIPANTS}}'}</code>, <code className="bg-white px-1 py-0.5 rounded">{'{{DURATION}}'}</code> in user prompt only.</li>
              <li><strong>JSON Output:</strong> Request structured JSON in system prompt for consistent parsing.</li>
              <li><strong>Testing:</strong> Test your custom prompts with sample calls before production use.</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
