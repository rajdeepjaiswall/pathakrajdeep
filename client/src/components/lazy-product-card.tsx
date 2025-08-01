import { useState, useRef, useEffect } from 'react';
import ProductCard from '@/components/product/product-card';
import { Product } from '@shared/schema';

interface LazyProductCardProps {
  product: Product;
  isPreviouslyOrdered?: boolean;
  className?: string;
}

export default function LazyProductCard({ product, isPreviouslyOrdered = false, className }: LazyProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '200px', // Load when 200px before entering viewport
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <ProductCard product={product} isPreviouslyOrdered={isPreviouslyOrdered} />
      ) : (
        // Skeleton loader
        <div className="bg-white rounded-2xl shadow-sm animate-pulse max-w-xs">
          <div className="h-40 bg-gray-200 rounded-t-2xl" />
          <div className="p-3 space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      )}
    </div>
  );
}