import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CartItem, CartSummary, calculateCartSummary } from '../lib/cart';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => void;
  updateQuantity: (cartItemId: number, quantity: number) => void;
  removeFromCart: (cartItemId: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch cart items - refetch when auth state changes
  const { data: cartData, isLoading, refetch } = useQuery({
    queryKey: ['/api/cart'],
    retry: false,
  });

  // Refetch cart when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isAuthenticated, refetch, isLoading]);

  const items = (cartData as CartItem[]) || [];
  // Calculate cart summary
  const summary = calculateCartSummary(items);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await apiRequest('POST', '/api/cart', {
        product_id: productId,
        quantity,
      });
      
      // Check if response indicates authentication is required
      const data = await response.json();
      if (data.requiresAuth) {
        // Handle authentication required case
        throw new Error('Please log in to add items to cart');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.requiresAuth) {
        toast({
          title: 'Authentication Required',
          description: data.message,
          variant: 'destructive',
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        toast({
          title: 'Added to cart',
          description: 'Item has been added to your cart',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      return await apiRequest('PUT', `/api/cart/${cartItemId}`, {
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cart',
        variant: 'destructive',
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      return await apiRequest('DELETE', `/api/cart/${cartItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item from cart',
        variant: 'destructive',
      });
    },
  });

  const addToCart = (productId: number, quantity: number) => {
    addToCartMutation.mutate({ productId, quantity });
  };

  const updateQuantity = (cartItemId: number, quantity: number) => {
    updateQuantityMutation.mutate({ cartItemId, quantity });
  };

  const removeFromCart = (cartItemId: number) => {
    removeFromCartMutation.mutate(cartItemId);
  };

  const clearCart = () => {
    items.forEach(item => removeFromCart(item.id));
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const value = {
    items,
    summary,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isOpen,
    openCart,
    closeCart,
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
