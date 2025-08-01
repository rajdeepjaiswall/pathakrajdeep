import { useState } from "react";
import { Star, MessageSquare, Eye, EyeOff, Reply } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
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

export default function AdminFeedback() {
  const [replyText, setReplyText] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
  });

  const { mutate: toggleFeature, isPending: isTogglingFeature } = useMutation({
    mutationFn: async ({ reviewId, isFeatured }: { reviewId: number; isFeatured: boolean }) => {
      return await apiRequest(`/api/admin/reviews/${reviewId}/feature`, {
        method: "PATCH",
        body: JSON.stringify({ isFeatured }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review feature status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update review",
        variant: "destructive",
      });
    },
  });

  const { mutate: replyToReview, isPending: isReplying } = useMutation({
    mutationFn: async ({ reviewId, adminReply }: { reviewId: number; adminReply: string }) => {
      return await apiRequest(`/api/admin/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ adminReply }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
      setReplyText("");
      setSelectedReview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  const handleFeatureToggle = (review: Review) => {
    toggleFeature({ reviewId: review.id, isFeatured: !review.is_featured });
  };

  const handleReply = (review: Review) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
        variant: "destructive",
      });
      return;
    }
    replyToReview({ reviewId: review.id, adminReply: replyText.trim() });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const featuredCount = reviews.filter(r => r.is_featured).length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Customer Feedback Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage customer reviews and select featured feedback for the homepage
        </p>
        <div className="mt-4 flex gap-4">
          <Badge variant="outline" className="text-sm">
            Total Reviews: {reviews.length}
          </Badge>
          <Badge variant={featuredCount >= 10 ? "destructive" : "secondary"} className="text-sm">
            Featured: {featuredCount}/10
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {review.user?.username || "Anonymous"}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Product: {review.product?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.is_featured && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Featured
                    </Badge>
                  )}
                  <Badge variant={review.isApproved ? "default" : "secondary"}>
                    {review.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.comment && (
                <blockquote className="text-gray-700 dark:text-gray-300 italic">
                  "{review.comment}"
                </blockquote>
              )}

              {review.admin_reply && (
                <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border-l-4 border-orange-500">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                    Your Reply:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {review.admin_reply}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {review.admin_reply_date && new Date(review.admin_reply_date).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant={review.is_featured ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFeatureToggle(review)}
                  disabled={isTogglingFeature || (!review.is_featured && featuredCount >= 10)}
                  className={review.is_featured ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {review.is_featured ? (
                    <><Eye className="h-4 w-4 mr-1" /> Featured</>
                  ) : (
                    <><EyeOff className="h-4 w-4 mr-1" /> Feature on Homepage</>
                  )}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setReplyText(review.admin_reply || "");
                      }}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      {review.admin_reply ? "Edit Reply" : "Reply"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {review.admin_reply ? "Edit Reply" : "Reply to Review"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          {review.user?.username || "Anonymous"}'s Review:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          "{review.comment}"
                        </p>
                      </div>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReply(review)}
                          disabled={isReplying || !replyText.trim()}
                          className="flex-1"
                        >
                          {isReplying ? "Posting..." : "Post Reply"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customer reviews will appear here once they start providing feedback.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}