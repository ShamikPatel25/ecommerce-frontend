'use client';

import Link from 'next/link';

export default function Error({ error, reset }) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-orange-100">
          <span className="text-3xl font-bold text-[#ff6600]">!</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">Something went wrong</h1>

        <p className="mt-2 text-slate-500">
          An unexpected error occurred. You can try again or head back to the dashboard.
        </p>

        {error?.message && (
          <pre className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 overflow-x-auto text-left">
            <code>{error.message}</code>
          </pre>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#ff6600] text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-slate-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
