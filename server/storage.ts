import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  users, 
  type User, type InsertUser, 
  type FoodItem, type InsertFoodItem, 
  type Order, type InsertOrder,
  type Review, type InsertReview,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type UserSubscription, type InsertUserSubscription
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Food item methods
  getAllFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, foodItemData: Partial<FoodItem>): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<boolean>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined>;
  generateQRCodeForOrder(id: number, qrCode: string): Promise<Order | undefined>;
  
  // Review methods
  createReview(review: any): Promise<any>;
  getFoodItemReviews(foodItemId: number): Promise<any[]>;
  getUserReviews(userId: number): Promise<any[]>;
  getReview(id: number): Promise<any | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Subscription plan methods
  getAllSubscriptionPlans(): Promise<any[]>;
  getSubscriptionPlan(id: number): Promise<any | undefined>;
  createSubscriptionPlan(plan: any): Promise<any>;
  updateSubscriptionPlan(id: number, planData: any): Promise<any | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  // User subscription methods
  getUserSubscriptions(userId: number): Promise<any[]>;
  getActiveUserSubscription(userId: number): Promise<any | undefined>;
  createUserSubscription(subscription: any): Promise<any>;
  updateUserSubscription(id: number, subscriptionData: any): Promise<any | undefined>;
  cancelUserSubscription(id: number): Promise<boolean>;
  deductSubscriptionMeal(userId: number): Promise<boolean>;
  
  // Wallet methods
  getUserWalletBalance(userId: number): Promise<number>;
  addToWalletBalance(userId: number, amount: number): Promise<User | undefined>;
  deductFromWalletBalance(userId: number, amount: number): Promise<User | undefined>;
  
  sessionStore: session.Store;
}

// Define a function to initialize the database with sample data
async function initializeDatabase(storage: IStorage) {
  console.log("Initializing database with sample data...");
  
  try {
    // Check if admin user exists
    const adminUser = await storage.getUserByEmail("admin@mlrit.ac.in");
    
    if (!adminUser) {
      // Add admin user
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      const admin = await storage.createUser({
        name: "Admin",
        email: "admin@mlrit.ac.in",
        password: hashedPassword,
        userType: "admin",
        hostelType: null,
        hostelBlock: null,
        roomNumber: null
      });
      
      await storage.updateUser(admin.id, { isAdmin: true });
      console.log("Admin user created");
    }
    
    // Check if food items exist
    const existingItems = await storage.getAllFoodItems();
    
    if (existingItems.length === 0) {
      // Add sample food items
      const sampleFoodItems: InsertFoodItem[] = [
        // Main dishes
        {
          name: "Chicken Biryani",
          description: "Aromatic rice with tender chicken pieces",
          price: 120,
          imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80",
          category: "Lunch",
          available: true
        },
        {
          name: "Masala Dosa",
          description: "Crispy dosa with spiced potato filling",
          price: 80,
          imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80",
          category: "Breakfast",
          available: true
        },
        {
          name: "Veg Burger",
          description: "Fresh vegetables with chef's special sauce",
          price: 60,
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        {
          name: "Club Sandwich",
          description: "Triple-decker sandwich with chicken",
          price: 70,
          imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        
        // Beverages
        {
          name: "Masala Chai",
          description: "Traditional Indian spiced tea",
          price: 15,
          imageUrl: "https://images.unsplash.com/photo-1571489058013-810d5e16a233?auto=format&fit=crop&q=80",
          category: "Beverages",
          available: true
        },
        {
          name: "Thums Up",
          description: "Strong, carbonated cola drink with a distinctive taste",
          price: 30,
          imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&q=80",
          category: "Beverages",
          available: true
        },
        {
          name: "Sprite",
          description: "Crisp, clean, lemon-lime flavored soft drink",
          price: 30,
          imageUrl: "https://images.unsplash.com/photo-1625772299918-c2c1693c75cc?auto=format&fit=crop&q=80",
          category: "Beverages",
          available: true
        },
        {
          name: "Coca-Cola",
          description: "Classic cola refreshment",
          price: 30,
          imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80",
          category: "Beverages",
          available: true
        },
        {
          name: "Fresh Lime Soda",
          description: "Refreshing lime juice with soda water",
          price: 25,
          imageUrl: "https://images.unsplash.com/photo-1555949366-25d2f9e3fec8?auto=format&fit=crop&q=80",
          category: "Beverages",
          available: true
        },
        
        // Snacks
        {
          name: "Samosa",
          description: "Crispy pastry with spiced potato filling",
          price: 20,
          imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        {
          name: "Veg Puff",
          description: "Flaky pastry filled with spiced mixed vegetables",
          price: 25,
          imageUrl: "https://images.unsplash.com/photo-1631788012442-633a4e518e9c?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        {
          name: "Egg Puff",
          description: "Flaky pastry filled with spiced boiled egg",
          price: 30,
          imageUrl: "https://images.unsplash.com/photo-1631788012408-a0d5aea68d3d?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        {
          name: "Chicken Puff",
          description: "Flaky pastry filled with spicy chicken filling",
          price: 35,
          imageUrl: "https://images.unsplash.com/photo-1631788012260-21ecbf2c9921?auto=format&fit=crop&q=80",
          category: "Snacks",
          available: true
        },
        
        // Chinese items
        {
          name: "Veg Hakka Noodles",
          description: "Stir-fried noodles with mixed vegetables",
          price: 80,
          imageUrl: "https://images.unsplash.com/photo-1634864572865-1cf8ff8bd23d?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        },
        {
          name: "Chicken Noodles",
          description: "Stir-fried noodles with chicken and vegetables",
          price: 100,
          imageUrl: "https://images.unsplash.com/photo-1600490036275-35f5f1656861?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        },
        {
          name: "Veg Manchurian",
          description: "Vegetable balls in spicy, tangy sauce",
          price: 80,
          imageUrl: "https://images.unsplash.com/photo-1626236162544-3312be1adc0a?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        },
        {
          name: "Chicken Manchurian",
          description: "Crispy chicken balls in spicy, tangy sauce",
          price: 110,
          imageUrl: "https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        },
        {
          name: "Fried Rice",
          description: "Stir-fried rice with vegetables and soy sauce",
          price: 70,
          imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        },
        {
          name: "Chicken Fried Rice",
          description: "Stir-fried rice with chicken, vegetables and soy sauce",
          price: 90,
          imageUrl: "https://images.unsplash.com/photo-1607103058027-e95827a83812?auto=format&fit=crop&q=80",
          category: "Chinese",
          available: true
        }
      ];
      
      for (const item of sampleFoodItems) {
        await storage.createFoodItem(item);
      }
      
      console.log(`Added ${sampleFoodItems.length} food items`);
    }
    
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Memory storage implementation is now only for fallback
class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    console.warn("Using in-memory storage. This is not recommended for production.");
  }
  
  async getUser(id: number): Promise<User | undefined> {
    console.warn("Using in-memory storage for getUser");
    return undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    console.warn("Using in-memory storage for getUserByEmail");
    return undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    console.warn("Using in-memory storage for createUser");
    return {} as User;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    console.warn("Using in-memory storage for updateUser");
    return undefined;
  }
  
  async getAllFoodItems(): Promise<FoodItem[]> {
    console.warn("Using in-memory storage for getAllFoodItems");
    return [];
  }
  
  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    console.warn("Using in-memory storage for getFoodItem");
    return undefined;
  }
  
  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    console.warn("Using in-memory storage for createFoodItem");
    return {} as FoodItem;
  }
  
  async updateFoodItem(id: number, foodItemData: Partial<FoodItem>): Promise<FoodItem | undefined> {
    console.warn("Using in-memory storage for updateFoodItem");
    return undefined;
  }
  
  async deleteFoodItem(id: number): Promise<boolean> {
    console.warn("Using in-memory storage for deleteFoodItem");
    return false;
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    console.warn("Using in-memory storage for createOrder");
    return {} as Order;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    console.warn("Using in-memory storage for getOrder");
    return undefined;
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    console.warn("Using in-memory storage for getUserOrders");
    return [];
  }
  
  async getAllOrders(): Promise<Order[]> {
    console.warn("Using in-memory storage for getAllOrders");
    return [];
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    console.warn("Using in-memory storage for updateOrderStatus");
    return undefined;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    console.warn("Using in-memory storage for updateOrder");
    return undefined;
  }

  async generateQRCodeForOrder(id: number, qrCode: string): Promise<Order | undefined> {
    console.warn("Using in-memory storage for generateQRCodeForOrder");
    return undefined;
  }

  async createReview(review: any): Promise<any> {
    console.warn("Using in-memory storage for createReview");
    return {};
  }

  async getFoodItemReviews(foodItemId: number): Promise<any[]> {
    console.warn("Using in-memory storage for getFoodItemReviews");
    return [];
  }

  async getUserReviews(userId: number): Promise<any[]> {
    console.warn("Using in-memory storage for getUserReviews");
    return [];
  }

  async getReview(id: number): Promise<any | undefined> {
    console.warn("Using in-memory storage for getReview");
    return undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    console.warn("Using in-memory storage for deleteReview");
    return false;
  }

  async getAllSubscriptionPlans(): Promise<any[]> {
    console.warn("Using in-memory storage for getAllSubscriptionPlans");
    return [];
  }

  async getSubscriptionPlan(id: number): Promise<any | undefined> {
    console.warn("Using in-memory storage for getSubscriptionPlan");
    return undefined;
  }

  async createSubscriptionPlan(plan: any): Promise<any> {
    console.warn("Using in-memory storage for createSubscriptionPlan");
    return {};
  }

  async updateSubscriptionPlan(id: number, planData: any): Promise<any | undefined> {
    console.warn("Using in-memory storage for updateSubscriptionPlan");
    return undefined;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    console.warn("Using in-memory storage for deleteSubscriptionPlan");
    return false;
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    console.warn("Using in-memory storage for getUserSubscriptions");
    return [];
  }

  async getActiveUserSubscription(userId: number): Promise<any | undefined> {
    console.warn("Using in-memory storage for getActiveUserSubscription");
    return undefined;
  }

  async createUserSubscription(subscription: any): Promise<any> {
    console.warn("Using in-memory storage for createUserSubscription");
    return {};
  }

  async updateUserSubscription(id: number, subscriptionData: any): Promise<any | undefined> {
    console.warn("Using in-memory storage for updateUserSubscription");
    return undefined;
  }

  async cancelUserSubscription(id: number): Promise<boolean> {
    console.warn("Using in-memory storage for cancelUserSubscription");
    return false;
  }

  async deductSubscriptionMeal(userId: number): Promise<boolean> {
    console.warn("Using in-memory storage for deductSubscriptionMeal");
    return false;
  }

  async getUserWalletBalance(userId: number): Promise<number> {
    console.warn("Using in-memory storage for getUserWalletBalance");
    return 0;
  }

  async addToWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    console.warn("Using in-memory storage for addToWalletBalance");
    return undefined;
  }

  async deductFromWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    console.warn("Using in-memory storage for deductFromWalletBalance");
    return undefined;
  }
}

// Create and export the database storage
const dbStorage = new DatabaseStorage();

// Initialize the database with sample data
initializeDatabase(dbStorage).catch(console.error);

// Export the database storage as the default storage
export const storage = dbStorage;
