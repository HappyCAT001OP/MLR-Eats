import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertFoodItemSchema, 
  insertOrderSchema, 
  insertReviewSchema, 
  insertSubscriptionPlanSchema,
  insertUserSubscriptionSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Food items routes
  app.get("/api/food-items", async (_req, res) => {
    try {
      const foodItems = await storage.getAllFoodItems();
      res.status(200).json(foodItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.get("/api/food-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const foodItem = await storage.getFoodItem(id);
      
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      res.status(200).json(foodItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food item" });
    }
  });

  // Admin routes for food items management
  app.post("/api/admin/food-items", async (req, res) => {
    try {
      const foodItemData = insertFoodItemSchema.parse(req.body);
      const foodItem = await storage.createFoodItem(foodItemData);
      res.status(201).json(foodItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create food item" });
      }
    }
  });

  app.put("/api/admin/food-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const foodItem = await storage.getFoodItem(id);
      
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      // Validate the update data
      const foodItemData = insertFoodItemSchema.partial().parse(req.body);
      const updatedFoodItem = await storage.updateFoodItem(id, foodItemData);
      
      res.status(200).json(updatedFoodItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update food item" });
      }
    }
  });

  app.delete("/api/admin/food-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const foodItem = await storage.getFoodItem(id);
      
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      await storage.deleteFoodItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  // User profile routes
  app.put("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clean up sensitive data
      const userWithoutPassword = { ...updatedUser };
      delete userWithoutPassword.password;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const orderData = { ...req.body, userId };
      
      // Validate order data
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrder);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const orders = await storage.getUserOrders(userId);
      
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only allow users to view their own orders (except admins)
      if (order.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin routes for orders
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["preparing", "out-for-delivery", "delivered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
