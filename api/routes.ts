import { Router } from "express";
import authRoutes from "./auth";
import reviewRoutes from "./review";
import foodRoutes from "./food";
import orderRoutes from "./order";
import adminRoutes from "./admin";
import subscriptionRoutes from "./subscription";
import walletRoutes from "./wallet";

export default function setupRoutes(db: any) {
  const router = Router();
  router.use("/auth", authRoutes(db));
  router.use("/reviews", reviewRoutes(db));
  router.use("/food", foodRoutes(db));
  router.use("/orders", orderRoutes(db));
  router.use("/admin", adminRoutes(db));
  router.use("/subscriptions", subscriptionRoutes(db));
  router.use("/wallet", walletRoutes(db));
  return router;
}
