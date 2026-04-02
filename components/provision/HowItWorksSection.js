'use client';

import { UserPlus, Palette, Rocket } from 'lucide-react';
import { ScrollReveal, FloatingElement, GlowCard } from '@/components/storefront/animations';

const steps = [
  { icon: UserPlus, title: 'Create Account', desc: 'Sign up in seconds with just your email. No credit card required.' },
  { icon: Palette, title: 'Set Up Store', desc: 'Choose your subdomain, add products, and customize your storefront.' },
  { icon: Rocket, title: 'Go Live', desc: 'Your store is instantly live. Share your link and start selling.' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-20">
          <span className="text-orange-400 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
            Simple Process
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Up and Running in{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Three Steps
            </span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-orange-500/30 via-pink-500/30 to-purple-500/30" />

          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.15}>
              <GlowCard className="relative text-center p-8 bg-white/[0.03] border border-white/[0.06] rounded-3xl hover:bg-white/[0.05] transition-colors">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-black text-sm mx-auto mb-6 shadow-lg shadow-orange-500/20">
                    {i + 1}
                  </div>

                  <FloatingElement distance={10} duration={4 + i}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                      <step.icon className="w-8 h-8 text-orange-400" />
                    </div>
                  </FloatingElement>

                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </GlowCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
