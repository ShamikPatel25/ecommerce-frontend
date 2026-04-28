'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {/* Scroll Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-background border-border/50 shadow-md w-12 h-12"
          onClick={scrollLeft}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-background border-border/50 shadow-md w-12 h-12"
          onClick={scrollRight}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Testimonials Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-hidden snap-x snap-mandatory gap-6 pb-8 hide-scrollbar"
      >
        {testimonials.map((testimonial) => (
          <div 
            key={testimonial.id} 
            className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm flex flex-col justify-between min-w-[320px] md:min-w-[400px] snap-center shrink-0"
          >
            <div>
              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-card-foreground leading-relaxed italic mb-8">&ldquo;{testimonial.content}&rdquo;</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- external avatar URL */}
                <img src={testimonial.avatar} alt={testimonial.name} className="object-cover w-full h-full" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-card-foreground">{testimonial.name}</h4>
                <p className="text-muted-foreground text-xs">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
