const steps = [
  {
    num: '1',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-600',
    title: 'Create Account',
    desc: 'Sign up, set your master brand domain, and configure default settings.',
  },
  {
    num: '2',
    color: 'purple',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-600',
    title: 'Setup Store',
    desc: 'Enter store name, customize branding, add products. Subdomain auto-generated.',
  },
  {
    num: '3',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-600',
    title: 'Launch Instantly',
    desc: 'Hit publish. Store goes live immediately with full SSL, CDN, and analytics.',
  },
];

export default function HowItWorks() {
  return (
    <section id="howitworks" className="py-20 bg-white landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">
            Launch Stores in 3 Steps
          </h2>
          <p className="text-gray-600 text-lg">From signup to launch in under 5 minutes.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {steps.map((step, i) => (
            <div key={i} className="md:w-1/3 text-center landing-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="relative inline-flex items-center justify-center mb-6">
                <div
                  className={`w-24 h-24 rounded-full ${step.bgClass} flex items-center justify-center text-3xl font-bold ${step.textClass} border-8 border-white landing-shadow-soft`}
                >
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute -right-8 hidden md:block w-16 h-0.5 bg-gradient-to-r from-gray-300 to-gray-100" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
              <p className="text-gray-600 max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Animated illustration placeholder */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center w-full max-w-md mx-auto h-64 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full landing-gradient-bg flex items-center justify-center landing-pulse-ring">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Instant Store Provisioning</p>
              <p className="text-gray-400 text-sm">Automated DNS • SSL • CDN</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
