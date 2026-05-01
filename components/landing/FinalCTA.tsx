import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 landing-section">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-5xl font-extrabold mb-6 text-gray-900">
          Launch Your eCommerce SaaS Today
        </h2>
        <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of businesses scaling their eCommerce operations with StoreScale. Start your
          14-day free trial—no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <Link
            href="/register"
            className="landing-gradient-bg landing-glow-btn text-white text-lg font-semibold py-4 px-10 rounded-xl landing-shadow-hard inline-flex items-center justify-center gap-2"
          >
            Start Free Trial
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="#demo"
            className="border-2 border-gray-800 text-gray-900 text-lg font-semibold py-4 px-10 rounded-xl hover:bg-gray-800 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Demo
          </a>
        </div>
        <div className="inline-flex flex-wrap justify-center items-center gap-6 text-gray-700">
          {['No setup fees', 'Cancel anytime', '14-day free trial'].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
