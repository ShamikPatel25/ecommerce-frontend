'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { storefrontAPI } from '@/lib/storefrontApi';
import {
  ArrowRight, Sparkles, Star, Zap, Shield, Truck, Heart, Eye,
  ShoppingBag, ArrowUpRight, ChevronLeft, ChevronRight, Package, TrendingUp, Clock,
} from 'lucide-react';
import {
  ScrollReveal, StaggerContainer, StaggerItem,
  TiltCard, FloatingElement, MagneticButton,
  PageTransition, TextReveal, Marquee, SpotlightCard, NumberTicker,
} from '@/components/storefront/animations';
import NextDynamic from 'next/dynamic';

const HeroScene = NextDynamic(() => import('@/components/storefront/Scene3D').then(m => ({ default: m.HeroScene })), { ssr: false });
const CTAScene = NextDynamic(() => import('@/components/storefront/Scene3D').then(m => ({ default: m.CTAScene })), { ssr: false });

export default function StorefrontHomePage() {
  const [store, setStore] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storefrontAPI.getStoreInfo().catch(() => ({ data: null })),
      storefrontAPI.getProducts({ featured: 'true', page_size: 8 }).catch(() => ({ data: { results: [] } })),
      storefrontAPI.getProducts({ page_size: 10, sort: 'newest' }).catch(() => ({ data: { results: [] } })),
      storefrontAPI.getCategories().catch(() => ({ data: [] })),
    ]).then(([storeRes, featuredRes, newRes, catRes]) => {
      const featuredProducts = featuredRes.data?.results || featuredRes.data || [];
      const allNew = newRes.data?.results || newRes.data || [];
      setStore(storeRes.data);
      // If no featured products, use newest as featured instead
      setFeatured(featuredProducts.length > 0 ? featuredProducts : allNew.slice(0, 8));
      setNewArrivals(allNew);
      setCategories(catRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full border-2 border-orange-500/30 border-t-orange-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-pink-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <motion.p
            className="text-gray-500 text-sm font-medium tracking-widest uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <HeroSection store={store} />
      <FeaturesBar />
      <MarqueeSection />
      {categories.length > 0 && <CategoriesSection categories={categories} />}
      {featured.length > 0 && <FeaturedSection products={featured} />}
      {newArrivals.length > 0 && <NewArrivalsSection products={newArrivals} />}
      <PromoBannerSection />
      <StatsSection />
      <CTASection store={store} />
    </PageTransition>
  );
}

/* ═══════  HERO  ═══════ */
function HeroSection({ store }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-gray-950">
      <HeroScene />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-transparent to-gray-950 pointer-events-none z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none z-[1]" />

      <motion.div
        className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-0 w-full"
        style={{ y, opacity }}
      >
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-orange-400 text-sm font-medium backdrop-blur-xl">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.span>
              Welcome to {store?.name || 'Our Store'}
            </span>
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <TextReveal delay={0.3}>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
                <span className="text-white">Discover</span>
              </h1>
            </TextReveal>
            <TextReveal delay={0.5}>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
                <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Amazing
                </span>
              </h1>
            </TextReveal>
            <TextReveal delay={0.7}>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
                <span className="text-white/90">Products</span>
              </h1>
            </TextReveal>
          </div>

          {/* Subtitle */}
          <motion.p
            className="mt-8 text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {store?.description || 'Explore our curated collection of premium products. Quality you can trust, style that inspires.'}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Link href="/products">
              <MagneticButton
                as="div"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-[length:200%_auto] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Shop Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </MagneticButton>
            </Link>
            <Link href="/products">
              <MagneticButton
                as="div"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white/80 border border-white/10 hover:border-white/30 hover:bg-white/[0.05] backdrop-blur-sm transition-all"
              >
                Explore
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-orange-500 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════  FEATURES BAR  ═══════ */
function FeaturesBar() {
  const features = [
    { icon: Truck, label: 'Free Shipping', desc: 'On all orders', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Shield, label: 'Secure Payment', desc: '100% protected', gradient: 'from-green-500 to-emerald-500' },
    { icon: Zap, label: 'Fast Delivery', desc: 'Quick processing', gradient: 'from-orange-500 to-yellow-500' },
    { icon: Star, label: 'Best Quality', desc: 'Premium products', gradient: 'from-purple-500 to-pink-500' },
  ];

  return (
    <section className="relative z-10 -mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.08)] border border-white/50 p-6 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="flex items-center gap-4 group cursor-default"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <f.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{f.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════  MARQUEE  ═══════ */
function MarqueeSection() {
  const words = ['Premium Quality', 'Free Shipping', 'New Arrivals', 'Best Deals', 'Trending Now', 'Exclusive', 'Limited Edition'];

  return (
    <section className="py-16 overflow-hidden">
      <Marquee speed={25} className="py-4">
        {words.map((w, i) => (
          <span key={i} className="flex items-center gap-6 text-3xl md:text-5xl font-black text-gray-200/50 select-none mx-4">
            {w}
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-400" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ═══════  CATEGORIES  ═══════ */
function CategoriesSection({ categories }) {
  const categoryGradients = [
    'from-orange-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-purple-500',
    'from-red-500 to-orange-500',
    'from-teal-500 to-blue-500',
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <ScrollReveal>
        <div className="text-center mb-16">
          <motion.span
            className="inline-block text-orange-500 font-bold text-sm uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            whileInView={{ opacity: 1, letterSpacing: '0.2em' }}
            viewport={{ once: true }}
          >
            Browse
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Shop by <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Category</span>
          </h2>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" staggerDelay={0.08}>
        {categories.map((cat, i) => (
          <StaggerItem key={cat.id}>
            <Link href={`/products?category=${cat.slug}`}>
              <TiltCard className="group cursor-pointer" intensity={10}>
                <SpotlightCard className="relative bg-white rounded-3xl p-6 md:p-8 text-center border border-gray-100 hover:border-orange-200/50 transition-all duration-500 hover:shadow-[0_20px_80px_rgba(249,115,22,0.08)]">
                  <div className="relative">
                    <motion.div
                      className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${categoryGradients[i % categoryGradients.length]} flex items-center justify-center mb-5 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-white font-black text-2xl drop-shadow-sm">{cat.name.charAt(0)}</span>
                    </motion.div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                      {cat.name}
                    </h3>
                    {cat.children?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">{cat.children.length} subcategories</p>
                    )}
                    <motion.div
                      className="mt-5 flex items-center justify-center gap-1.5 text-orange-500 text-sm font-semibold"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2">
                        Explore
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2" />
                    </motion.div>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

/* ═══════  FEATURED PRODUCTS  ═══════ */
function FeaturedSection({ products }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-gray-50 to-white" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-100/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-16">
            <div>
              <motion.span
                className="inline-block text-orange-500 font-bold text-sm uppercase tracking-[0.2em] mb-4"
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                whileInView={{ opacity: 1, letterSpacing: '0.2em' }}
                viewport={{ once: true }}
              >
                Featured
              </motion.span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                Top <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Products</span>
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 group bg-orange-50 hover:bg-orange-100 px-5 py-2.5 rounded-full transition-all"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" staggerDelay={0.06}>
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <motion.div
          className="sm:hidden mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 px-6 py-3 rounded-full"
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════  NEW ARRIVALS (Horizontal Carousel)  ═══════ */
function NewArrivalsSection({ products }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-orange-50/20 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Clock className="w-4 h-4" />
                Just In
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                New <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Arrivals</span>
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <motion.button
                onClick={() => scroll(-1)}
                className={`p-3 rounded-2xl border transition-all ${canScrollLeft ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                whileHover={canScrollLeft ? { scale: 1.05 } : {}}
                whileTap={canScrollLeft ? { scale: 0.95 } : {}}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={() => scroll(1)}
                className={`p-3 rounded-2xl border transition-all ${canScrollRight ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                whileHover={canScrollRight ? { scale: 1.05 } : {}}
                whileTap={canScrollRight ? { scale: 0.95 } : {}}
                disabled={!canScrollRight}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </ScrollReveal>

        {/* Horizontal scroll */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                className="flex-shrink-0 w-[260px] md:w-[280px] snap-start"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════  PROMO BANNER  ═══════ */
function PromoBannerSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ScrollReveal>
        <div className="relative rounded-[2rem] overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-[120px]" />
          </div>

          <div className="relative px-8 md:px-16 py-16 md:py-20">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-orange-400 text-sm font-semibold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <TrendingUp className="w-4 h-4" />
                  Trending Now
                </motion.div>
                <motion.h3
                  className="text-3xl md:text-5xl font-black text-white leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  Premium Collection
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">Just Dropped</span>
                </motion.h3>
                <motion.p
                  className="mt-4 text-gray-400 text-lg max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Explore our latest arrivals with exclusive deals and unbeatable prices.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <Link href="/products">
                    <MagneticButton
                      as="div"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25"
                    >
                      Shop Collection <ArrowRight className="w-5 h-5" />
                    </MagneticButton>
                  </Link>
                </motion.div>
              </div>

              {/* Decorative floating elements */}
              <div className="hidden md:flex justify-center items-center relative h-64">
                <FloatingElement duration={4} distance={15}>
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Package className="w-12 h-12 text-orange-400" />
                  </div>
                </FloatingElement>
                <FloatingElement duration={5} distance={20} className="absolute top-4 right-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Star className="w-8 h-8 text-purple-400" />
                  </div>
                </FloatingElement>
                <FloatingElement duration={6} distance={12} className="absolute bottom-4 left-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Zap className="w-10 h-10 text-cyan-400" />
                  </div>
                </FloatingElement>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════  PRODUCT CARD  ═══════ */
function ProductCard({ product }) {
  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price);
  const discount = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_at_price)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <TiltCard className="group cursor-pointer" intensity={8}>
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 hover:border-orange-200/50 transition-all duration-500 hover:shadow-[0_30px_80px_rgba(249,115,22,0.1)]">
          {/* Image */}
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {product.thumbnail ? (
              <motion.img
                src={product.thumbnail}
                alt={product.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gray-200/50 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
              </div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <motion.span
                className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/25"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                -{discount}%
              </motion.span>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <motion.div
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </motion.div>
              <motion.div
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-4 h-4 text-gray-700" />
              </motion.div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 md:p-5">
            {product.category_name && (
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2">
                {product.category_name}
              </p>
            )}
            <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through font-medium">
                  ${parseFloat(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

/* ═══════  STATS  ═══════ */
function StatsSection() {
  const stats = [
    { value: 500, suffix: '+', label: 'Happy Customers' },
    { value: 1200, suffix: '+', label: 'Products Available' },
    { value: 99, suffix: '%', label: 'Satisfaction Rate' },
    { value: 24, suffix: '/7', label: 'Customer Support' },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
          <div className="text-center mb-16">
            <motion.span
              className="inline-block text-orange-500 font-bold text-sm uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Our Numbers
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
              Trusted by <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Thousands</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <motion.div
                className="text-center group cursor-default p-8 rounded-3xl bg-white border border-gray-100 hover:border-orange-200/50 hover:shadow-[0_20px_60px_rgba(249,115,22,0.06)] transition-all duration-500"
                whileHover={{ y: -5 }}
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-3">
                  <NumberTicker value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════  CTA  ═══════ */
function CTASection({ store }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <ScrollReveal>
        <div className="relative rounded-[2rem] overflow-hidden min-h-[400px] flex items-center">
          <div className="absolute inset-0 bg-gray-950">
            <CTAScene />
          </div>

          <div className="relative z-10 px-8 md:px-16 py-16 md:py-24 text-center w-full">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-orange-400 text-sm font-medium backdrop-blur-xl mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              Limited Time Offer
            </motion.div>
            <motion.h2
              className="text-4xl md:text-6xl font-black text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Ready to explore
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                something special
              </span>?
            </motion.h2>
            <motion.p
              className="mt-6 text-gray-400 text-lg max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Browse our complete collection and find products you&apos;ll love.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Link href="/products">
                <MagneticButton
                  as="div"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-white/10 transition-shadow"
                >
                  Browse All Products <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
