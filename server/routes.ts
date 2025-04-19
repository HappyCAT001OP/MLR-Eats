import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
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
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any,
  });

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
      const { password, ...userWithoutPassword } = updatedUser;
      
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

  // QR Code for order verification
  app.patch("/api/admin/orders/:id/qr-code", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.generateQRCodeForOrder(orderId, qrCode);
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order QR code" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const reviewData = { ...req.body, userId };
      
      // Validate review data
      const validatedReview = insertReviewSchema.parse(reviewData);
      
      // Verify that the user has ordered this food item
      const orders = await storage.getUserOrders(userId);
      const hasOrdered = orders.some(order => order.id === validatedReview.orderId);
      
      if (!hasOrdered) {
        return res.status(403).json({ message: "You can only review food items from your orders" });
      }
      
      const review = await storage.createReview(validatedReview);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create review" });
      }
    }
  });

  app.get("/api/food-items/:id/reviews", async (req, res) => {
    try {
      const foodItemId = parseInt(req.params.id);
      const reviews = await storage.getFoodItemReviews(foodItemId);
      
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/user/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const reviews = await storage.getUserReviews(userId);
      
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Only allow users to delete their own reviews (except admins)
      if (review.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Subscription plan routes
  app.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.status(200).json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.status(200).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plan" });
    }
  });

  // Admin routes for subscription plans
  app.post("/api/admin/subscription-plans", async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create subscription plan" });
      }
    }
  });

  app.put("/api/admin/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Validate the update data
      const planData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const updatedPlan = await storage.updateSubscriptionPlan(planId, planData);
      
      res.status(200).json(updatedPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update subscription plan" });
      }
    }
  });

  app.delete("/api/admin/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      await storage.deleteSubscriptionPlan(planId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // User subscription routes
  app.get("/api/user/subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getUserSubscriptions(userId);
      
      res.status(200).json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/user/active-subscription", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const subscription = await storage.getActiveUserSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      res.status(200).json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active subscription" });
    }
  });

  app.post("/api/user/subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const subscriptionData = { ...req.body, userId };
      
      // Validate subscription data
      const validatedSubscription = insertUserSubscriptionSchema.parse(subscriptionData);
      
      // Get plan details to verify
      const plan = await storage.getSubscriptionPlan(validatedSubscription.planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Create the subscription
      const subscription = await storage.createUserSubscription(validatedSubscription);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create subscription" });
      }
    }
  });

  app.post("/api/user/subscription/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required" });
      }
      
      // Verify subscription belongs to user
      const subscription = await storage.getUserSubscriptions(userId);
      const userSubscription = subscription.find(sub => sub.id === subscriptionId);
      
      if (!userSubscription) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.cancelUserSubscription(subscriptionId);
      res.status(200).json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Wallet routes
  app.get("/api/user/wallet", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const balance = await storage.getUserWalletBalance(userId);
      
      res.status(200).json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet balance" });
    }
  });

  app.post("/api/user/wallet/add", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const user = await storage.addToWalletBalance(userId, parseFloat(amount));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ balance: user.walletBalance });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to wallet" });
    }
  });

  app.post("/api/user/wallet/deduct", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const user = await storage.deductFromWalletBalance(userId, parseFloat(amount));
      
      if (!user) {
        return res.status(400).json({ message: "Insufficient balance or user not found" });
      }
      
      res.status(200).json({ balance: user.walletBalance });
    } catch (error) {
      res.status(500).json({ message: "Failed to deduct from wallet" });
    }
  });

  // Payment routes with Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { amount, orderId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      // Verify the order exists and belongs to the user
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "inr",
        metadata: {
          orderId: orderId.toString(),
          userId: req.user.id.toString()
        }
      });
      
      // Update order payment info
      await storage.updateOrder(orderId, { paymentStatus: "pending" });
      
      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Stripe payment error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });
  
  app.post("/api/payment-webhook", async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
      // Verify the webhook signature
      // Note: In production, you would need to set up a webhook secret
      // and use stripe.webhooks.constructEvent(payload, sig, webhookSecret)
      event = payload;
      
      // Handle successful payments
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = parseInt(paymentIntent.metadata.orderId);
        
        // Update order payment status
        await storage.updateOrder(orderId, { 
          paymentStatus: "completed",
          status: "preparing"
        });
      }
      
      // Handle failed payments
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const orderId = parseInt(paymentIntent.metadata.orderId);
        
        // Update order payment status
        await storage.updateOrder(orderId, { 
          paymentStatus: "failed"
        });
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: 'Webhook error' });
    }
  });
  
  // Subscription payment with Stripe
  app.post("/api/create-subscription-payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Create a payment intent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: "inr",
        metadata: {
          planId: planId.toString(),
          userId: req.user.id.toString(),
          planName: plan.name,
          duration: plan.duration.toString(),
          mealsPerDay: plan.mealsPerDay.toString()
        }
      });
      
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        plan
      });
    } catch (error) {
      console.error("Stripe subscription payment error:", error);
      res.status(500).json({ message: "Subscription payment processing failed" });
    }
  });
  
  app.post("/api/subscription-payment-webhook", async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
      // Verify the webhook signature
      // Note: In production, you would need to set up a webhook secret
      event = payload;
      
      // Handle successful subscription payments
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const planId = parseInt(paymentIntent.metadata.planId);
        const userId = parseInt(paymentIntent.metadata.userId);
        const duration = parseInt(paymentIntent.metadata.duration);
        const mealsPerDay = parseInt(paymentIntent.metadata.mealsPerDay);
        
        // Calculate start and end dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        
        // Create the subscription
        await storage.createUserSubscription({
          userId,
          planId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          paymentId: paymentIntent.id,
          remainingMeals: duration * mealsPerDay,
          createdAt: new Date().toISOString()
        });
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Subscription webhook error:', error);
      res.status(400).json({ message: 'Webhook error' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
