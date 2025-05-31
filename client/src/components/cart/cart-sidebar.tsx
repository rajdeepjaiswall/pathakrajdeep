import { X, Minus, Plus, Trash2, ShoppingBag, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, getGSTBreakdown } from '@/lib/cart';
import { Link } from 'wouter';

export default function CartSidebar() {
  const { isOpen, closeCart, items, summary, updateQuantity, removeFromCart } = useCart();

  if (!isOpen) return null;

  const gstBreakdown = getGSTBreakdown(items);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-navy">Shopping Cart</h3>
            <Button variant="ghost" size="sm" onClick={closeCart}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link href="/products">
                  <Button className="bg-champagne text-navy hover:bg-champagne/90" onClick={closeCart}>
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 bg-cream rounded-lg p-3">
                  <img 
                    src={item.product.images[0] || '/placeholder-product.jpg'} 
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-navy text-sm">{item.product.name}</h4>
                    <p className="text-xs text-gray-600">{item.product.weight}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-navy text-sm">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="space-y-1">
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
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
              <Link href="/checkout">
                <Button 
                  className="w-full bg-champagne text-navy py-3 hover:bg-champagne/90"
                  onClick={closeCart}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </Link>
              <div className="text-center text-xs text-gray-500">
                <Shield className="h-3 w-3 inline mr-1" />
                Secure checkout with SSL encryption
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
