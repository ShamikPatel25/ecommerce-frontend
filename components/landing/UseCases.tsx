const useCases = [
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'SaaS Founders',
    desc: 'Launch your own eCommerce SaaS without building infrastructure from scratch.',
    gradient: 'from-blue-50 to-white',
    border: 'border-blue-100',
    iconBg: 'bg-blue-600',
  },
  {
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: 'Agencies',
    desc: 'Manage client stores under your brand with centralized billing and support.',
    gradient: 'from-purple-50 to-white',
    border: 'border-purple-100',
    iconBg: 'bg-purple-600',
  },
  {
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    title: 'Multi-Brand Businesses',
    desc: 'Run separate stores for different product lines or geographic regions.',
    gradient: 'from-green-50 to-white',
    border: 'border-green-100',
    iconBg: 'bg-green-600',
  },
  {
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
    title: 'Marketplace Builders',
    desc: 'Create a platform where vendors can have their own branded storefronts.',
    gradient: 'from-red-50 to-white',
    border: 'border-red-100',
    iconBg: 'bg-red-600',
  },
];

export default function UseCases() {
  return (
    <section className="py-20 bg-white landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">Perfect For</h2>
          <p className="text-gray-600 text-lg">From startups to enterprises, StoreScale fits your use case.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((uc, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${uc.gradient} p-8 rounded-2xl border ${uc.border} landing-hover-lift`}
            >
              <div className={`w-12 h-12 rounded-xl ${uc.iconBg} flex items-center justify-center mb-6`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={uc.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{uc.title}</h3>
              <p className="text-gray-600">{uc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
