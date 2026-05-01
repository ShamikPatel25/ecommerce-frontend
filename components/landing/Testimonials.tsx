const testimonials = [
  {
    name: 'Alex Morgan',
    role: 'Founder, ShopSaaS',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-500',
    text: '"We launched 12 client stores in our first month. The auto subdomain feature saved us hundreds of hours in setup time. Our clients love the white-label experience."',
  },
  {
    name: 'Jessica Lin',
    role: 'CTO, BrandAgency',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-blue-500',
    text: '"The multi-tenant architecture is rock solid. We manage 50+ client stores from one dashboard. API-first design made integration with our internal tools seamless."',
  },
  {
    name: 'Marcus Chen',
    role: 'Head of E-commerce, MultiCorp',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500',
    text: '"We run 8 different brand stores across regions. StoreScale\'s centralized inventory and analytics gave us visibility we never had before. Scaling became effortless."',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">Trusted by Innovators</h2>
          <p className="text-gray-600 text-lg">See what our customers say about scaling with StoreScale.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 landing-hover-lift">
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${t.gradientFrom} ${t.gradientTo} mr-4 flex-shrink-0`} />
                <div>
                  <h4 className="font-bold text-gray-900">{t.name}</h4>
                  <p className="text-gray-600 text-sm">{t.role}</p>
                </div>
              </div>
              <p className="italic text-gray-700 mb-6 leading-relaxed">{t.text}</p>
              <div className="flex text-yellow-400 gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
