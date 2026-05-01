'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden landing-bg-mesh">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center">
        {/* Left Column — Copy */}
        <div className="md:w-1/2 mb-12 md:mb-0 landing-fade-in-up">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold mb-6">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 landing-pulse-ring" />
            Trusted by 1,000+ stores
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-gray-900">
            Build once,{' '}
            <span className="landing-gradient-text">scale infinitely</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
            Launch multiple white-label eCommerce stores with auto subdomain provisioning. Perfect for
            startups, agencies, and multi-brand businesses.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/register"
              className="landing-gradient-bg landing-glow-btn text-white text-lg font-semibold py-4 px-8 rounded-xl text-center landing-shadow-hard inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#demo"
              className="border-2 border-gray-300 text-gray-700 text-lg font-semibold py-4 px-8 rounded-xl text-center hover:border-purple-500 hover:text-purple-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Demo
            </a>
          </div>
          <p className="mt-6 text-gray-500 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            No credit card required • 14-day free trial
          </p>
        </div>

        {/* Right Column — Dashboard Preview */}
        <div className="md:w-1/2 relative landing-fade-in-up landing-delay-200">
          <div className="relative landing-float">
            {/* Decorative Blobs */}
            <div className="absolute -top-6 -left-6 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply blur-3xl opacity-30" />
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply blur-3xl opacity-30" />

            {/* Dashboard Card */}
            <div className="relative bg-white rounded-2xl landing-shadow-hard p-6 border border-gray-100">
              {/* Traffic Lights */}
              <div className="flex space-x-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mb-4">
                <span className="text-sm text-gray-500">Central Admin Dashboard</span>
                <h3 className="font-bold text-lg text-gray-900">YourBrand.StoreScale.com</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">12</div>
                  <div className="text-sm text-gray-600">Active Stores</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">542</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">client1.yourbrand.com</div>
                    <div className="text-xs text-gray-500">Last order: 2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">client2.yourbrand.com</div>
                    <div className="text-xs text-gray-500">Last order: 5 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="font-medium text-purple-600">Add New Store</div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl landing-shadow-soft border border-gray-100">
            <div className="text-xs text-gray-500">Auto-generated in 3 seconds</div>
            <div className="font-mono text-sm text-gray-800">store-name.yourbrand.com</div>
          </div>
        </div>
      </div>
    </section>
  );
}
