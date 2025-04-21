import { Router, Request, Response, NextFunction } from "express";
import { orders } from "./schema";
import { eq } from "drizzle-orm";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default function orderRoutes(db: any) {
  const router = Router();

  // Get all orders (admin) or user orders
  router.get("/", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    if (req.user?.isAdmin) {
      const allOrders = await db.select().from(orders);
      return res.json(allOrders);
    }
    const userOrders = await db.select().from(orders).where(eq(orders.userId, req.user!.id));
    res.json(userOrders);
  });

  // Place an order
  router.post("/", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { items, subtotal, deliveryFee, total, status, deliveryType, hostelType, hostelBlock, roomNumber, paymentId, paymentStatus, qrCode, estimatedDeliveryTime } = req.body;
    const [order] = await db.insert(orders).values({
      userId: req.user!.id,
      items,
      subtotal,
      deliveryFee,
      total,
      status,
      deliveryType,
      hostelType,
      hostelBlock,
      roomNumber,
      paymentId,
      paymentStatus,
      qrCode,
      estimatedDeliveryTime
    }).returning();
    res.status(201).json(order);
  });

  // Update order status (admin only)
  router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, deliveredAt } = req.body;
    const [order] = await db.update(orders).set({ status, deliveredAt }).where(eq(orders.id, Number(id))).returning();
    res.json(order);
  });

  // Delete order (admin only)
  router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(orders).where(eq(orders.id, Number(id)));
    res.status(204).end();
  });

  return router;
}
