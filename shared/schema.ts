import { pgTable, text, serial, integer, boolean, timestamp, json, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(),
  hostelType: text("hostel_type"),
  hostelBlock: text("hostel_block"),
  roomNumber: text("room_number"),
  isAdmin: boolean("is_admin").default(false),
  walletBalance: real("wallet_balance").default(0),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    name: true,
    email: true,
    password: true,
    userType: true,
    hostelType: true,
    hostelBlock: true,
    roomNumber: true,
  })
  .extend({
    email: z.string().email().endsWith('@mlrit.ac.in', { message: 'Only @mlrit.ac.in emails are allowed' })
  });

// Food items schema
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  available: boolean("available").default(true),
  averageRating: real("average_rating").default(0),
  ratingCount: integer("rating_count").default(0),
});

export const insertFoodItemSchema = createInsertSchema(foodItems).pick({
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  category: true,
  available: true,
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  items: json("items").notNull().$type<OrderItem[]>(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  deliveryType: text("delivery_type").notNull(),
  hostelType: text("hostel_type"),
  hostelBlock: text("hostel_block"),
  roomNumber: text("room_number"),
  paymentId: text("payment_id").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  qrCode: text("qr_code"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  items: true,
  subtotal: true,
  deliveryFee: true,
  total: true,
  deliveryType: true,
  hostelType: true,
  hostelBlock: true,
  roomNumber: true,
  paymentId: true,
});

// Reviews schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  foodItemId: integer("food_item_id").notNull(),
  orderId: integer("order_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  foodItemId: true,
  orderId: true,
  rating: true,
  comment: true,
});

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  duration: integer("duration").notNull(), // in days
  mealsPerDay: integer("meals_per_day").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  price: true,
  duration: true,
  mealsPerDay: true,
  isActive: true,
});

// User subscriptions schema
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  paymentId: text("payment_id").notNull(),
  remainingMeals: integer("remaining_meals").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  startDate: true,
  endDate: true,
  paymentId: true,
  remainingMeals: true,
});

// Helper types
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

// Schema types exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Login type
export type LoginData = Pick<InsertUser, "email" | "password">;
