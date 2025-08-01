import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  admin_reply?: string;
  admin_reply_date?: string;
  is_featured: boolean;
  isApproved: boolean;
  createdAt: string;
  user: { username: string } | null;
  product: { name: string } | null;
}

export function FeedbackCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/featured"],
  });

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [reviews.length, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="w-full py-12 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Feedback
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              What our valued customers say about us
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 w-full max-w-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return null;
  }

  return (
    <div className="w-full py-12 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Feedback
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            What our valued customers say about us
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Review Card */}
          <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-orange-200 dark:border-orange-800">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <Quote className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < reviews[currentIndex].rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    "{reviews[currentIndex].comment}"
                  </blockquote>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {reviews[currentIndex].user?.username || "Anonymous"}
                      </p>
                      {reviews[currentIndex].product && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Reviewed: {reviews[currentIndex].product.name}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(reviews[currentIndex].createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Admin Reply */}
                  {reviews[currentIndex].admin_reply && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-l-4 border-orange-500">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                        Pathak Bhandar Team Reply:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {reviews[currentIndex].admin_reply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          {reviews.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 shadow-lg border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 shadow-lg border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Dots Indicator */}
          {reviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-orange-500 scale-110"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-orange-300 dark:hover:bg-orange-700"
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}