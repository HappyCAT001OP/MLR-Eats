import { Router, Request, Response, NextFunction } from "express";
import { users } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function walletRoutes(db: any) {
  const router = Router();

  // Get wallet balance
  router.get("/balance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    res.json({ balance: user?.walletBalance || 0 });
  });

  // Add funds
  router.post("/add", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { newBalance } = req.body;
    const [user] = await db.update(users)
      .set({ walletBalance: newBalance })
      .where(eq(users.id, req.user!.id))
      .returning();
    res.json({ balance: user.walletBalance });
  });

  // Deduct funds (admin only)
  router.post("/deduct", requireAdmin, async (req: Request, res: Response) => {
    const { userId, newBalance } = req.body;
    const [user] = await db.update(users)
      .set({ walletBalance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    res.json({ balance: user.walletBalance });
  });

  return router;
}
