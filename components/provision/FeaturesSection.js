'use client';

import {
  Store, Package, ShoppingCart, Bell,
  BarChart3, Globe, Shield, Users,
} from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem, TiltCard, SpotlightCard } from '@/components/storefront/animations';

const features = [
  { icon: Store, title: 'Custom Storefront', desc: 'Each store gets a unique subdomain with a beautiful, responsive storefront.' },
  { icon: Package, title: 'Product Management', desc: 'Manage single & variable products with variants, media, and inventory tracking.' },
  { icon: ShoppingCart, title: 'Order Processing', desc: 'Complete order lifecycle from creation to fulfillment with stock management.' },
  { icon: Bell, title: 'Real-Time Notifications', desc: 'WebSocket-powered alerts for orders, stock levels, and store activity.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track sales, orders, and performance metrics at a glance.' },
  { icon: Globe, title: 'Subdomain Routing', desc: 'Automatic subdomain provisioning — your-store.provision.com instantly.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'JWT authentication, tenant isolation, and encrypted data at rest.' },
  { icon: Users, title: 'Multi-Tenant Architecture', desc: 'Full data isolation between stores with shared infrastructure efficiency.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-20">
          <span className="text-orange-400 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
            Everything You Need
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Powerful Features,{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Zero Complexity
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Everything you need to launch, manage, and grow your online store — built in from day one.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.08}>
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <TiltCard intensity={8}>
                <SpotlightCard className="h-full bg-white/[0.03] border border-white/[0.06] rounded-3xl p-7 hover:bg-white/[0.05] transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
