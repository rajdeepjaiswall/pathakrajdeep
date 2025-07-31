import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertProductSchema, insertCategorySchema, insertOrderSchema, insertOrderItemSchema, insertCartItemSchema, insertAddressSchema, insertReviewSchema, insertBannerSchema } from "@shared/schema";
import otpRoutes from "./otp-routes";

const JWT_SECRET = process.env.JWT_SECRET || "pathak-bakery-secret-key";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Hybrid authentication middleware (JWT or Session)
function authenticateUser(req: any, res: any, next: any) {
  // Check for session-based authentication first (Google OAuth)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Fall back to JWT authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: 'Authentication required' });
    req.user = user;
    next();
  });
}

// Optional authentication middleware for cart/wishlist
function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

// Middleware to verify admin role
function requireAdmin(req: any, res: any, next: any) {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Middleware to verify super admin role
function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
}

import { initializeGoogleAuth, setupSession, setupGoogleAuthRoutes } from "./google-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session and Google OAuth
  setupSession(app);
  initializeGoogleAuth();
  setupGoogleAuthRoutes(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'customer',
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email, phone: user.phone } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // For demo purposes, check plain text passwords for admin accounts
      const isValidPassword = user.password === password || 
                             (user.password && await bcrypt.compare(password, user.password));

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email, phone: user.phone } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      // In a real implementation, you would verify the OTP with your SMS service
      // For now, we'll accept any 6-digit OTP
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'Invalid OTP format' });
      }

      // Find or create user with phone number
      let user = await storage.getUserByPhone(phone);
      if (!user) {
        user = await storage.createUser({
          username: phone,
          phone,
          password: await bcrypt.hash('temp-password', 10),
          role: 'customer',
          isVerified: true,
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      // In a real implementation, you would send OTP via SMS service
      // For now, we'll just return success
      res.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Auth status route (supports both JWT and session)
  app.get('/api/auth/status', optionalAuth, async (req, res) => {
    try {
      console.log('Auth status check:', {
        hasIsAuthenticated: typeof req.isAuthenticated === 'function',
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasSessionUser: !!req.user,
        sessionData: req.session ? Object.keys(req.session) : null,
        sessionId: req.sessionID || 'none'
      });

      // Check session-based auth first (Google OAuth)
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log('Session user found:', req.user.id);
        // Fetch complete user data from database
        const fullUser = await storage.getUser(req.user.id);
        if (fullUser) {
          res.json({ 
            isAuthenticated: true, 
            user: fullUser,
            authType: 'session'
          });
          return;
        }
      }
      
      // Check JWT-based auth
      if (req.user && !req.isAuthenticated) {
        console.log('JWT user found:', req.user.id);
        // Fetch complete user data from database
        const fullUser = await storage.getUser(req.user.id);
        if (fullUser) {
          res.json({ 
            isAuthenticated: true, 
            user: fullUser,
            authType: 'jwt'
          });
          return;
        }
      }
      
      console.log('No authentication found');
      res.json({ 
        isAuthenticated: false,
        authType: null
      });
    } catch (error: any) {
      console.error('Auth status error:', error);
      res.json({ 
        isAuthenticated: false,
        authType: null,
        error: error.message
      });
    }
  });

  // Enhanced authentication middleware that works with both JWT and sessions
  function authenticateUser(req: any, res: any, next: any) {
    // Check for session-based auth first (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      // Session user is already set by passport, just continue
      return next();
    }
    
    // Fallback to JWT auth
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = user;
      next();
    });
  }

  // Phone verification routes
  app.post("/api/auth/send-phone-otp", authenticateUser, async (req, res) => {
    try {
      const { phone } = req.body;
      const userId = req.user.id;
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      await storage.createOtp({
        identifier: phone,
        otp: otp,
        type: 'whatsapp',
        purpose: 'verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      // In production, send OTP via WhatsApp/SMS
      console.log(`OTP for ${phone}: ${otp}`); // For development
      
      res.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-phone", authenticateUser, async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const userId = req.user.id;
      
      // Verify OTP
      const isValid = await storage.verifyOtp(phone, otp, 'whatsapp');
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      
      // Update user phone and verification status
      const updatedUser = await storage.updateUser(userId, {
        phone,
        isVerified: true,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Profile management routes
  app.put("/api/auth/profile", authenticateUser, async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      const userId = req.user.id;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Complete profile after Google OAuth (legacy endpoint)
  app.post("/api/auth/complete-profile", authenticateUser, async (req, res) => {
    try {
      const { phone, password, addressLine1, addressLine2, city, state, pinCode } = req.body;
      
      // Get user ID from session (Google OAuth) or JWT
      let userId;
      if (req.isAuthenticated && req.isAuthenticated()) {
        // Session-based authentication (Google OAuth)
        const sessionUser = req.user as any;
        userId = sessionUser.claims?.sub || sessionUser.id;
        console.log('Google OAuth user ID:', userId, 'Full user:', sessionUser);
      } else {
        // JWT-based authentication
        userId = (req.user as any)?.id || (req.user as any)?.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
      }
      
      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, {
        phone,
        password: hashedPassword,
        addressLine1,
        addressLine2,
        city,
        state,
        pinCode,
        profileCompleted: true,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Complete profile error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced complete profile with address management
  app.post("/api/auth/complete-profile-with-address", authenticateUser, async (req, res) => {
    try {
      const { phone, password, address } = req.body;
      
      // Get user ID from session (Google OAuth) or JWT
      let userId;
      if (req.isAuthenticated && req.isAuthenticated()) {
        // Session-based authentication (Google OAuth)
        const sessionUser = req.user as any;
        userId = sessionUser.claims?.sub || sessionUser.id;
        console.log('Google OAuth user ID:', userId, 'Full user:', sessionUser);
      } else {
        // JWT-based authentication
        userId = (req.user as any)?.id || (req.user as any)?.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
      }

      // Validate required fields
      if (!phone || !password || !address) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate address object
      const requiredAddressFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
      const missingAddressField = requiredAddressFields.find(field => !address[field]);
      if (missingAddressField) {
        return res.status(400).json({ message: `Missing address field: ${missingAddressField}` });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        phone,
        password: hashedPassword,
        profileCompleted: true,
      });

      // If this is a new address (isDefault true), make sure all other addresses are not default
      if (address.isDefault) {
        await storage.clearDefaultAddresses(userId);
      }
      
      // Create the address
      const newAddress = await storage.createAddress({
        userId: userId,
        name: address.name,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark || null,
        isDefault: address.isDefault || false,
      });

      res.json({ 
        user: updatedUser, 
        address: newAddress,
        message: 'Profile completed and address saved successfully'
      });
    } catch (error: any) {
      console.error('Complete profile with address error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Skip profile completion
  app.post("/api/auth/skip-profile", authenticateUser, async (req, res) => {
    try {
      // Get user ID from session (Google OAuth) or JWT
      let userId;
      if (req.isAuthenticated && req.isAuthenticated()) {
        const sessionUser = req.user as any;
        userId = sessionUser.claims?.sub || sessionUser.id;
      } else {
        userId = (req.user as any)?.id || (req.user as any)?.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
      }

      // Mark profile as completed (so user doesn't get redirected again) but with minimal data
      const updatedUser = await storage.updateUser(userId, {
        profileCompleted: false, // Keep false so they can complete later
      });

      res.json({ 
        user: updatedUser,
        message: 'Profile completion skipped'
      });
    } catch (error: any) {
      console.error('Skip profile error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Skip profile completion (mark as incomplete but allow access)
  app.post("/api/auth/skip-profile", authenticateUser, async (req, res) => {
    try {
      // Get user ID from session (Google OAuth) or JWT
      let userId;
      if (req.isAuthenticated && req.isAuthenticated()) {
        // Session-based authentication (Google OAuth)
        const sessionUser = req.user as any;
        userId = sessionUser.claims?.sub || sessionUser.id;
      } else {
        // JWT-based authentication
        userId = (req.user as any)?.id || (req.user as any)?.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        profileCompleted: false,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Skip profile error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Link Google account to existing user
  app.post("/api/auth/link-google", authenticateUser, async (req, res) => {
    try {
      const { googleId } = req.body;
      const userId = req.user.id;
      
      // Check if Google ID is already linked to another account
      const existingUser = await storage.getUserByGoogleId(googleId);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Google account is already linked to another user' });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        googleId,
        authProvider: 'google',
        isVerified: true,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Address management routes
  app.get("/api/addresses", authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getAddresses(userId);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/addresses", authenticateUser, async (req, res) => {
    try {
      const addressData = insertAddressSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/addresses/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const addressData = insertAddressSchema.partial().parse(req.body);
      const address = await storage.updateAddress(id, addressData);
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/addresses/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Add security check to ensure user owns this address
      const address = await storage.getAddress(id);
      if (!address || address.userId !== req.user.id) {
        return res.status(404).json({ message: 'Address not found' });
      }
      
      await storage.deleteAddress(id);
      res.json({ message: 'Address deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User order history
  app.get("/api/orders/user", authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin category management routes
  app.post("/api/admin/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category_id, featured, search } = req.query;
      const products = await storage.getProducts({
        categoryId: category_id ? parseInt(category_id as string) : undefined,
        featured: featured === 'true',
        search: search as string,
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", optionalAuth, async (req, res) => {
    try {
      // Check session auth first
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.json([]);
      }
      
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist", async (req, res) => {
    try {
      // For now, return empty array if not authenticated
      if (!req.user) {
        return res.json([]);
      }
      const wishlistItems = await storage.getWishlistItems(req.user.id);
      res.json(wishlistItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      // Check if user is authenticated
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Please login to add items to wishlist' });
      }

      // Verify token
      jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ message: 'Please login to add items to wishlist' });
        }
        
        try {
          const { product_id } = req.body;
          const wishlistItem = await storage.addToWishlist({
            user_id: user.id,
            product_id: parseInt(product_id),
          });
          res.json(wishlistItem);
        } catch (error: any) {
          res.status(400).json({ message: error.message });
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    try {
      // Check if user is authenticated
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Please login to manage wishlist' });
      }

      // Verify token
      jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ message: 'Please login to manage wishlist' });
        }
        
        try {
          const productId = parseInt(req.params.productId);
          await storage.removeFromWishlist(productId, user.id);
          res.json({ message: "Product removed from wishlist" });
        } catch (error: any) {
          res.status(400).json({ message: error.message });
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/cart", optionalAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Please login to add items to cart' });
      }
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        user_id: req.user.id,
      });
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(parseInt(req.params.id), quantity, req.user.id);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id), req.user.id);
      res.json({ message: 'Item removed from cart' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Address routes
  app.get("/api/addresses", authenticateToken, async (req, res) => {
    try {
      const addresses = await storage.getAddresses(req.user.id);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/addresses", authenticateToken, async (req, res) => {
    try {
      const addressData = insertAddressSchema.parse({
        ...req.body,
        user_id: req.user.id,
      });
      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Order routes
  app.get("/api/orders", optionalAuth, async (req, res) => {
    try {
      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'Please login to view orders' });
      }

      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", optionalAuth, async (req, res) => {
    try {
      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'Please login to view order details' });
      }

      const order = await storage.getOrder(parseInt(req.params.id), userId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/orders", optionalAuth, async (req, res) => {
    try {
      console.log('POST /api/orders - Request received', {
        method: req.method,
        body: req.body,
        headers: req.headers['authorization'] ? 'Bearer [present]' : 'No auth header'
      });

      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        console.log('Order creation failed: No authentication');
        return res.status(401).json({ message: 'Please login to place an order' });
      }

      console.log('Creating order for user ID:', userId);
      const orderData = insertOrderSchema.parse({
        ...req.body,
        user_id: userId,
      });
      const order = await storage.createOrder(orderData);
      console.log('Order created successfully:', order.id, order.orderNumber);
      res.json(order);
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Order items endpoint
  app.post("/api/order-items", optionalAuth, async (req, res) => {
    try {
      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'Please login to create order items' });
      }

      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      res.json(orderItem);
    } catch (error: any) {
      console.error('Order item creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's previously ordered product IDs
  app.get("/api/previously-ordered", optionalAuth, async (req, res) => {
    try {
      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.json([]);
      }

      const previouslyOrderedProducts = await storage.getPreviouslyOrderedProducts(userId);
      res.json(previouslyOrderedProducts);
    } catch (error: any) {
      console.error('Get previously ordered products error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Cancel order route (only allowed for pending and getting_ready status)
  app.put("/api/orders/:id/cancel", optionalAuth, async (req, res) => {
    try {
      // Check session auth first for Google OAuth users
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.id;
      } else if (req.user) {
        userId = req.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: 'Please login to cancel orders' });
      }

      const orderId = parseInt(req.params.id);
      
      // Check if order belongs to user and can be cancelled
      const order = await storage.getOrder(orderId, userId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Only allow cancellation for pending and getting_ready status
      if (!['pending', 'getting_ready'].includes(order.status)) {
        return res.status(400).json({ 
          message: 'Order cannot be cancelled at this stage' 
        });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, 'cancelled');
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const orders = await storage.getAllOrders(status as string);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/rider", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { riderName, riderPhone, riderImage } = req.body;
      const order = await storage.updateOrderRider(parseInt(req.params.id), riderName, riderPhone, riderImage);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Add estimated delivery time update endpoint
  app.put("/api/admin/orders/:id/delivery-time", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { estimatedDelivery } = req.body;
      const order = await storage.updateOrderDeliveryTime(parseInt(req.params.id), estimatedDelivery);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update estimated delivery time
  app.put("/api/admin/orders/:id/delivery-time", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { estimatedDelivery } = req.body;
      const order = await storage.updateOrderDeliveryTime(parseInt(req.params.id), estimatedDelivery);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/customers", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/analytics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Review routes
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(parseInt(req.params.id));
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/reviews", authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        user_id: req.user.id,
        product_id: parseInt(req.params.id),
      });
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Logo management routes
  let currentLogo: Buffer | null = null;
  
  // Load the KB logo from attached assets
  try {
    const logoPath = path.join(process.cwd(), 'attached_assets', 'project_20250528_0850089-01.png');
    if (fs.existsSync(logoPath)) {
      currentLogo = fs.readFileSync(logoPath);
    }
  } catch (error) {
    console.log('KB logo not found, using fallback');
  }
  
  app.get("/api/logo", (req, res) => {
    if (currentLogo) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(currentLogo);
    } else {
      // Default logo SVG
      const defaultLogo = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#ea580c"/>
        <text x="16" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">PB</text>
      </svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(defaultLogo);
    }
  });

  app.post("/api/super-admin/logo", authenticateToken, (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { imageData } = req.body;
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      currentLogo = Buffer.from(base64Data, 'base64');
      
      res.json({ message: "Logo updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Banner routes
  app.get("/api/banners", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const banners = await storage.getBanners(activeOnly);
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getBanner(id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bannerData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(id, bannerData);
      res.json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.json({ message: "Banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin banner management routes
  app.post("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bannerData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(id, bannerData);
      res.json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.json({ message: "Banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // OTP routes for email and WhatsApp verification
  app.use("/api/otp", otpRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
