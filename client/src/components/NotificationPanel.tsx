import { useState } from 'react';
import { api } from '../api/client';

type NotificationState = 'idle' | 'loading' | 'success' | 'error';

interface NotificationResponse {
    success: boolean;
    message: string;
    error?: string;
}

export default function NotificationPanel() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [state, setState] = useState<NotificationState>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!title.trim()) {
            setMessage('Title is required');
            setState('error');
            return;
        }

        if (!body.trim()) {
            setMessage('Body is required');
            setState('error');
            return;
        }

        setState('loading');
        setMessage('');

        try {
            const response = await api.post<NotificationResponse>(
                '/notifications/send',
                {
                    title: title.trim(),
                    body: body.trim(),
                }
            );

            if (response.data.success) {
                setMessage(response.data.message);
                setState('success');
                setTitle('');
                setBody('');

                // Auto-clear success message after 5 seconds
                setTimeout(() => {
                    setState('idle');
                    setMessage('');
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to send notification:', error);

            if (error instanceof Error) {
                setMessage(error.message);
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as any;
                if (axiosError.response?.data?.error) {
                    setMessage(axiosError.response.data.error);
                } else {
                    setMessage('Failed to send notification. Please try again.');
                }
            } else {
                setMessage('An unexpected error occurred');
            }

            setState('error');
        }
    };

    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">
                Send Notification
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                            Notification Title
                        </label>

                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter notification title"
                            disabled={state === 'loading'}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Body Input */}
                    <div>
                        <label htmlFor="body" className="block text-sm font-medium text-slate-300 mb-2">
                            Notification Body
                        </label>

                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Enter notification message"
                            disabled={state === 'loading'}
                            rows={4}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                        />
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div
                            className={`p-4 rounded-lg text-sm ${
                                state === 'success'
                                    ? 'bg-green-900 bg-opacity-30 border border-green-500 text-green-300'
                                    : state === 'error'
                                    ? 'bg-red-900 bg-opacity-30 border border-red-500 text-red-300'
                                    : 'bg-blue-900 bg-opacity-30 border border-blue-500 text-blue-300'
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={state === 'loading'}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                            state === 'loading'
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800'
                        }`}
                    >
                        {state === 'loading' ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                                Sending...
                            </span>
                        ) : (
                            'Send Notification to All Users'
                        )}
                    </button>
                </form>

                {/* Info Section */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                        This will send a notification to all registered users on the platform.
                        Please ensure the message is appropriate and clear.
                    </p>
                </div>
            </div>
        </div>
    );
}
