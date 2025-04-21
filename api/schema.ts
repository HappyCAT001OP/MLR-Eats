// drizzle-orm schema for PostgreSQL tables
import { pgTable, text, serial, integer, boolean, timestamp, json, real, date } from "drizzle-orm/pg-core";

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
  walletBalance: real("wallet_balance").default(0)
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  available: boolean("available").default(true),
  averageRating: real("average_rating").default(0),
  ratingCount: integer("rating_count").default(0)
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  items: json("items").notNull().$type<any[]>(),
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
  createdAt: timestamp("created_at").defaultNow()
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  foodItemId: integer("food_item_id").notNull(),
  orderId: integer("order_id"), 
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow()
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  duration: integer("duration").notNull(), // in days
  mealsPerDay: integer("meals_per_day").notNull(),
  isActive: boolean("is_active").default(true)
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  paymentId: text("payment_id").notNull(),
  remainingMeals: integer("remaining_meals").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
