'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Clock, Star, ChevronRight, Sparkles, TrendingUp, Zap, Gift, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { TestimonialsCarousel } from '@/components/storefront/shared/TestimonialsCarousel';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStoreInfo } from '@/lib/StorefrontContext';
import { formatCurrency } from '@/lib/utils';

const fallbackTestimonials = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    content: 'Amazing quality and fast shipping! The product exceeded my expectations. Will definitely shop here again.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Verified Buyer',
    content: 'Great customer service and the product quality is outstanding. Highly recommend this store to everyone.',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&q=80'
  },
  {
    id: '3',
    name: 'Emily Davis',
    role: 'Verified Buyer',
    content: 'Best online shopping experience! Easy checkout, beautiful packaging, and the product is exactly as described.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'
  }
];

export default function StorefrontHomeClient() {
  const store = useStoreInfo();
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { href } = useStorefrontPath();

  useEffect(() => {
    storefrontAPI.getProducts({ page_size: 30, sort: 'newest' })
      .then((res) => {
        const allProducts = res.data?.results || res.data || [];
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        setFeatured(shuffled.slice(0, 8));
        setNewArrivals(allProducts.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex bg-background items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground font-medium">Loading store...</p>
        </div>
      </div>
    );
  }

  const storeName = store?.name || 'Store';

  const quickActions = [
    { icon: TrendingUp, label: 'Trending', color: 'bg-rose-500', href: '/products?sort=popular' },
    { icon: Zap, label: 'New', color: 'bg-amber-500', href: '/products?sort=newest' },
    { icon: Gift, label: 'Deals', color: 'bg-emerald-500', href: '/products' },
    { icon: Package, label: 'All', color: 'bg-blue-500', href: '/products' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: `${formatCurrency(50, store?.currency)}+` },
    { icon: ShieldCheck, title: 'Secure', desc: '100% Safe' },
    { icon: RefreshCw, title: 'Returns', desc: '30 Days' },
    { icon: Clock, title: 'Fast', desc: '2-5 Days' },
  ];

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12 lg:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  <Sparkles className="w-3 h-3" />
                  <span>Welcome to {storeName}</span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-tight">
                  Discover{' '}
                  <span className="text-primary">Quality</span>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  Products You Love
                </h1>

                {/* Description - Hidden on very small screens */}
                <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 max-w-md mx-auto lg:mx-0 line-clamp-2 sm:line-clamp-none">
                  {store?.description || 'Premium products, unbeatable prices, and exceptional service.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center lg:justify-start">
                  <Link href={href('/products')} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20">
                      Shop Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href={href('/products')} className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm font-semibold rounded-xl">
                      Explore All
                    </Button>
                  </Link>
                </div>

                {/* Stats - Compact for mobile */}
                <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8 mt-6 sm:mt-8">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-foreground">10K+</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Customers</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-foreground">500+</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <p className="text-lg sm:text-xl font-bold text-foreground">4.9</p>
                  </div>
                </div>
              </div>

              {/* Hero Image - Desktop only */}
              <div className="relative hidden lg:block">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6" />
                  <div className="absolute inset-0 bg-background rounded-3xl shadow-2xl overflow-hidden border border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                      alt="Featured products"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-background rounded-2xl shadow-xl p-4 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Free Delivery</p>
                        <p className="text-xs text-muted-foreground">On all orders</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Mobile App Style */}
      <section className="px-4 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                href={href(action.href)}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Strip - Horizontal scroll on mobile */}
      <section className="px-4 py-3 sm:py-4 border-y border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 min-w-[140px] sm:min-w-0">
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">{feature.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {featured.length > 0 && (
        <section className="px-4 py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Trending</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Best Sellers</h2>
              </div>
              <Link href={href('/products')} className="text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all">
                <span className="hidden sm:inline">View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Products Grid - 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} href={href} />
              ))}
            </div>

            {/* Show more products on larger screens */}
            {featured.length > 4 && (
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-3 sm:mt-4 lg:mt-6">
                {featured.slice(4, 8).map((product) => (
                  <ProductCard key={product.id} product={product} href={href} />
                ))}
              </div>
            )}

            {/* Mobile: View All Button */}
            <div className="mt-6 sm:hidden">
              <Link href={href('/products')} className="block">
                <Button variant="outline" className="w-full h-11 rounded-xl font-medium">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Promo Banner - Mobile Optimized */}
      <section className="px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary/80">
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
            </div>

            <div className="relative p-6 sm:p-8 lg:p-12">
              <div className="max-w-lg">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
                  Quality Products, Great Prices
                </h2>
                <p className="text-white/80 text-sm sm:text-base mb-5 sm:mb-6 line-clamp-2">
                  Premium selection at prices you&apos;ll love. Shop now and save!
                </p>
                <Link href={href('/products')}>
                  <Button size="lg" variant="secondary" className="h-10 sm:h-11 px-6 rounded-xl font-semibold text-sm">
                    Start Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Stats for desktop */}
              <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-white/80">Satisfaction</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-white/80">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="px-4 py-8 sm:py-12 lg:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Just In</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">New Arrivals</h2>
              </div>
              <Link href={href('/products?sort=newest')} className="text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all">
                <span className="hidden sm:inline">See All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} href={href} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="px-4 py-10 sm:py-14 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Reviews</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">What Customers Say</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Trusted by thousands of happy customers worldwide
            </p>
          </div>

          <TestimonialsCarousel testimonials={fallbackTestimonials} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-10 sm:py-14 lg:py-20 bg-muted/30 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3">
            Ready to Shop?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Join thousands of satisfied customers today
          </p>
          <Link href={href('/products')}>
            <Button size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20">
              Explore Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
