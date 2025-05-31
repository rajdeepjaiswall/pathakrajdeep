import { Link } from 'wouter';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, getGSTBreakdown } from '@/lib/cart';

export default function Cart() {
  const { items, summary, updateQuantity, removeFromCart } = useCart();

  const gstBreakdown = getGSTBreakdown(items);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-navy mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products">
              <Button className="bg-champagne text-navy hover:bg-champagne/90">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-navy">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-navy">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.images[0] || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy text-lg">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm">{item.product.weight}</p>
                      <p className="text-champagne font-medium">
                        {formatPrice(parseFloat(item.product.price))} each
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right min-w-0">
                        <p className="font-bold text-navy text-lg">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </p>
                        <p className="text-xs text-green-600">
                          + {formatPrice(parseFloat(item.product.price) * item.quantity * parseFloat(item.product.gstRate) / 100)} GST
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-navy">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({summary.itemCount} items)</span>
                  <span className="font-medium">{formatPrice(summary.subtotal)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST</span>
                    <span className="font-medium">{formatPrice(gstBreakdown.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST</span>
                    <span className="font-medium">{formatPrice(gstBreakdown.sgst)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">
                    {summary.deliveryCharge === 0 ? 'FREE' : formatPrice(summary.deliveryCharge)}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-navy">{formatPrice(summary.total)}</span>
                  </div>
                </div>
                
                <Link href="/checkout">
                  <Button className="w-full bg-champagne text-navy hover:bg-champagne/90 py-3">
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <p className="text-xs text-gray-500 text-center">
                  Free delivery on orders above ₹500
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
