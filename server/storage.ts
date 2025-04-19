import { users, type User, type InsertUser, FoodItem, foodItems, InsertFoodItem, orders, Order, InsertOrder } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  getAllFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, foodItemData: Partial<FoodItem>): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<boolean>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  sessionStore: session.SessionStore;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foodItems: Map<number, FoodItem>;
  private orders: Map<number, Order>;
  sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentFoodItemId: number;
  private currentOrderId: number;

  constructor() {
    this.users = new Map();
    this.foodItems = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentFoodItemId = 1;
    this.currentOrderId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Initialize with some food items
    this.initializeFoodItems();
    // Add an admin user
    this.addAdminUser();
  }

  private initializeFoodItems() {
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

    sampleFoodItems.forEach(item => this.createFoodItem(item));
  }

  private addAdminUser() {
    const adminUser: InsertUser = {
      name: "Admin",
      email: "admin@mlrit.ac.in",
      password: "admin123", // This will be hashed in the auth.ts file
      userType: "admin",
      hostelType: null,
      hostelBlock: null,
      roomNumber: null
    };

    this.createUser({...adminUser}).then(user => {
      // Set isAdmin to true for this user
      this.updateUser(user.id, { isAdmin: true });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false // Always create regular users by default
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Food item methods
  async getAllFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(insertFoodItem: InsertFoodItem): Promise<FoodItem> {
    const id = this.currentFoodItemId++;
    const foodItem: FoodItem = { ...insertFoodItem, id };
    this.foodItems.set(id, foodItem);
    return foodItem;
  }

  async updateFoodItem(id: number, foodItemData: Partial<FoodItem>): Promise<FoodItem | undefined> {
    const existingFoodItem = this.foodItems.get(id);
    
    if (!existingFoodItem) {
      return undefined;
    }
    
    const updatedFoodItem = { ...existingFoodItem, ...foodItemData };
    this.foodItems.set(id, updatedFoodItem);
    return updatedFoodItem;
  }

  async deleteFoodItem(id: number): Promise<boolean> {
    return this.foodItems.delete(id);
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: "preparing", 
      createdAt: now
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    
    if (!existingOrder) {
      return undefined;
    }
    
    const updatedOrder = { ...existingOrder, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
}

export const storage = new MemStorage();
