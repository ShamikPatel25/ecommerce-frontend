'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import {
  PageTransition, ScrollReveal, Marquee, NumberTicker, MagneticButton,
} from '@/components/storefront/animations';
import { getBaseUrl } from '@/lib/subdomain';

import HeroSection from '@/components/provision/HeroSection';
import FeaturesSection from '@/components/provision/FeaturesSection';
import HowItWorksSection from '@/components/provision/HowItWorksSection';
import TestimonialsSection from '@/components/provision/TestimonialsSection';
import PricingSection from '@/components/provision/PricingSection';

export default function ProvisionPage() {
  const base = getBaseUrl();

  return (
    <PageTransition>
      {/* Hero */}
      <HeroSection />

      {/* Marquee */}
      <section className="py-8 border-y border-white/[0.06] bg-white/[0.01]">
        <Marquee speed={40}>
          {['Next.js', 'Django', 'React', 'Tailwind', 'WebSockets', 'Redis', 'PostgreSQL', 'Docker'].map((tech) => (
            <span key={tech} className="mx-8 text-sm font-bold text-white/20 uppercase tracking-[0.2em]">
              {tech}
            </span>
          ))}
        </Marquee>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Stats */}
      <section className="py-24 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 2500, prefix: '', suffix: '+', label: 'Stores Launched' },
              { value: 100000, prefix: '', suffix: '+', label: 'Products Listed' },
              { value: 99.9, prefix: '', suffix: '%', label: 'Uptime' },
              { value: 50, prefix: '', suffix: '+', label: 'Countries' },
            ].map((stat) => (
              <ScrollReveal key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-2">
                  <NumberTicker value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <p className="text-white/40 text-sm font-medium">{stat.label}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/[0.06] rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal>
            <motion.div
              className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-12 md:p-16"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Ready to launch?</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Start Building Your{' '}
                <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Dream Store
                </span>
              </h2>

              <p className="text-white/40 text-lg max-w-xl mx-auto mb-10">
                Join thousands of merchants who trust Provision to power their online business.
                Get started for free — no credit card required.
              </p>

              <MagneticButton
                as="a"
                href={`${base}/register`}
                className="group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </PageTransition>
  );
}
