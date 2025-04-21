import { Router, Request, Response, NextFunction } from "express";
import { users, foodItems, orders, reviews, subscriptionPlans, userSubscriptions } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function adminRoutes(db: any) {
  const router = Router();

  // Get all users
  router.get("/users", requireAdmin, async (_req: Request, res: Response) => {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  });

  // Get all orders
  router.get("/orders", requireAdmin, async (_req: Request, res: Response) => {
    const allOrders = await db.select().from(orders);
    res.json(allOrders);
  });

  // Get all food items
  router.get("/food", requireAdmin, async (_req: Request, res: Response) => {
    const allFood = await db.select().from(foodItems);
    res.json(allFood);
  });

  // Get all subscriptions
  router.get("/subscriptions", requireAdmin, async (_req: Request, res: Response) => {
    const allSubs = await db.select().from(userSubscriptions);
    res.json(allSubs);
  });

  // Get all reviews
  router.get("/reviews", requireAdmin, async (_req: Request, res: Response) => {
    const allReviews = await db.select().from(reviews);
    res.json(allReviews);
  });

  // Add/update/delete subscription plan (admin)
  router.post("/plan", requireAdmin, async (req: Request, res: Response) => {
    const { name, description, price, duration, mealsPerDay } = req.body;
    const [plan] = await db.insert(subscriptionPlans).values({ name, description, price, duration, mealsPerDay }).returning();
    res.status(201).json(plan);
  });

  router.put("/plan/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, duration, mealsPerDay, isActive } = req.body;
    const [plan] = await db.update(subscriptionPlans)
      .set({ name, description, price, duration, mealsPerDay, isActive })
      .where(eq(subscriptionPlans.id, Number(id)))
      .returning();
    res.json(plan);
  });

  router.delete("/plan/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, Number(id)));
    res.status(204).end();
  });

  return router;
}
