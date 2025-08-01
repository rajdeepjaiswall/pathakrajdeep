import { useQuery } from '@tanstack/react-query';

interface ProductRating {
  averageRating: number | null;
  reviewCount: number;
  hasRatings: boolean;
}

export function useProductRating(productId: number) {
  return useQuery<ProductRating>({
    queryKey: [`/api/products/${productId}/rating`],
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllProductRatings() {
  return useQuery<Record<number, ProductRating>>({
    queryKey: ['/api/products/ratings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}