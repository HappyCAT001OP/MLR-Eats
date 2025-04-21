import { Router, Request, Response, NextFunction } from "express";
import { foodItems } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function foodRoutes(db: any) {
  const router = Router();

  // Get all food items
  router.get("/", async (_req: Request, res: Response) => {
    const items = await db.select().from(foodItems);
    res.json(items);
  });

  // Add food item (admin only)
  router.post("/", requireAdmin, async (req: Request, res: Response) => {
    const { name, description, price, imageUrl, category, available } = req.body;
    const [item] = await db.insert(foodItems).values({ name, description, price, imageUrl, category, available }).returning();
    res.status(201).json(item);
  });

  // Update food item (admin only)
  router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, imageUrl, category, available } = req.body;
    const [item] = await db.update(foodItems)
      .set({ name, description, price, imageUrl, category, available })
      .where(eq(foodItems.id, Number(id)))
      .returning();
    res.json(item);
  });

  // Delete food item (admin only)
  router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(foodItems).where(eq(foodItems.id, Number(id)));
    res.status(204).end();
  });

  return router;
}
