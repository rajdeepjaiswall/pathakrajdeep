import { useState, useRef, useEffect } from 'react';
import { VolumeX, Volume2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoBannerProps {
  videoUrl: string;
  title: string;
  description?: string;
  linkUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

export function VideoBanner({
  videoUrl,
  title,
  description,
  linkUrl,
  autoPlay = true,
  muted = true,
  loop = true,
  className = "",
}: VideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(muted);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectFit: 'cover' }}
        playsInline
        preload="metadata"
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Video Controls */}
      <div 
        className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 text-white border-white/30 hover:bg-black/70"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 text-white border-white/30 hover:bg-black/70"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center text-center text-white p-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
            {title}
          </h2>
          {description && (
            <p className="text-base md:text-lg lg:text-xl opacity-90 drop-shadow-md">
              {description}
            </p>
          )}
          {linkUrl && (
            <div className="mt-6">
              <Button
                size="lg"
                className="bg-champagne text-navy hover:bg-champagne/90 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                Learn More
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          VIDEO
        </div>
      </div>
    </div>
  );
}