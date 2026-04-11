'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { TestimonialsCarousel } from '@/components/storefront/shared/TestimonialsCarousel';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';

const fallbackTestimonials = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Verified Buyer',
    content: 'Exceptional quality \u2014 the product exceeded every expectation. The packaging alone tells you this is something special.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    role: 'Verified Buyer',
    content: 'I was skeptical at first but the moment I received it, I understood. Pure luxury at a price that makes sense.',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&q=80'
  },
  {
    id: '3',
    name: 'Ananya Patel',
    role: 'Verified Buyer',
    content: 'Have bought three times now. The consistency is remarkable \u2014 each order as perfect as the last.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'
  }
];

export default function StorefrontHomePage() {
  const [store, setStore] = useState(null);
  const [featured, setFeatured] = useState([]);
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
      setCategories(catRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex bg-background items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const storeName = store?.name || 'Provision';
  const displayCategories = categories.length > 0 ? categories.slice(0, 4) : [];

  return (
    <div className="flex flex-col gap-24 pb-20 fade-in">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=2000&q=80"
            alt="Hero background workspace"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center text-white">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide backdrop-blur-sm mb-6 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
            Welcome to {storeName}
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6">
            Everything You Need,<br />
            <span className="text-zinc-300 font-light">Delivered Smartly.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-zinc-200 mb-10 font-light hidden sm:block">
            {store?.description || 'Discover premium, thoughtfully designed gear for your workspace and daily life. Elevate your everyday with us.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={href('/products')}>
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full text-base bg-white text-black hover:bg-zinc-200">
                Shop Now
              </Button>
            </Link>
            <Link href="#categories">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-full text-base bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                Explore Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-3xl bg-card text-card-foreground border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted text-foreground">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Free Express Shipping</h3>
              <p className="text-muted-foreground text-xs">On all orders over $150</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted text-foreground">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">1-Year Warranty</h3>
              <p className="text-muted-foreground text-xs">Covered on all products</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted text-foreground">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">30-Day Returns</h3>
              <p className="text-muted-foreground text-xs">No questions asked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {displayCategories.length > 0 && (
        <section id="categories" className="container mx-auto px-4 md:px-6 scroll-mt-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Shop by Category</h2>
              <p className="text-zinc-500">Curated collections for modern professionals.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCategories.map((category, i) => (
              <Link key={category.id} href={href(`/products?category=${category.slug}`)} className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-border/50 block">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-80" />
                <div className="absolute inset-0 z-0 flex items-center justify-center font-black text-6xl text-white/5 uppercase overflow-hidden">
                    {category.name}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white text-xl font-bold mb-1">{category.name}</h3>
                  <p className="text-zinc-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    Explore collection &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Segment */}
      {featured.length > 0 && (
        <section className="bg-background py-24 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Featured Additions</h2>
                <p className="text-zinc-500 line-clamp-2">
                  Discover our meticulously selected high-performance gear. Designed to elevate your workflow and personal space seamlessly.
                </p>
              </div>
              <Link href={href('/products')}>
                <Button variant="ghost" className="hover:bg-zinc-100 rounded-full group dark:hover:bg-zinc-800">
                  View all products
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

      {/* Philosophy / Emotional Banner */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-border/50 text-white min-h-[400px] flex items-center">
          <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&q=80"
              alt="Design Philosophy"
              className="object-cover w-full h-full opacity-80 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
          </div>
          <div className="relative z-10 w-full lg:w-1/2 p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for Focus.</h2>
            <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-lg font-light">
              We believe that the tools you use shape the work you do. By eliminating clutter and focusing on premium materials, we help you find your flow state instantly.
            </p>
            <Link href={href('/products')}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 px-8 font-medium">
                Explore The Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Loved by Professionals</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Don't just take our word for it. Here's what our community has to say about their experience.</p>
        </div>
        
        <TestimonialsCarousel testimonials={fallbackTestimonials} />
      </section>
    </div>
  );
}
