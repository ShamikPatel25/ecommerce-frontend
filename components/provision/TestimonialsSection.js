'use client';

import { Star } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem, GlowCard } from '@/components/storefront/animations';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Founder, Luxe Boutique',
    quote: 'Provision made it incredibly easy to launch our online store. We were up and running in under an hour with a beautiful storefront.',
    rating: 5,
    color: 'bg-orange-400',
  },
  {
    name: 'Michael Chen',
    role: 'CEO, TechGear Store',
    quote: 'The multi-tenant architecture is rock solid. We manage 50+ stores from one dashboard and inventory syncs in real-time.',
    rating: 5,
    color: 'bg-pink-400',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Owner, Artisan Crafts',
    quote: 'Real-time notifications and order management changed our workflow. Customer satisfaction has never been higher.',
    rating: 5,
    color: 'bg-purple-400',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.02] rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-20">
          <span className="text-orange-400 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Loved by{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Store Owners
            </span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.1}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <GlowCard className="h-full bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.05] transition-colors">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
