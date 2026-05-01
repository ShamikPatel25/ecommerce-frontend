export default function ProblemSolution() {
  return (
    <section className="py-20 bg-white landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">
            From Complexity to Simplicity
          </h2>
          <p className="text-gray-600 text-lg">
            Managing multiple eCommerce stores shouldn&apos;t require multiple platforms, teams, and headaches.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Problem Card */}
          <div className="bg-red-50 p-8 rounded-2xl border border-red-100 landing-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-red-800">The Problem</h3>
            <ul className="space-y-4">
              {[
                { title: 'Complex Management:', desc: 'Separate dashboards, logins, and updates for each store' },
                { title: 'No White-Label Flexibility:', desc: "Can't brand stores as your own" },
                { title: 'Scaling Infrastructure:', desc: 'Costly server provisioning for each new store' },
                { title: 'Fragmented Analytics:', desc: 'No unified view of performance across stores' },
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>{item.title}</strong> {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution Card */}
          <div className="bg-green-50 p-8 rounded-2xl border border-green-100 landing-fade-in-up landing-delay-200">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-green-800">The StoreScale Solution</h3>
            <ul className="space-y-4">
              {[
                { title: 'One Platform, Unlimited Stores:', desc: 'Centralized dashboard for everything' },
                { title: 'Full White-Label:', desc: 'Your branding, your domain, your identity' },
                { title: 'Auto Subdomain Provisioning:', desc: 'Launch stores in seconds with automatic setup' },
                { title: 'Unified Analytics:', desc: 'Track all stores from one dashboard with real-time insights' },
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>{item.title}</strong> {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
