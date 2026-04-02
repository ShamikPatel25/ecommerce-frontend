'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { TextReveal, MagneticButton } from '@/components/storefront/animations';
import { getBaseUrl } from '@/lib/subdomain';

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const base = getBaseUrl();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-pink-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-white/70">Now in Public Beta</span>
        </motion.div>

        {/* Title */}
        <TextReveal className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6" delay={0.3}>
          <span className="text-white">Launch Your</span>
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Online Store
          </span>
          <br />
          <span className="text-white">In Minutes</span>
        </TextReveal>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
        >
          The modern multi-tenant e-commerce platform. Create a stunning storefront,
          manage products, and process orders — all from your own subdomain.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton
            as="a"
            href={`${base}/register`}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
          <MagneticButton
            as="a"
            href="#features"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] border border-white/[0.1] text-white font-bold text-lg rounded-2xl hover:bg-white/[0.1] transition-all"
          >
            <Play className="w-5 h-5" />
            See How it Works
          </MagneticButton>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex items-center justify-center gap-4"
        >
          <div className="flex -space-x-3">
            {['bg-orange-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400'].map((color, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full ${color} border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">2,500+ stores</p>
            <p className="text-white/40 text-xs">already launched</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white/40"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
