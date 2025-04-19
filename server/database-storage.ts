import { 
  users, foodItems, orders, reviews, subscriptionPlans, userSubscriptions,
  type User, type InsertUser, 
  type FoodItem, type InsertFoodItem, 
  type Order, type InsertOrder,
  type Review, type InsertReview,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type UserSubscription, type InsertUserSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, avg, count } from "drizzle-orm";
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
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      // If error is related to missing columns, it's likely because migrations are still running
      if ((error as any)?.code === '42703') {
        console.warn("Column not found error in getUser - this is expected during migration");
        // Try a simpler query that doesn't include the new fields
        const result = await db.execute(
          sql`SELECT id, name, email, password, user_type, hostel_type, hostel_block, room_number, is_admin FROM users WHERE id = ${id}`
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            userType: row.user_type,
            hostelType: row.hostel_type,
            hostelBlock: row.hostel_block,
            roomNumber: row.room_number,
            isAdmin: row.is_admin,
            walletBalance: 0 // Default value
          } as User;
        }
        return undefined;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      // If error is related to missing columns, it's likely because migrations are still running
      if ((error as any)?.code === '42703') {
        console.warn("Column not found error in getUserByEmail - this is expected during migration");
        // Try a simpler query that doesn't include the new fields
        const result = await db.execute(
          sql`SELECT id, name, email, password, user_type, hostel_type, hostel_block, room_number, is_admin FROM users WHERE email = ${email}`
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            userType: row.user_type,
            hostelType: row.hostel_type,
            hostelBlock: row.hostel_block,
            roomNumber: row.room_number,
            isAdmin: row.is_admin,
            walletBalance: 0 // Default value
          } as User;
        }
        return undefined;
      }
      throw error;
    }
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

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async generateQRCodeForOrder(id: number, qrCode: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ qrCode })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    
    // Update food item's average rating and count
    await this.updateFoodItemRating(insertReview.foodItemId);
    
    return review;
  }

  async getFoodItemReviews(foodItemId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.foodItemId, foodItemId))
      .orderBy(reviews.createdAt, 'desc');
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(reviews.createdAt, 'desc');
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
      
    if (!review) return false;
    
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning({ id: reviews.id });
    
    // Update food item's average rating and count
    await this.updateFoodItemRating(review.foodItemId);
    
    return result.length > 0;
  }

  private async updateFoodItemRating(foodItemId: number): Promise<void> {
    // Calculate new average rating
    const [result] = await db
      .select({
        averageRating: avg(reviews.rating),
        ratingCount: count(reviews.id)
      })
      .from(reviews)
      .where(eq(reviews.foodItemId, foodItemId));
    
    if (result) {
      await db
        .update(foodItems)
        .set({
          averageRating: result.averageRating || 0,
          ratingCount: result.ratingCount || 0
        })
        .where(eq(foodItems.id, foodItemId));
    }
  }

  // Subscription plan methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async updateSubscriptionPlan(id: number, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(planData)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    // Instead of deleting, set as inactive
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ isActive: false })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return !!updatedPlan;
  }

  // User subscription methods
  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt, 'desc');
  }

  async getActiveUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.isActive, true)
        )
      );
    return subscription;
  }

  async createUserSubscription(insertSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateUserSubscription(id: number, subscriptionData: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set(subscriptionData)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelUserSubscription(id: number): Promise<boolean> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({ isActive: false })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return !!updatedSubscription;
  }
  
  async deductSubscriptionMeal(userId: number): Promise<boolean> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.isActive, true)
        )
      );
    
    if (!subscription || subscription.remainingMeals <= 0) {
      return false;
    }
    
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({ 
        remainingMeals: subscription.remainingMeals - 1,
        isActive: subscription.remainingMeals > 1 // Deactivate if this is the last meal
      })
      .where(eq(userSubscriptions.id, subscription.id))
      .returning();
    
    return !!updatedSubscription;
  }

  // Wallet methods
  async getUserWalletBalance(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.walletBalance || 0;
  }

  async addToWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        walletBalance: (user.walletBalance || 0) + amount 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async deductFromWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user || (user.walletBalance || 0) < amount) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        walletBalance: (user.walletBalance || 0) - amount 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}