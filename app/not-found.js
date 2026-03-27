'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <p className="text-8xl font-black text-slate-200 select-none">404</p>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page Not Found</h1>

        <p className="mt-2 text-slate-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or
          doesn&apos;t exist.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#ff6600] text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Go to Dashboard
          </Link>

          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-slate-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
