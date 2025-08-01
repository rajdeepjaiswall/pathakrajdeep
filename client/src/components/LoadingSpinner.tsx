import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay before showing to avoid flicker for fast loads
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  if (!isVisible) return null;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Mobile-only centered loading */}
      <div className="md:hidden flex flex-col items-center">
        <div className="relative">
          {/* Rotating ring */}
          <div className={`${sizeClasses[size]} animate-spin`}>
            <div className="h-full w-full rounded-full border-4 border-almond border-t-navy"></div>
          </div>
          
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/api/logo" 
              alt="Pathak Bhandar"
              className={`object-contain animate-pulse ${
                size === 'sm' ? 'h-4 w-4' : 
                size === 'md' ? 'h-6 w-6' : 
                'h-8 w-8'
              }`}
              style={{ 
                filter: 'brightness(0) saturate(100%) invert(17%) sepia(25%) saturate(1315%) hue-rotate(195deg) brightness(94%) contrast(96%)' 
              }}
            />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="mt-3 text-sm text-navy/70 animate-pulse">Loading...</p>
      </div>

      {/* Desktop loading (simple spinner) */}
      <div className="hidden md:flex items-center space-x-2">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="h-full w-full rounded-full border-4 border-almond border-t-navy"></div>
        </div>
        <span className="text-navy/70">Loading...</span>
      </div>
    </div>
  );
}