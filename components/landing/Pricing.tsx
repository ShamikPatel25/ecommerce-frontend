import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    tagline: 'For individuals & small teams',
    price: '$49',
    featured: false,
    features: [
      { text: 'Up to 5 stores', included: true },
      { text: 'White-label branding', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom domain support', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Growth',
    tagline: 'For agencies & growing businesses',
    price: '$149',
    featured: true,
    features: [
      { text: 'Up to 25 stores', included: true },
      { text: 'White-label branding', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom domain support', included: true },
      { text: 'API access', included: true },
    ],
  },
  {
    name: 'Scale',
    tagline: 'For enterprises & high-volume',
    price: '$499',
    featured: false,
    features: [
      { text: 'Unlimited stores', included: true },
      { text: 'White-label branding', included: true },
      { text: 'Enterprise analytics', included: true },
      { text: '24/7 phone support', included: true },
      { text: 'Custom domain support', included: true },
      { text: 'Full API access + Webhooks', included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 landing-bg-mesh landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">Simple, Predictable Pricing</h2>
          <p className="text-gray-600 text-lg">Scale from 1 to 1,000 stores without surprise fees.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl p-8 landing-hover-lift relative ${
                plan.featured
                  ? 'landing-shadow-hard border-2 border-purple-600'
                  : 'landing-shadow-soft border border-gray-100'
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="landing-gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                <p className="text-gray-600">{plan.tagline}</p>
                <div className="mt-6">
                  <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((f, j) => (
                  <li key={j} className={`flex items-center ${!f.included ? 'text-gray-400' : ''}`}>
                    {f.included ? (
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center font-semibold py-3 rounded-xl transition ${
                  plan.featured
                    ? 'landing-gradient-bg text-white landing-shadow-soft hover:opacity-90'
                    : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">All plans include 14-day free trial. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
