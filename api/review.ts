import { Router, Request, Response, NextFunction } from "express";
import { reviews } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function reviewRoutes(db: any) {
  const router = Router();

  // Get all reviews for a food item
  router.get("/food/:foodItemId", async (req: Request, res: Response) => {
    const { foodItemId } = req.params;
    const foodReviews = await db.select().from(reviews).where(eq(reviews.foodItemId, Number(foodItemId)));
    res.json(foodReviews);
  });

  // Add a review (user)
  router.post("/", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { foodItemId, orderId, rating, comment } = req.body;
    const [review] = await db.insert(reviews).values({
      userId: req.user!.id,
      foodItemId,
      orderId: orderId || null,
      rating,
      comment
    }).returning();
    res.status(201).json(review);
  });

  // Delete a review (admin only)
  router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(reviews).where(eq(reviews.id, Number(id)));
    res.status(204).end();
  });

  return router;
}
