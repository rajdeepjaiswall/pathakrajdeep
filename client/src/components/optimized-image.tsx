import { useState, useRef, useEffect } from 'react';
import pathakLogo from '@assets/project_20250528_0859055-02.png';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'empty';
  loading?: 'lazy' | 'eager';
  fallback?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'blur',
  loading = 'lazy',
  fallback = pathakLogo
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === 'lazy') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: '50px' }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    }
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    console.debug(`Image loaded in ${performance.now() - window.performance.timeOrigin}ms:`, src);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const shouldLoad = loading === 'eager' || isInView;
  const imageSrc = hasError ? fallback : src;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-champagne/20 to-almond/30 animate-pulse flex items-center justify-center">
          <div className="text-champagne text-2xl font-bold">PB</div>
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          decoding="async"
        />
      )}
    </div>
  );
}