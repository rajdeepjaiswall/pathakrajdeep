import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showText = true, 
  reviewCount = 0,
  className = '' 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center text-yellow-400 ${className}`}>
      {[...Array(maxRating)].map((_, i) => (
        <Star 
          key={i} 
          className={`${sizeClasses[size]} ${i < Math.floor(rating) ? 'fill-current' : ''}`} 
        />
      ))}
      {showText && reviewCount > 0 && (
        <span className={`text-gray-500 ml-1 ${textSizeClasses[size]}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}