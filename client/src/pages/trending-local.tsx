import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';

const BADGE_OPTIONS = ['BEST SELLER', 'MUST TRY', 'TRENDING', 'FAN FAV', 'LIMITED', 'HOT NOW'];

function getBadge(index: number) {
  return BADGE_OPTIONS[index % BADGE_OPTIONS.length];
}

function MasonryCard({ product, index, onClick }: { product: any; index: number; onClick: () => void }) {
  const { addToCart } = useCart();
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80';
  const price = parseFloat(product.price);

  const heights = ['h-44', 'h-56', 'h-48', 'h-64', 'h-52', 'h-40', 'h-60', 'h-36'];
  const imgH = heights[index % heights.length];

  return (
    <div
      className="mb-4 break-inside-avoid bg-[#F5EFE6] rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className={`relative ${imgH} overflow-hidden rounded-t-3xl`}>
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5EFE6]/90 text-[#3E2723] px-2.5 py-1 rounded-full shadow-sm">
            {getBadge(index)}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-[#3E2723] text-sm leading-tight mb-1 line-clamp-2">{product.name}</p>
        {product.weight && (
          <p className="text-[#795548] text-xs mb-2">{product.weight}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#3E2723] font-extrabold text-sm">{formatPrice(price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
            className="w-8 h-8 rounded-full bg-[#3E2723] hover:bg-[#5D4037] active:scale-95 flex items-center justify-center shadow transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-[#F5EFE6]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { addToCart } = useCart();
  const image = product.images?.[0];
  const price = parseFloat(product.price);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#F5EFE6] rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {image && (
          <img
            src={image}
            alt={product.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6 pb-8">
          <h2 className="text-2xl font-extrabold text-[#3E2723] mb-1">{product.name}</h2>
          {product.weight && (
            <p className="text-sm text-[#795548] mb-2">{product.weight}</p>
          )}
          {product.description && (
            <p className="text-sm text-[#5D4037] mb-5 leading-relaxed">{product.description}</p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-[#3E2723]/10 text-[#3E2723] px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-[#3E2723]">{formatPrice(price)}</span>
            <div className="flex gap-3">
              <Link href={`/products/${product.id}`}>
                <button className="border border-[#3E2723] text-[#3E2723] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#3E2723]/5 transition-colors">
                  Details
                </button>
              </Link>
              <button
                onClick={() => { addToCart(product.id, 1); onClose(); }}
                className="bg-[#3E2723] hover:bg-[#5D4037] text-[#F5EFE6] font-bold text-sm px-6 py-2.5 rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TrendingLocalPage() {
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/trending-local'],
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#3E2723' }}>
      <Header />

      <div className="pt-20 pb-32 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-2 pt-2">
          <Link href="/">
            <button className="w-9 h-9 rounded-full bg-[#F5EFE6]/10 flex items-center justify-center hover:bg-[#F5EFE6]/20 transition-colors">
              <ArrowLeft className="h-4 w-4 text-[#F5EFE6]" />
            </button>
          </Link>
        </div>

        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F5EFE6] text-[#3E2723] px-3 py-1 rounded-full inline-block mb-3">
            TOP PICKS
          </span>
          <h1 className="text-3xl font-black text-white leading-tight">Trending Local</h1>
          <p className="text-[#F5EFE6]/60 text-sm mt-1">What Prayagraj is loving right now</p>
        </div>

        {isLoading ? (
          <div className="columns-2 sm:columns-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid bg-[#F5EFE6]/10 rounded-3xl animate-pulse" style={{ height: `${140 + (i % 4) * 30}px` }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#F5EFE6]/60 text-lg">No trending local products yet.</p>
            <p className="text-[#F5EFE6]/40 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-3">
            {products.map((product, i) => (
              <MasonryCard
                key={product.id}
                product={product}
                index={i}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <MobileNav />
      <CartSidebar />
    </div>
  );
}
