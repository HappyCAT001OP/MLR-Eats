import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Review, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import { formatDate } from "@/lib/utils";
import { Loader2, Star, StarHalf, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Custom review form validation schema
const reviewFormSchema = insertReviewSchema.extend({
  orderId: z.number().int().positive(),
  foodItemId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(500, "Comment cannot exceed 500 characters"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
      ))}
    </div>
  );
};

interface RatingSelectProps {
  value: number;
  onChange: (value: number) => void;
}

const RatingSelect = ({ value, onChange }: RatingSelectProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          type="button"
          variant={value >= rating ? "default" : "outline"}
          size="sm"
          className="p-2 h-auto"
          onClick={() => onChange(rating)}
        >
          <Star
            className={`h-5 w-5 ${
              value >= rating ? "fill-primary text-primary-foreground" : ""
            }`}
          />
        </Button>
      ))}
    </div>
  );
};

interface ReviewFormProps {
  foodItemId: number;
  orderId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  foodItemId,
  orderId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { toast } = useToast();
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      foodItemId,
      orderId,
      rating: 0,
      comment: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit review");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/food-items/${foodItemId}/reviews`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ReviewFormValues) => {
    createReviewMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Select a rating from 1 to 5 stars
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts about this food item..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your feedback helps others make better choices
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createReviewMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface ReviewItemProps {
  review: Review;
  isOwner?: boolean;
  onDelete?: (id: number) => void;
}

function ReviewItem({ review, isOwner, onDelete }: ReviewItemProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{review.userName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">
                {review.userName || "Anonymous"}
              </CardTitle>
              <CardDescription className="text-xs">
                {formatDate(review.createdAt)}
              </CardDescription>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{review.comment}</p>
      </CardContent>
      {isOwner && onDelete && (
        <CardFooter className="pt-0 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Review</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this review? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(review.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

interface FoodReviewsProps {
  foodItemId: number;
  myOrderId?: number; // If provided, user can add a review
}

export function FoodReviews({ foodItemId, myOrderId }: FoodReviewsProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery<Review[]>({
    queryKey: [`/api/food-items/${foodItemId}/reviews`],
  });

  const { data: userReviews } = useQuery<Review[]>({
    queryKey: ["/api/user/reviews"],
    enabled: !!myOrderId, // Only fetch user reviews if they can review
  });

  // Check if user has already reviewed this food item
  const hasReviewed = userReviews?.some(
    (review) => review.foodItemId === foodItemId
  );

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest("DELETE", `/api/reviews/${reviewId}`);
      if (!res.ok) {
        throw new Error("Failed to delete review");
      }
    },
    onSuccess: () => {
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/food-items/${foodItemId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
  };

  const handleDeleteReview = (reviewId: number) => {
    deleteReviewMutation.mutate(reviewId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Failed to load reviews. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        {myOrderId && !hasReviewed && (
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience with this food item
                </DialogDescription>
              </DialogHeader>
              <ReviewForm
                foodItemId={foodItemId}
                orderId={myOrderId}
                onSuccess={handleReviewSuccess}
                onCancel={() => setReviewDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              isOwner={userReviews?.some((r) => r.id === review.id)}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      )}
    </div>
  );
}