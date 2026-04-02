'use client';

import { Check } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem, TiltCard, MagneticButton } from '@/components/storefront/animations';
import { getBaseUrl } from '@/lib/subdomain';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'Perfect for trying things out.',
    features: ['1 Store', 'Up to 50 products', 'Basic analytics', 'Community support', 'Custom subdomain'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For growing businesses.',
    features: ['5 Stores', 'Unlimited products', 'Advanced analytics', 'Priority support', 'Custom domain', 'Real-time notifications', 'API access'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    desc: 'For large-scale operations.',
    features: ['Unlimited stores', 'Unlimited products', 'Full analytics suite', '24/7 dedicated support', 'Custom domains', 'White-label option', 'SLA guarantee', 'SSO / SAML'],
    highlighted: false,
  },
];

export default function PricingSection() {
  const base = getBaseUrl();

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-pink-500/[0.03] rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-20">
          <span className="text-orange-400 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Simple,{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Transparent
            </span>
            {' '}Pricing
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" staggerDelay={0.1}>
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <TiltCard intensity={6}>
                <div
                  className={`relative rounded-3xl p-8 transition-colors ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-orange-500/10 to-pink-500/10 border-2 border-orange-500/30'
                      : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-xs font-bold text-white shadow-lg shadow-orange-500/20">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
                  <p className="text-white/40 text-sm mb-6">{plan.desc}</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/40 text-sm">{plan.period}</span>
                  </div>

                  <MagneticButton
                    as="a"
                    href={`${base}/register`}
                    className={`block w-full text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
                        : 'bg-white/[0.06] text-white border border-white/[0.1] hover:bg-white/[0.1]'
                    }`}
                  >
                    Get Started
                  </MagneticButton>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-3 text-sm text-white/50">
                        <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
