import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import { useState, useEffect } from 'react';

function useCountdown() {
  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return { h, m, s };
  };

  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function ProductOfDay() {
  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['/api/products/product-of-day'],
  });
  const { addToCart } = useCart();
  const countdown = useCountdown();

  if (isLoading) return null;
  if (!product) return null;

  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';
  const price = parseFloat(product.price);
  const originalPrice = Math.round(price * 1.3);

  return (
    <section className="py-8 px-4 sm:px-6 bg-[#f5f0eb]">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden">

          {/* Image Container */}
          <div className="relative">
            <img
              src={image}
              alt={product.name}
              className="w-full h-72 object-cover"
            />

            {/* DEAL OF THE DAY Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
                Deal of the Day
              </span>
            </div>

            {/* Countdown Timer Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2 shadow-lg flex items-center gap-3 whitespace-nowrap">
                <span className="text-xs text-gray-500 font-medium leading-tight">
                  ENDS<br />IN
                </span>
                <span className="text-base font-bold text-gray-800 tracking-widest">
                  {pad(countdown.h)} : {pad(countdown.m)} : {pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Content */}
          <div className="px-6 pt-5 pb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">
              {product.name}
            </h2>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {product.description || 'Handcrafted with premium ingredients, made fresh daily.'}
            </p>

            {/* Price Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-gray-900">
                  {formatPrice(price)}
                </span>
                <span className="text-base text-gray-400 line-through font-medium">
                  {formatPrice(originalPrice)}
                </span>
              </div>

              {/* Circular Add to Cart Button */}
              <button
                onClick={() => addToCart(product.id, 1)}
                className="w-12 h-12 rounded-full bg-amber-800 hover:bg-amber-700 active:scale-95 flex items-center justify-center shadow-lg transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
