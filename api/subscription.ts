import { Router, Request, Response, NextFunction } from "express";
import { subscriptionPlans, userSubscriptions } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function subscriptionRoutes(db: any) {
  const router = Router();

  // Get all plans
  router.get("/plans", async (_req: Request, res: Response) => {
    const plans = await db.select().from(subscriptionPlans);
    res.json(plans);
  });

  // Subscribe to a plan
  router.post("/subscribe", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { planId, startDate, endDate, paymentId, remainingMeals } = req.body;
    const [sub] = await db.insert(userSubscriptions).values({
      userId: req.user!.id,
      planId,
      startDate,
      endDate,
      paymentId,
      remainingMeals,
      isActive: true
    }).returning();
    res.status(201).json(sub);
  });

  // Get user subscriptions
  router.get("/my", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const subs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, req.user!.id));
    res.json(subs);
  });

  // Cancel subscription
  router.put("/cancel/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { id } = req.params;
    const [sub] = await db.update(userSubscriptions).set({ isActive: false }).where(eq(userSubscriptions.id, Number(id))).returning();
    res.json(sub);
  });

  // Admin: view all user subscriptions
  router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
    const subs = await db.select().from(userSubscriptions);
    res.json(subs);
  });

  return router;
}
