import { useState } from "react";
import { Star, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(160, "Feedback cannot exceed 160 words").optional(),
  product_id: z.number(),
  order_id: z.number(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: number;
  productName: string;
  orderId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, productName, orderId, onSuccess }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      product_id: productId,
      order_id: orderId,
    },
  });

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      return await apiRequest(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback! Your review will be published after approval.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    if (data.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }
    submitReview(data);
  };

  const wordCount = form.watch("comment")?.split(/\s+/).filter(word => word.length > 0).length || 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          Share Your Experience
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          How was your experience with {productName}?
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className="group"
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => form.setValue("rating", rating)}
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-200 ${
                      rating <= (hoveredRating || form.watch("rating"))
                        ? "fill-yellow-400 text-yellow-400 scale-110"
                        : "text-gray-300 dark:text-gray-600 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {form.watch("rating") > 0 && (
                  <span>
                    {form.watch("rating")} out of 5 stars
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Feedback (Optional)
            </label>
            <Textarea
              {...form.register("comment")}
              placeholder="Share your thoughts about this product... (Max 160 words)"
              className="min-h-[100px] resize-none"
              maxLength={800} // Rough character limit for 160 words
            />
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Maximum 160 words</span>
              <span className={wordCount > 160 ? "text-red-500" : ""}>
                {wordCount}/160 words
              </span>
            </div>
            {wordCount > 160 && (
              <p className="text-xs text-red-500">
                Please reduce your feedback to 160 words or less.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || form.watch("rating") === 0 || wordCount > 160}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Submit Review
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}