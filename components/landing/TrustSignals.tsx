const stats = [
  { value: '1000+', label: 'Stores Created' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<3s', label: 'Store Launch Time' },
  { value: '24/7', label: 'Monitoring' },
];

const badges = [
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'SOC 2 Compliant' },
  { icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', label: 'PostgreSQL' },
  { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Docker Containers' },
  { icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', label: 'AWS & Google Cloud' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'End-to-End Encryption' },
];

export default function TrustSignals() {
  return (
    <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6">Built on Enterprise-Grade Infrastructure</h2>
          <p className="text-gray-300 text-lg">Reliable, secure, and scalable from day one.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-5xl font-extrabold mb-2 landing-counter">{s.value}</div>
              <div className="text-gray-300">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap justify-center items-center gap-6">
          {badges.map((b, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl text-center hover:bg-white/20 transition-colors min-w-[120px]">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon} />
              </svg>
              <div className="text-sm font-medium">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
