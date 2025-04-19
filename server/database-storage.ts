import { users, foodItems, orders, type User, type InsertUser, type FoodItem, type InsertFoodItem, type Order, type InsertOrder } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Food item methods
  async getAllFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const [foodItem] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return foodItem;
  }

  async createFoodItem(insertFoodItem: InsertFoodItem): Promise<FoodItem> {
    const [foodItem] = await db
      .insert(foodItems)
      .values(insertFoodItem)
      .returning();
    return foodItem;
  }

  async updateFoodItem(id: number, foodItemData: Partial<FoodItem>): Promise<FoodItem | undefined> {
    const [updatedFoodItem] = await db
      .update(foodItems)
      .set(foodItemData)
      .where(eq(foodItems.id, id))
      .returning();
    return updatedFoodItem;
  }

  async deleteFoodItem(id: number): Promise<boolean> {
    const result = await db
      .delete(foodItems)
      .where(eq(foodItems.id, id))
      .returning({ id: foodItems.id });
    return result.length > 0;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(orders.createdAt, 'desc');
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt, 'desc');
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}