'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Clock, Star, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { TestimonialsCarousel } from '@/components/storefront/shared/TestimonialsCarousel';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
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
  const [store, setStore] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { href } = useStorefrontPath();

  useEffect(() => {
    Promise.all([
      storefrontAPI.getStoreInfo().catch(() => ({ data: null })),
      storefrontAPI.getProducts({ page_size: 30, sort: 'newest' }).catch(() => ({ data: { results: [] } })),
      storefrontAPI.getCategories().catch(() => ({ data: [] })),
    ]).then(([storeRes, productsRes, catRes]) => {
      setStore(storeRes.data);

      const allProducts = productsRes.data?.results || productsRes.data || [];
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      setFeatured(shuffled.slice(0, 8));
      setNewArrivals(allProducts.slice(0, 4));
      setCategories(catRes.data || []);
      setLoading(false);
    });
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
  const displayCategories = categories.length > 0 ? categories.slice(0, 6) : [];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: `Orders over ${formatCurrency(50, store?.currency)}` },
    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% protected' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '30-day policy' },
    { icon: Clock, title: 'Fast Delivery', desc: '2-5 business days' },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                Welcome to {storeName}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Discover Quality
                <span className="block text-primary">Products You Love</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {store?.description || 'Explore our curated collection of premium products. Quality you can trust, prices you\'ll love, and service that exceeds expectations.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={href('/products')}>
                  <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg shadow-primary/25 w-full sm:w-auto">
                    Shop Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#categories">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full w-full sm:w-auto">
                    Browse Categories
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 mt-10 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">10K+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <p className="text-2xl font-bold text-foreground">4.9</p>
                  <p className="text-sm text-muted-foreground ml-1">Rating</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6" />
                <div className="absolute inset-0 bg-background rounded-3xl shadow-2xl overflow-hidden border border-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external hero image */}
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                    alt="Featured products"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-background rounded-2xl shadow-xl p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Free Delivery</p>
                      <p className="text-sm text-muted-foreground">On all orders</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-background rounded-2xl shadow-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Trusted by thousands</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {displayCategories.length > 0 && (
        <section id="categories" className="py-16 md:py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">Categories</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Shop by Category</h2>
              </div>
              <Link href={href('/products')} className="text-primary font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                View All Categories
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {displayCategories.map((category) => (
                <Link
                  key={category.id}
                  href={href(`/products?category=${category.slug}`)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-muted-foreground/20">
                      {category.name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-white font-semibold text-sm md:text-base">{category.name}</h3>
                    <p className="text-white/70 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Shop now →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">Featured</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Best Sellers</h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Discover our most popular products loved by customers worldwide.
                </p>
              </div>
              <Link href={href('/products')}>
                <Button variant="outline" className="rounded-full group">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} href={href} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary/80">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Quality Products,<br />Exceptional Service
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-md">
                  We believe in providing the best products at competitive prices. Every item is carefully selected to ensure your satisfaction.
                </p>
                <Link href={href('/products')}>
                  <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 font-medium">
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <p className="text-3xl font-bold">100%</p>
                      <p className="text-white/80 text-sm">Satisfaction Guaranteed</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <p className="text-3xl font-bold">24/7</p>
                      <p className="text-white/80 text-sm">Customer Support</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <p className="text-3xl font-bold">Fast</p>
                      <p className="text-white/80 text-sm">Shipping Worldwide</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <p className="text-3xl font-bold">Easy</p>
                      <p className="text-white/80 text-sm">Returns & Refunds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">Just In</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">New Arrivals</h2>
              </div>
              <Link href={href('/products?sort=newest')} className="text-primary font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                See All New Products
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} href={href} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what our happy customers have to say about their experience.
            </p>
          </div>

          <TestimonialsCarousel testimonials={fallbackTestimonials} />
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of satisfied customers and discover why they love shopping with us.
          </p>
          <Link href={href('/products')}>
            <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25">
              Explore Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
