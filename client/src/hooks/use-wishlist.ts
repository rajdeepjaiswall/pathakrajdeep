import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WishlistItem, Product } from '@shared/schema';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface WishlistContextType {
  wishlistItems: (WishlistItem & { product: Product })[];
  previousOrders: (Product & { lastOrderDate: Date; orderCount: number })[];
  isLoading: boolean;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wishlist items
  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
  });

  // Fetch previously ordered products
  const { data: previousOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/previous-orders'],
    enabled: isAuthenticated,
  });

  const isLoading = wishlistLoading || ordersLoading;

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest('POST', '/api/wishlist', {
        product_id: productId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Added to wishlist',
        description: 'Product has been added to your wishlist',
      });
    },
    onError: (error: any) => {
      if (error.message.includes('already in wishlist')) {
        toast({
          title: 'Already in wishlist',
          description: 'This product is already in your wishlist',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add product to wishlist',
          variant: 'destructive',
        });
      }
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest('DELETE', `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Removed from wishlist',
        description: 'Product has been removed from your wishlist',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove product from wishlist',
        variant: 'destructive',
      });
    },
  });

  const addToWishlist = (productId: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add products to your wishlist',
        variant: 'destructive',
      });
      return;
    }
    addToWishlistMutation.mutate(productId);
  };

  const removeFromWishlist = (productId: number) => {
    if (!isAuthenticated) {
      return;
    }
    removeFromWishlistMutation.mutate(productId);
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.product.id === productId);
  };

  const toggleWishlist = (productId: number) => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const contextValue: WishlistContextType = {
    wishlistItems,
    previousOrders,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
  };

  return React.createElement(WishlistContext.Provider, { value: contextValue }, children);
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}