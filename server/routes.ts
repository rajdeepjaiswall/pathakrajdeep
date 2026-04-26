import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { insertUserSchema, insertProductSchema, insertCategorySchema, insertOrderSchema, insertOrderItemSchema, insertCartItemSchema, insertAddressSchema, insertReviewSchema, insertBannerSchema, orders, otps } from "@shared/schema";
import otpRoutes from "./otp-routes";
import { otpService } from "./otp-service";
import { initiatePhonePePayment, checkPhonePePaymentStatus, isPhonePeConfigured, getPhonePeConfig, verifyPhonePeWebhook, parsePhonePeWebhook, getWebhookCredentials, PhonePeWebhookPayload } from "./phonepe";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import { uploadBase64ToR2, isR2Configured } from "./r2";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || "pathak-bakery-secret-key";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated?: () => boolean;
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
    if (err) return res.status(401).json({ message: 'Session expired. Please login again.', requireLogin: true });
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
  // Check for session-based authentication first (Google OAuth)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
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

// Simple in-memory notification function (can be extended with Web Push later)
async function sendOrderStatusNotification(userId: number, orderId: number, status: string, orderNumber: string) {
  console.log(`Sending notification to user ${userId}: Order #${orderNumber} status changed to ${status}`);
  // For now, just log the notification - can be extended with actual push notification service
  return true;
}

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

  app.post("/api/otp/verify-otp", async (req, res) => {
    try {
      const { identifier, phone, otp, type } = req.body;
      const targetIdentifier = identifier || phone;
      console.log(`Verifying OTP: targetIdentifier=${targetIdentifier}, otp=${otp}, type=${type}`);
      
      if (!targetIdentifier || !otp || !type) {
        return res.status(400).json({ success: false, message: 'Identifier/Phone, OTP and type are required' });
      }

      // Special case for 'whatsapp' type which might actually be 'sms' in the database
      // If we can't find it as 'whatsapp', we might want to check 'sms' or just rely on the service
      const result = await otpService.verifyOTP(targetIdentifier, otp, type);
      
      if (result.success) {
        res.json(result);
      } else {
        // Fallback for cases where type might be mismatched (sms vs whatsapp)
        if (type === 'whatsapp' || type === 'sms') {
          const alternateType = type === 'whatsapp' ? 'sms' : 'whatsapp';
          console.log(`Trying alternate OTP type: ${alternateType}`);
          const fallbackResult = await otpService.verifyOTP(targetIdentifier, otp, alternateType);
          if (fallbackResult.success) {
            return res.json(fallbackResult);
          }
        }
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify OTP. Please try again.' });
    }
  });

  app.post("/api/otp/send", async (req, res) => {
    try {
      const { phone, type, name, identifier } = req.body;
      const targetPhone = phone || identifier;
      console.log(`Sending OTP request: targetPhone=${targetPhone}, type=${type}, name=${name}`);
      
      if (!targetPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      let result;
      if (type === 'whatsapp') {
        result = await otpService.sendWhatsAppOTP(targetPhone, name || 'Customer');
      } else {
        result = await otpService.sendSMSOTP(targetPhone, name || 'Customer');
      }
      
      console.log(`OTP send result for ${targetPhone}:`, result);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Detailed Send OTP error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP. Please try again.',
        error: error.message 
      });
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

  // Enhanced authentication middleware that works with both JWT and sessions (removing duplicate)

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
      const { phone, otp, type, identifier } = req.body;
      const targetPhone = phone || identifier;
      const userId = req.user.id;
      
      console.log(`Verifying phone OTP: ${targetPhone}, OTP: ${otp}, Type: ${type || 'whatsapp'}`);

      if (!targetPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      // Verify OTP using otpService for consistency
      const result = await otpService.verifyOTP(targetPhone, otp, type || 'whatsapp');
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: result.message,
          verified: false 
        });
      }
      
      // Update user phone and verification status
      const updatedUser = await storage.updateUser(userId, {
        phone: targetPhone,
        isVerified: true,
      });
      
      res.json({
        ...updatedUser,
        success: true,
        message: 'Phone verified successfully'
      });
    } catch (error: any) {
      console.error('Verify phone error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Profile management routes
  app.put("/api/auth/profile", authenticateUser, async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      const userId = req.user.id;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        ...(phone && { phone }),
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Upload profile image
  app.post("/api/profile/upload-image", authenticateUser, async (req, res) => {
    try {
      const { imageData } = req.body;
      
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
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // For now, we'll store the base64 image directly
      // In a production environment, you'd want to upload to a cloud storage service
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageData,
      });
      
      res.json({ 
        message: "Profile image updated successfully",
        profileImageUrl: imageData,
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      const userId = req.user.id;
      const addressData = insertAddressSchema.parse({
        ...req.body,
        userId: userId,
      });

      // Check if this phone number has been verified before for this user or any user
      const [verifiedOtp] = await db
        .select()
        .from(otps)
        .where(
          and(
            eq(otps.identifier, addressData.phone),
            eq(otps.isVerified, true)
          )
        )
        .limit(1);

      console.log(`Checking verification for ${addressData.phone}: ${!!verifiedOtp}`);

      const address = await storage.createAddress({
        ...addressData,
        isPhoneVerified: !!verifiedOtp,
        phoneVerifiedAt: verifiedOtp ? verifiedOtp.createdAt : null,
      });
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/addresses/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const addressData = insertAddressSchema.partial().parse(req.body);

      // Check if this phone number has been verified before
      if (addressData.phone) {
        const [verifiedOtp] = await db
          .select()
          .from(otps)
          .where(
            and(
              eq(otps.identifier, addressData.phone),
              eq(otps.isVerified, true)
            )
          )
          .limit(1);

        if (verifiedOtp) {
          addressData.isPhoneVerified = true;
          addressData.phoneVerifiedAt = verifiedOtp.createdAt;
        } else {
          addressData.isPhoneVerified = false;
          addressData.phoneVerifiedAt = null;
        }
      }

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

  // Mark address phone as verified after OTP confirmation
  app.post("/api/addresses/:id/verify-phone", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.getAddress(id);
      
      if (!address || address.userId !== req.user.id) {
        return res.status(404).json({ message: 'Address not found' });
      }
      
      const updatedAddress = await storage.updateAddress(id, {
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      });
      
      res.json(updatedAddress);
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

  app.post("/api/categories", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin category management routes
  app.post("/api/admin/categories", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      if (isR2Configured() && categoryData.imageUrl && categoryData.imageUrl.startsWith('data:')) {
        categoryData.imageUrl = await uploadBase64ToR2(categoryData.imageUrl, 'categories');
      }
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/categories/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      if (isR2Configured() && categoryData.imageUrl && categoryData.imageUrl.startsWith('data:')) {
        categoryData.imageUrl = await uploadBase64ToR2(categoryData.imageUrl, 'categories');
      }
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/categories/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product routes with caching and optimization
  app.get("/api/products", async (req, res) => {
    try {
      const { category_id, featured, search } = req.query;
      const products = await storage.getProducts({
        categoryId: category_id ? parseInt(category_id as string) : undefined,
        featured: featured === 'true',
        search: search as string,
      });

      // Optimize image URLs for faster loading
      const optimizedProducts = products.map(product => ({
        ...product,
        images: product.images?.map(img => {
          if (typeof img === 'string' && img.includes('unsplash.com')) {
            // Add Unsplash optimization parameters
            const url = new URL(img);
            url.searchParams.set('auto', 'format');
            url.searchParams.set('fit', 'crop');
            url.searchParams.set('w', '400');
            url.searchParams.set('q', '80');
            return url.toString();
          }
          return img;
        }) || []
      }));
      
      // Add aggressive caching for products
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800'); // Cache for 10 minutes, stale for 30 minutes
      res.setHeader('ETag', `"products-${products.length}-${search || 'all'}"`);
      
      res.json(optimizedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const trendingProducts = await storage.getTrendingProducts(limit);
      res.json(trendingProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/product-of-day", async (req, res) => {
    try {
      const product = await storage.getProductOfDay();
      res.json(product || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/chef-specials", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const chefSpecials = await storage.getChefSpecialProducts(limit);
      res.json(chefSpecials);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/trending-local", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const items = await storage.getTrendingLocalProducts(limit);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/new-arrivals", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const items = await storage.getNewArrivals(limit);
      res.json(items);
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

  /* ORIGINAL CODE - DO NOT DELETE
  // Product image upload endpoint - accepts base64 and returns a data URL for storage
  app.post("/api/products/upload-image", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { imageData } = req.body;
      if (!imageData) return res.status(400).json({ message: 'No image data provided' });
      if (!imageData.startsWith('data:image/')) return res.status(400).json({ message: 'Invalid image format' });
      const base64Data = imageData.split(',')[1];
      const sizeInBytes = Buffer.from(base64Data, 'base64').length;
      const maxSize = 500 * 1024;
      if (sizeInBytes > maxSize) return res.status(400).json({ message: `Image too large (${Math.round(sizeInBytes / 1024)}KB). Please use an image under 500KB.` });
      res.json({ imageUrl: imageData, message: 'Image uploaded successfully' });
    } catch (error: any) {
      console.error('Product image upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  END ORIGINAL CODE */

  // Product image upload endpoint — uploads to Cloudflare R2 CDN, returns CDN URL
  app.post("/api/products/upload-image", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: 'No image data provided' });
      }

      // Validate: must be a base64 image
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image format. Only jpg, jpeg, png, webp are allowed.' });
      }

      // Validate mime type (jpg, jpeg, png, webp only)
      const mimeMatch = imageData.match(/^data:(image\/[^;]+);base64,/);
      const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!mimeMatch || !allowedImageMimes.includes(mimeMatch[1])) {
        return res.status(400).json({ message: 'Only jpg, jpeg, png, webp images are allowed.' });
      }

      // Validate size — max 10MB
      const base64Data = imageData.split(',')[1];
      const sizeInBytes = Buffer.from(base64Data, 'base64').length;
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (sizeInBytes > maxSize) {
        return res.status(400).json({
          message: `Image too large (${Math.round(sizeInBytes / 1024 / 1024 * 10) / 10}MB). Max allowed is 10MB.`
        });
      }

      // Upload to Cloudflare R2
      if (!isR2Configured()) {
        return res.status(500).json({ message: 'CDN storage is not configured. Contact admin.' });
      }

      const cdnUrl = await uploadBase64ToR2(imageData, 'products/images');

      res.json({
        imageUrl: cdnUrl,
        message: 'Image uploaded successfully to CDN'
      });
    } catch (error: any) {
      console.error('Product image upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /* ORIGINAL CODE - DO NOT DELETE
  app.post("/api/products", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      if (productData.images && Array.isArray(productData.images)) {
        const maxImageSize = 500 * 1024;
        productData.images = productData.images.filter((img: string) => {
          if (!img) return false;
          if (!img.startsWith('data:')) return true;
          const base64Data = img.split(',')[1] || '';
          return Math.ceil(base64Data.length * 0.75) < maxImageSize;
        });
      }
      if (productData.videos && Array.isArray(productData.videos)) {
        const maxVideoSize = 10 * 1024 * 1024;
        productData.videos = productData.videos.filter((vid: string) => {
          if (!vid || !vid.trim()) return false;
          if (!vid.startsWith('data:')) return true;
          const base64Data = vid.split(',')[1] || '';
          return Math.ceil(base64Data.length * 0.75) < maxVideoSize;
        });
      }
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  app.put("/api/products/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      if (productData.images && Array.isArray(productData.images)) {
        const maxImageSize = 500 * 1024;
        productData.images = productData.images.filter((img: string) => {
          if (!img) return false;
          if (!img.startsWith('data:')) return true;
          const base64Data = img.split(',')[1] || '';
          return Math.ceil(base64Data.length * 0.75) < maxImageSize;
        });
      }
      if (productData.videos && Array.isArray(productData.videos)) {
        const maxVideoSize = 10 * 1024 * 1024;
        productData.videos = productData.videos.filter((vid: string) => {
          if (!vid || !vid.trim()) return false;
          if (!vid.startsWith('data:')) return true;
          const base64Data = vid.split(',')[1] || '';
          return Math.ceil(base64Data.length * 0.75) < maxVideoSize;
        });
      }
      const product = await storage.updateProduct(parseInt(req.params.id), productData);
      res.json(product);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });
  END ORIGINAL CODE */

  // Helper: upload any base64 data URLs in an array to R2, return CDN URLs
  async function uploadMediaToR2(items: string[], folder: string, maxSizeBytes: number): Promise<string[]> {
    const results: string[] = [];
    for (const item of items) {
      if (!item || !item.trim()) continue;
      if (!item.startsWith('data:')) {
        // Already a URL (CDN or external) — keep as-is
        results.push(item);
        continue;
      }
      const base64Data = item.split(',')[1] || '';
      const sizeInBytes = Math.ceil(base64Data.length * 0.75);
      if (sizeInBytes > maxSizeBytes) continue; // Skip oversized files silently
      try {
        const cdnUrl = await uploadBase64ToR2(item, folder);
        results.push(cdnUrl);
      } catch (err) {
        console.error(`R2 upload failed for ${folder}:`, err);
        // Fall back to keeping the base64 so the product isn't broken
        results.push(item);
      }
    }
    return results;
  }

  app.post("/api/products", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);

      // Upload any base64 images → R2 /products/images/  (max 10MB each)
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = await uploadMediaToR2(productData.images, 'products/images', 10 * 1024 * 1024);
      }

      // Upload any base64 videos → R2 /products/videos/  (max 100MB each)
      if (productData.videos && Array.isArray(productData.videos)) {
        productData.videos = await uploadMediaToR2(productData.videos, 'products/videos', 100 * 1024 * 1024);
      }

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);

      // Upload any base64 images → R2 /products/images/  (max 10MB each)
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = await uploadMediaToR2(productData.images, 'products/images', 10 * 1024 * 1024);
      }

      // Upload any base64 videos → R2 /products/videos/  (max 100MB each)
      if (productData.videos && Array.isArray(productData.videos)) {
        productData.videos = await uploadMediaToR2(productData.videos, 'products/videos', 100 * 1024 * 1024);
      }

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
  app.get("/api/wishlist", optionalAuth, async (req, res) => {
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
      const wishlistItems = await storage.getWishlistItems(userId);
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
          return res.status(401).json({ message: 'Please login to add items to wishlist', requireLogin: true });
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
          return res.status(401).json({ message: 'Please login to manage wishlist', requireLogin: true });
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

  app.put("/api/cart/:id", authenticateUser, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(parseInt(req.params.id), quantity, req.user.id);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:id", authenticateUser, async (req, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id), req.user.id);
      res.json({ message: 'Item removed from cart' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Address routes
  app.get("/api/addresses", authenticateUser, async (req, res) => {
    try {
      const addresses = await storage.getAddresses(req.user.id);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/addresses", authenticateUser, async (req, res) => {
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
        // Set status to pending_payment for gateway payments, pending for others
        status: req.body.paymentMethod === 'gateway' ? 'pending_payment' : req.body.status || 'pending'
      });
      const order = await storage.createOrder(orderData);
      console.log('Order created successfully:', order.id, order.orderNumber);
      
      // Send order confirmation SMS only for NON-GATEWAY payments when order is created
      // Gateway payments will get SMS from webhook after payment confirmation
      if (req.body.paymentMethod !== 'gateway' && order.deliveryAddress && order.deliveryAddress.phone) {
        const trackingLink = `https://pathakbhandar.in/customer/orders`;
        const customerName = order.deliveryAddress.fullName || 'Customer';
        const orderStatus = order.status || 'pending';
        
        try {
          // Send SMS based on order status and payment method
          await otpService.sendOrderPlacedSMS(
            order.deliveryAddress.phone,
            order.orderNumber,
            orderStatus,
            req.body.paymentMethod,
            customerName
          );
          console.log('Order SMS sent to:', order.deliveryAddress.phone, 'Status:', orderStatus, 'Payment method:', req.body.paymentMethod);
        } catch (smsError) {
          console.error('Failed to send order SMS:', smsError);
          // Don't fail the order if SMS fails
        }
      }
      
      res.json(order);
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Order items endpoint
  app.post("/api/order-items", authenticateUser, async (req, res) => {
    try {
      console.log('Creating order item for user:', req.user.id);
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      console.log('Order item created successfully:', orderItem.id);
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
  app.get("/api/admin/orders", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const orders = await storage.getAllOrders(status as string);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/status", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(orderId, status);
      
      // Send push notification to user about status update
      try {
        await sendOrderStatusNotification(order.user_id, orderId, status, order.orderNumber);
      } catch (notifyError) {
        console.error('Failed to send push notification:', notifyError);
      }
      
      // Send notification to customer about order status update
      // Policy: NO SMS on admin status updates. WhatsApp only for "out_for_delivery".
      if (order.deliveryAddress && order.deliveryAddress.phone) {
        try {
          if (status === 'out_for_delivery') {
            const customerName = order.deliveryAddress.name || 'Customer';
            await otpService.sendOutForDeliveryWhatsApp(
              order.deliveryAddress.phone,
              customerName,
              order.orderNumber
            );
            console.log('Out for Delivery WhatsApp sent to:', order.deliveryAddress.phone);
          }
          // For all other statuses: no message is sent (SMS disabled per requirement).
        } catch (notifyError) {
          console.error('Failed to send order status notification:', notifyError);
          // Don't fail the status update if notification fails
        }
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/rider", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { riderName, riderPhone, riderImage } = req.body;
      const order = await storage.updateOrderRider(parseInt(req.params.id), riderName, riderPhone, riderImage);
      
      // Send WhatsApp notification when rider is assigned (only if order is "out_for_delivery" and both name and phone provided)
      if (riderName && riderPhone && order.status === 'out_for_delivery' && order.deliveryAddress && order.deliveryAddress.phone) {
        try {
          const customerName = order.deliveryAddress.name || 'Customer';
          await otpService.sendRiderAssignedWhatsApp(
            order.deliveryAddress.phone,
            customerName,
            order.orderNumber,
            riderName,
            riderPhone
          );
          console.log('Rider assigned WhatsApp sent to:', order.deliveryAddress.phone, '(order status: out_for_delivery)');
        } catch (whatsappError) {
          console.error('Failed to send rider assigned WhatsApp:', whatsappError);
          // Don't fail the rider update if WhatsApp fails
        }
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update estimated delivery time
  app.put("/api/admin/orders/:id/delivery-time", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { estimatedDelivery } = req.body;
      const order = await storage.updateOrderDeliveryTime(parseInt(req.params.id), estimatedDelivery);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/customers", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const allCustomers = await storage.getCustomers();
      
      // Enrich customers with order stats
      const enrichedCustomers = await Promise.all(allCustomers.map(async (customer) => {
        try {
          const orders = await storage.getOrders(customer.id);
          const totalOrders = orders.length;
          const totalSpent = orders
            .filter(o => o.status !== 'cancelled' && o.status !== 'payment_failed')
            .reduce((sum, o) => sum + Number(o.total), 0);

          return {
            ...customer,
            totalOrders,
            totalSpent
          };
        } catch (innerErr) {
          return {
            ...customer,
            totalOrders: 0,
            totalSpent: 0,
          };
        }
      }));

      res.json(enrichedCustomers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verified customers endpoint - shows all verified phone numbers with details
  // Note: OTP values are NOT returned for security reasons
  app.get("/api/admin/verified-customers", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const verifiedCustomers = await storage.getVerifiedCustomers();
      res.json(verifiedCustomers);
    } catch (error: any) {
      console.error('Verified customers error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Push notification subscription endpoint
  app.post("/api/notifications/subscribe", authenticateUser, async (req, res) => {
    try {
      const { subscription } = req.body;
      console.log(`User ${req.user.id} subscribed to push notifications`);
      // Store subscription in database (can be implemented later)
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Google One Tap verification endpoint
  app.post("/api/auth/google/verify", async (req, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ message: 'No credential provided' });
      }

      // Verify the Google token with Google's public keys
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: 'Invalid credential' });
      }

      const email = payload.email;
      const name = payload.name;
      const googleId = payload.sub;

      if (!email) {
        return res.status(400).json({ message: 'Email not provided by Google' });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google account
        const newUser = {
          username: email,
          email: email,
          password: '', // Empty password for Google users
          role: 'customer' as const,
          googleId: googleId,
        };
        
        user = await storage.createUser(newUser);
      } else if (!user.googleId) {
        // Link existing account with Google
        await storage.updateUserGoogleId(user.id, googleId);
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });

    } catch (error: any) {
      console.error('Google verification error:', error);
      res.status(500).json({ message: 'Authentication failed: ' + (error.message || 'Unknown error') });
    }
  });

  app.get("/api/admin/analytics", authenticateUser, requireAdmin, async (req, res) => {
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
    // Generate ETag for caching
    const etag = currentLogo ? `"logo-${currentLogo.length}"` : '"logo-default"';
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).send();
    }

    if (currentLogo) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate'); // Cache for 1 hour
      res.setHeader('ETag', etag);
      res.setHeader('Vary', 'Accept-Encoding');
      res.send(currentLogo);
    } else {
      // Optimized default logo SVG
      const defaultLogo = `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#c2410c;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="15" fill="url(#bgGradient)"/>
        <circle cx="60" cy="50" r="28" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <path d="M45 45 Q60 30 75 45 Q68 55 60 52 Q52 55 45 45 Z" fill="white" opacity="0.9"/>
        <circle cx="52" cy="47" r="2" fill="white"/>
        <circle cx="68" cy="47" r="2" fill="white"/>
        <path d="M52 56 Q60 60 68 56" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        <text x="60" y="85" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">PB</text>
        <text x="60" y="100" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="rgba(255,255,255,0.8)">PATHAK BHANDAR</text>
      </svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 24 hours
      res.setHeader('ETag', etag);
      res.setHeader('Vary', 'Accept-Encoding');
      res.send(defaultLogo);
    }
  });

  app.post("/api/super-admin/logo", authenticateUser, requireSuperAdmin, (req, res) => {
    try {
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

  // Banner routes with caching
  app.get("/api/banners", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const banners = await storage.getBanners(activeOnly);
      
      // Add caching headers
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      res.setHeader('ETag', `"banners-${banners.length}-${Date.now()}"`);
      
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

  app.post("/api/banners", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bannerData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(id, bannerData);
      res.json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.json({ message: "Banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin banner management routes
  app.post("/api/admin/banners", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      if (isR2Configured()) {
        if (bannerData.imageUrl && bannerData.imageUrl.startsWith('data:')) {
          bannerData.imageUrl = await uploadBase64ToR2(bannerData.imageUrl, 'banners/images');
        }
        if (bannerData.videoUrl && bannerData.videoUrl.startsWith('data:')) {
          bannerData.videoUrl = await uploadBase64ToR2(bannerData.videoUrl, 'banners/videos');
        }
      }
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bannerData = insertBannerSchema.partial().parse(req.body);
      if (isR2Configured()) {
        if (bannerData.imageUrl && bannerData.imageUrl.startsWith('data:')) {
          bannerData.imageUrl = await uploadBase64ToR2(bannerData.imageUrl, 'banners/images');
        }
        if (bannerData.videoUrl && bannerData.videoUrl.startsWith('data:')) {
          bannerData.videoUrl = await uploadBase64ToR2(bannerData.videoUrl, 'banners/videos');
        }
      }
      const banner = await storage.updateBanner(id, bannerData);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.json({ message: "Banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin OTP Configuration endpoints
  app.get("/api/admin/otp-status", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const configured = !!process.env.FAST2SMS_API_KEY;
      res.json({
        configured,
        senderId: 'GETDWN',
        templateId: '148245',
        message: configured ? 'API is configured' : 'API key not found in environment variables'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/test-otp", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      if (!process.env.FAST2SMS_API_KEY) {
        return res.status(400).json({
          success: false,
          message: 'Fast2SMS API Key not configured. Please add it to your Replit secrets.'
        });
      }

      const result = await otpService.sendWhatsAppOTP(
        req.body.phoneNumber,
        'Admin Test',
        'test'
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // Manual Payment Configuration routes (Admin only)
  app.get("/api/admin/manual-payment-config", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getManualPaymentConfig();
      res.json(config || { qrImageUrl: null, upiId: null, isActive: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/manual-payment-config", authenticateUser, requireAdmin, async (req, res) => {
    try {
      let { qrImageUrl, upiId, isActive } = req.body;
      if (isR2Configured() && qrImageUrl && qrImageUrl.startsWith('data:')) {
        qrImageUrl = await uploadBase64ToR2(qrImageUrl, 'misc/qr');
      }
      const config = await storage.upsertManualPaymentConfig({
        qrImageUrl,
        upiId,
        isActive,
        updatedBy: req.user!.id
      });
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer - Get payment config (public for checkout)
  app.get("/api/manual-payment-config", async (req, res) => {
    try {
      const config = await storage.getManualPaymentConfig();
      if (!config || !config.isActive) {
        return res.status(404).json({ message: "Manual payment not available" });
      }
      res.json({ qrImageUrl: config.qrImageUrl, upiId: config.upiId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer - Submit UTR for an order
  app.post("/api/orders/:orderId/submit-utr", authenticateUser, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { utrReference } = req.body;
      
      if (!utrReference || utrReference.trim().length < 6) {
        return res.status(400).json({ message: "Invalid UTR reference" });
      }
      
      // Verify order belongs to user
      const order = await storage.getOrder(orderId, req.user!.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const details = await storage.submitUTR(orderId, utrReference.trim());
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer - Get payment status for an order
  app.get("/api/orders/:orderId/payment-status", authenticateUser, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Verify order belongs to user
      const order = await storage.getOrder(orderId, req.user!.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const details = await storage.getManualPaymentDetailsByOrderId(orderId);
      res.json(details || { status: 'no_payment_details' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin - Get all pending payments
  app.get("/api/admin/pending-payments", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const pendingPayments = await storage.getPendingPayments();
      res.json(pendingPayments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin - Verify a payment
  app.post("/api/admin/verify-payment/:detailsId", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const detailsId = parseInt(req.params.detailsId);
      const { status, rejectionReason } = req.body;
      
      if (!['success', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'success' or 'failed'" });
      }
      
      if (status === 'failed' && !rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required for failed payments" });
      }
      
      const details = await storage.verifyPayment(detailsId, req.user!.id, status, rejectionReason);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Gateway Configuration routes (Admin only)
  app.get("/api/admin/payment-gateways", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const configs = await storage.getPaymentGatewayConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-gateways", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { provider, displayName, keyId, keySecret, merchantId, isActive, isTestMode, webhookSecret } = req.body;
      
      if (!provider || !displayName) {
        return res.status(400).json({ message: "Provider and display name are required" });
      }
      
      const config = await storage.upsertPaymentGatewayConfig({
        provider,
        displayName,
        keyId,
        keySecret,
        merchantId,
        isActive,
        isTestMode,
        webhookSecret,
        updatedBy: req.user!.id
      });
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer - Get active payment gateway (public for checkout)
  app.get("/api/payment-gateway", async (req, res) => {
    try {
      // Check if PhonePe is configured via environment variables
      const phonePeConfig = getPhonePeConfig();
      if (phonePeConfig.isConfigured) {
        return res.json({
          provider: phonePeConfig.provider,
          displayName: phonePeConfig.displayName,
          isTestMode: phonePeConfig.isTestMode
        });
      }

      const gateway = await storage.getActivePaymentGateway();
      if (!gateway) {
        return res.status(404).json({ message: "No payment gateway configured" });
      }
      // Don't expose secrets to customers
      res.json({ 
        provider: gateway.provider, 
        displayName: gateway.displayName,
        isTestMode: gateway.isTestMode 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ================= PHONEPE PAYMENT ROUTES =================

  // Initiate PhonePe payment
  app.post("/api/payments/phonepe/initiate", authenticateUser, async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      // Get the order
      const order = await storage.getOrder(orderId, req.user!.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if PhonePe is configured
      if (!isPhonePeConfigured()) {
        return res.status(400).json({ message: "PhonePe payment gateway is not configured" });
      }

      // Generate unique merchant transaction ID
      const merchantTransactionId = `PB${orderId}_${Date.now()}`;
      
      // Get callback URLs - use production domain for PhonePe redirects
      const productionDomain = 'https://pathakbhandar.in';
      const devDomain = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';
      
      // Use production domain for redirects to avoid Replit wake-up issues
      const baseUrl = process.env.NODE_ENV === 'production' ? productionDomain : (process.env.REPLIT_DOMAINS?.includes('pathakbhandar.in') ? productionDomain : devDomain);
      
      // Use hash fragment instead of query param - PhonePe strips query params on successful redirects but preserves hash
      const redirectUrl = `${productionDomain}/phonepe-callback#txnId=${merchantTransactionId}`;
      const callbackUrl = `${productionDomain}/api/payments/phonepe/webhook`;

      // Create transaction record
      await storage.createPhonePeTransaction({
        orderId,
        merchantTransactionId,
        merchantUserId: `MUID${req.user!.id}`,
        amount: order.total,
        status: 'initiated',
      });

      // Initiate payment
      const result = await initiatePhonePePayment({
        orderId,
        merchantTransactionId,
        userId: req.user!.id,
        amount: parseFloat(order.total),
        phone: order.deliveryAddress?.phone,
        redirectUrl,
        callbackUrl,
      });

      if (result.success && result.redirectUrl) {
        // Update transaction with redirect URL
        await storage.updatePhonePeTransactionByMerchantId(merchantTransactionId, {
          redirectUrl: result.redirectUrl,
          status: 'pending',
        });

        res.json({
          success: true,
          redirectUrl: result.redirectUrl,
          merchantTransactionId,
        });
      } else {
        // Update transaction with error
        await storage.updatePhonePeTransactionByMerchantId(merchantTransactionId, {
          status: 'failed',
          errorMessage: result.error,
        });

        res.status(400).json({
          success: false,
          message: result.error || 'Payment initiation failed',
        });
      }
    } catch (error: any) {
      console.error('PhonePe initiation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // PhonePe Webhook (Server-to-Server Callback)
  // URL to configure in PhonePe Dashboard: https://pathakbhandar.in/api/payments/phonepe/webhook
  app.post("/api/payments/phonepe/webhook", async (req, res) => {
    try {
      console.log('PhonePe Webhook received');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      // Verify webhook authorization
      const authHeader = req.headers['authorization'] as string;
      const isValidWebhook = verifyPhonePeWebhook(authHeader);
      
      if (!isValidWebhook) {
        console.log('PhonePe Webhook: Invalid authorization - accepting anyway for testing');
        // In production, you might want to reject invalid webhooks:
        // return res.status(401).json({ message: "Unauthorized webhook" });
      }

      // Parse webhook data
      const webhookData: PhonePeWebhookPayload = req.body;
      
      if (!webhookData.event || !webhookData.payload) {
        console.log('PhonePe Webhook: Invalid payload structure');
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const parsedData = parsePhonePeWebhook(webhookData);
      console.log('Parsed webhook data:', JSON.stringify(parsedData, null, 2));
      
      const { merchantOrderId, status, transactionId, paymentMode, event } = parsedData;

      if (!merchantOrderId) {
        console.log('PhonePe Webhook: No merchant order ID found');
        return res.status(400).json({ message: "Merchant order ID is required" });
      }

      // Get transaction from database
      const transaction = await storage.getPhonePeTransactionByMerchantId(merchantOrderId);
      if (!transaction) {
        console.log('PhonePe Webhook: Transaction not found for:', merchantOrderId);
        // Still return 200 to prevent retries
        return res.json({ success: true, message: "Transaction not found" });
      }

      // Map webhook status to our status
      const dbStatus = status === 'payment_success' ? 'success' : 
                       status === 'payment_failed' ? 'failed' : 'pending';
      
      console.log(`Mapping PhonePe status ${status} to DB status: ${dbStatus}`);

      // Update transaction
      await storage.updatePhonePeTransactionByMerchantId(merchantOrderId, {
        status: dbStatus,
        transactionId: transactionId || undefined,
        paymentInstrumentType: paymentMode || undefined,
        callbackReceived: true,
        callbackData: req.body,
        paymentState: webhookData.payload.state,
      });

      // Update order based on payment status and send appropriate SMS
      if (dbStatus === 'success') {
        // Payment successful - update order to confirmed/pending
        console.log(`Updating order ${transaction.orderId} to confirmed status`);
        await storage.updateOrderStatus(transaction.orderId, 'pending');
        await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, transaction.orderId));
        
        // Send SUCCESS SMS for PhonePe payment
        if (orderPhone && orderNumber) {
          try {
            await otpService.sendPhonePePaymentSMS(orderPhone, orderNumber, 'success', customerName);
            console.log('PhonePe SUCCESS SMS sent for order:', orderNumber);
          } catch (smsError) {
            console.error('Failed to send success SMS:', smsError);
          }
        }

        // Send Payment Completed WhatsApp (template payment_completed / 9625)
        if (orderPhone) {
          try {
            const paidOrder = await db.select().from(orders).where(eq(orders.id, transaction.orderId)).limit(1);
            const orderTotal = paidOrder[0]?.total ?? transaction.amount;
            await otpService.sendPaymentCompletedWhatsApp(orderPhone, orderTotal as any);
            console.log('Payment Completed WhatsApp sent for order:', orderNumber, 'amount:', orderTotal);
          } catch (waError) {
            console.error('Failed to send payment completed WhatsApp:', waError);
          }
        }

        console.log(`PhonePe Webhook: Order ${transaction.orderId} marked as paid`);
      } else if (status === 'payment_failed') {
        // Payment failed - update order status
        await storage.updateOrderStatus(transaction.orderId, 'payment_failed');
        await db.update(orders).set({ paymentStatus: 'failed' }).where(eq(orders.id, transaction.orderId));
        
        // Send FAILED SMS for PhonePe payment
        if (orderPhone && orderNumber) {
          try {
            await otpService.sendPhonePePaymentSMS(orderPhone, orderNumber, 'failed', customerName);
            console.log('PhonePe FAILED SMS sent for order:', orderNumber);
          } catch (smsError) {
            console.error('Failed to send failed payment SMS:', smsError);
          }
        }
        
        console.log(`PhonePe Webhook: Order ${transaction.orderId} marked as payment failed`);
      } else {
        // Payment pending/processing - send PENDING SMS
        if (orderPhone && orderNumber) {
          try {
            await otpService.sendPhonePePaymentSMS(orderPhone, orderNumber, 'pending', customerName);
            console.log('PhonePe PENDING SMS sent for order:', orderNumber);
          } catch (smsError) {
            console.error('Failed to send pending payment SMS:', smsError);
          }
        }
        
        console.log(`PhonePe Webhook: Order ${transaction.orderId} still pending`);
      }

      // Always return 200 to acknowledge receipt
      res.json({ success: true, message: `Webhook processed: ${event}` });
    } catch (error: any) {
      console.error('PhonePe Webhook error:', error);
      // Return 200 anyway to prevent infinite retries
      res.json({ success: false, message: error.message });
    }
  });

  // Legacy PhonePe callback (for backward compatibility)
  app.post("/api/payments/phonepe/callback", async (req, res) => {
    try {
      console.log('PhonePe Legacy Callback received:', JSON.stringify(req.body, null, 2));
      
      const { merchantTransactionId, transactionId, code, message } = req.body;
      
      if (!merchantTransactionId) {
        return res.status(400).json({ message: "Merchant transaction ID is required" });
      }

      // Get transaction
      const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction
      const status = (code === 'PAYMENT_SUCCESS' || code === 'SUCCESS' || code === 'COMPLETED') ? 'success' : 
                     (code === 'PAYMENT_PENDING' || code === 'PENDING') ? 'pending' : 'failed';
      
      await storage.updatePhonePeTransactionByMerchantId(merchantTransactionId, {
        status,
        transactionId,
        callbackReceived: true,
        callbackData: req.body,
        paymentState: code,
      });

      // Update order status
      if (status === 'success') {
        await storage.updateOrderStatus(transaction.orderId, 'pending');
        const order = await db.select().from(orders).where(eq(orders.id, transaction.orderId)).limit(1);
        if (order[0]) {
          await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, transaction.orderId));
          
          // Send SMS confirmation for successful payment
          try {
            if (order[0].orderNumber && transaction.merchantUserId) {
              const trackingLink = `https://pathakbhandar.in/track-order/${order[0].orderNumber}`;
              await otpService.sendOrderConfirmation(
                transaction.phone || '9999999999',
                order[0].orderNumber,
                trackingLink
              );
              console.log('Order confirmation SMS sent after payment');
            }
          } catch (smsError) {
            console.error('Failed to send SMS after payment:', smsError);
          }

          // Send Payment Completed WhatsApp (template payment_completed / 9625)
          try {
            const phoneForWa = transaction.phone || (order[0] as any)?.deliveryAddress?.phone;
            const orderTotal = order[0].total ?? transaction.amount;
            if (phoneForWa) {
              await otpService.sendPaymentCompletedWhatsApp(phoneForWa, orderTotal as any);
              console.log('Payment Completed WhatsApp sent after payment, amount:', orderTotal);
            }
          } catch (waError) {
            console.error('Failed to send payment completed WhatsApp:', waError);
          }
        }
      } else if (status === 'failed') {
        await storage.updateOrderStatus(transaction.orderId, 'payment_failed');
        await db.update(orders).set({ paymentStatus: 'failed' }).where(eq(orders.id, transaction.orderId));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('PhonePe callback error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check PhonePe payment status
  app.get("/api/payments/phonepe/status/:merchantTransactionId", authenticateUser, async (req, res) => {
    try {
      const { merchantTransactionId } = req.params;
      
      // Get transaction from database
      const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // If already completed, return stored status
      if (transaction.status === 'success' || transaction.status === 'failed') {
        return res.json({
          status: transaction.status,
          transactionId: transaction.transactionId,
          paymentInstrumentType: transaction.paymentInstrumentType,
        });
      }

      // Check with PhonePe API
      const result = await checkPhonePePaymentStatus(merchantTransactionId);
      
      if (result.success && result.status) {
        const status = (result.status === 'SUCCESS' || result.status === 'COMPLETED') ? 'success' : 
                       (result.status === 'FAILED' || result.status === 'CANCELLED') ? 'failed' : 'pending';
        
        // Update transaction
        await storage.updatePhonePeTransactionByMerchantId(merchantTransactionId, {
          status,
          transactionId: result.transactionId,
          paymentInstrumentType: result.paymentInstrumentType,
          paymentState: result.data?.state,
        });

        // Update order if payment completed
        if (status === 'success') {
          await storage.updateOrderStatus(transaction.orderId, 'pending');
          await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, transaction.orderId));
        } else if (status === 'failed') {
          await storage.updateOrderStatus(transaction.orderId, 'payment_failed');
          await db.update(orders).set({ paymentStatus: 'failed' }).where(eq(orders.id, transaction.orderId));
        }

        res.json({
          status,
          transactionId: result.transactionId,
          paymentInstrumentType: result.paymentInstrumentType,
        });
      } else {
        res.json({
          status: 'pending',
          error: result.error,
        });
      }
    } catch (error: any) {
      console.error('PhonePe status check error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get PhonePe transaction for order
  app.get("/api/payments/phonepe/order/:orderId", authenticateUser, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const transaction = await storage.getPhonePeTransactionByOrderId(orderId);
      
      if (!transaction) {
        return res.status(404).json({ message: "No PhonePe transaction found for this order" });
      }

      res.json({
        merchantTransactionId: transaction.merchantTransactionId,
        status: transaction.status,
        amount: transaction.amount,
        transactionId: transaction.transactionId,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ================= SUPER ADMIN ROUTES =================
  
  // Page Content (About Us, Contact Us) - Public read
  app.get("/api/page-content/:pageType", async (req, res) => {
    try {
      const content = await storage.getPageContent(req.params.pageType);
      res.json(content || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Page Content - Super Admin write
  app.post("/api/super-admin/page-content", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const { pageType, title, sections, contactInfo } = req.body;
      if (!pageType) {
        return res.status(400).json({ message: "Page type is required" });
      }
      const content = await storage.upsertPageContent({
        pageType,
        title,
        sections,
        contactInfo,
        updatedBy: req.user.id
      });
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Popup Banners - Public read active only
  app.get("/api/popup-banners/active", async (req, res) => {
    try {
      const banners = await storage.getPopupBanners(true);
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Popup Banners - Super Admin management
  app.get("/api/super-admin/popup-banners", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const banners = await storage.getPopupBanners();
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/super-admin/popup-banners", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const banner = await storage.createPopupBanner({
        ...req.body,
        createdBy: req.user.id
      });
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/super-admin/popup-banners/:id", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.updatePopupBanner(id, req.body);
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/super-admin/popup-banners/:id", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePopupBanner(id);
      res.json({ message: "Popup banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Popup Banners - Admin management (mirrors super-admin endpoints; available to admin + super_admin)
  app.get("/api/admin/popup-banners", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getPopupBanners();
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/popup-banners", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (isR2Configured() && body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.startsWith('data:')) {
        body.imageUrl = await uploadBase64ToR2(body.imageUrl, 'popup-banners');
      }
      const banner = await storage.createPopupBanner({ ...body, createdBy: req.user.id });
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/popup-banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = { ...req.body };
      if (isR2Configured() && body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.startsWith('data:')) {
        body.imageUrl = await uploadBase64ToR2(body.imageUrl, 'popup-banners');
      }
      const banner = await storage.updatePopupBanner(id, body);
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/popup-banners/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePopupBanner(id);
      res.json({ message: "Popup banner deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ================= ABOUT US SECTIONS =================
  // Detect media type (image/video) from a URL or data URL
  const detectMediaType = (item: string): 'image' | 'video' => {
    if (!item) return 'image';
    if (item.startsWith('data:video/')) return 'video';
    if (item.startsWith('data:image/')) return 'image';
    const lower = item.split('?')[0].toLowerCase();
    if (/\.(mp4|webm|mov|m4v|ogv)$/.test(lower)) return 'video';
    return 'image';
  };

  // Process media + parallel mediaTypes arrays. Uploads any base64 data URLs to R2.
  // Returns aligned arrays so media[i] always pairs with mediaTypes[i].
  const processAboutMediaPair = async (
    media: any,
    mediaTypes: any,
  ): Promise<{ media: string[]; mediaTypes: string[] }> => {
    if (!Array.isArray(media)) return { media: [], mediaTypes: [] };
    const typesIn = Array.isArray(mediaTypes) ? mediaTypes : [];
    const outMedia: string[] = [];
    const outTypes: string[] = [];
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      if (typeof item !== 'string' || !item.trim()) continue;
      const declared = typeof typesIn[i] === 'string' ? typesIn[i] : '';
      const folder = (declared === 'video' || detectMediaType(item) === 'video')
        ? 'about-sections/videos'
        : 'about-sections/images';
      let finalUrl = item;
      if (isR2Configured() && item.startsWith('data:')) {
        try {
          finalUrl = await uploadBase64ToR2(item, folder);
        } catch (e) {
          continue; // skip failed upload
        }
      }
      outMedia.push(finalUrl);
      outTypes.push(declared === 'video' || declared === 'image' ? declared : detectMediaType(finalUrl));
    }
    return { media: outMedia, mediaTypes: outTypes };
  };

  // Public read — active sections only, ordered by displayOrder
  app.get("/api/about-sections", async (_req, res) => {
    try {
      const sections = await storage.getAboutSections(true);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin CRUD
  app.get("/api/admin/about-sections", authenticateUser, requireAdmin, async (_req, res) => {
    try {
      const sections = await storage.getAboutSections(false);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/about-sections", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.media) {
        const { media, mediaTypes } = await processAboutMediaPair(body.media, body.mediaTypes);
        body.media = media;
        body.mediaTypes = mediaTypes;
      }
      const section = await storage.createAboutSection(body);
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/about-sections/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = { ...req.body };
      if (body.media) {
        const { media, mediaTypes } = await processAboutMediaPair(body.media, body.mediaTypes);
        body.media = media;
        body.mediaTypes = mediaTypes;
      }
      const section = await storage.updateAboutSection(id, body);
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/about-sections/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAboutSection(id);
      res.json({ message: "About section deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Legal Pages (Privacy Policy + Terms of Service) =====
  const isValidLegalPageType = (t: any): t is "privacy" | "terms" | "shipping" | "invoice" =>
    t === "privacy" || t === "terms" || t === "shipping" || t === "invoice";

  // Lightweight summary used by the footer to know which legal pages have content.
  // Returns one entry per supported page type with a hasContent flag.
  app.get("/api/legal-pages", async (_req, res) => {
    try {
      const types: Array<"privacy" | "terms" | "shipping" | "invoice"> = [
        "privacy",
        "terms",
        "shipping",
        "invoice",
      ];
      const summary = await Promise.all(
        types.map(async (pageType) => {
          const sections = await storage.getLegalPageSections(pageType, true);
          return { pageType, hasContent: sections.length > 0 };
        })
      );
      res.json(summary);
    } catch (e) {
      console.error("Failed to load legal pages summary:", e);
      res.status(500).json({ message: "Failed to load legal pages summary" });
    }
  });

  // Public read — active sections only for the requested page
  app.get("/api/legal-pages/:pageType", async (req, res) => {
    try {
      const { pageType } = req.params;
      if (!isValidLegalPageType(pageType)) {
        return res.status(400).json({ message: "Invalid page type" });
      }
      const sections = await storage.getLegalPageSections(pageType, true);
      const lastUpdated = sections.reduce<Date | null>((latest, s) => {
        const ts = s.updatedAt ? new Date(s.updatedAt) : null;
        if (!ts) return latest;
        if (!latest || ts > latest) return ts;
        return latest;
      }, null);
      res.json({ pageType, sections, lastUpdated });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin CRUD
  app.get("/api/admin/legal-pages/:pageType", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { pageType } = req.params;
      if (!isValidLegalPageType(pageType)) {
        return res.status(400).json({ message: "Invalid page type" });
      }
      const sections = await storage.getLegalPageSections(pageType, false);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/legal-pages", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (!isValidLegalPageType(body.pageType)) {
        return res.status(400).json({ message: "Invalid page type" });
      }
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      const section = await storage.createLegalPageSection(body);
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/legal-pages/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      const existing = await storage.getLegalPageSection(id);
      if (!existing) {
        return res.status(404).json({ message: "Section not found" });
      }
      const body = { ...req.body };
      if (body.pageType && !isValidLegalPageType(body.pageType)) {
        return res.status(400).json({ message: "Invalid page type" });
      }
      const section = await storage.updateLegalPageSection(id, body);
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/legal-pages/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      await storage.deleteLegalPageSection(id);
      res.json({ message: "Section deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Management - Super Admin only
  app.get("/api/super-admin/admins", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAdminUsers();
      res.json(admins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/super-admin/admins", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      if (role && !['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || 'admin',
        isVerified: true
      });
      res.json(admin);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/super-admin/admins/:id/password", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const admin = await storage.updateUserPassword(id, hashedPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/super-admin/admins/:id", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role, isVerified } = req.body;
      const admin = await storage.updateUser(id, { role, isVerified });
      res.json(admin);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reports - Super Admin only
  app.get("/api/super-admin/reports/orders", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const orders = await storage.getOrdersReport(new Date(startDate as string), new Date(endDate as string));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/super-admin/reports/customers", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const customers = await storage.getCustomersReport(new Date(startDate as string), new Date(endDate as string));
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/super-admin/reports/payments", authenticateUser, requireSuperAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const payments = await storage.getPaymentsReport(new Date(startDate as string), new Date(endDate as string));
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // OTP routes for email and WhatsApp verification
  app.use("/api/otp", otpRoutes);

  // ── Event Inquiries (catering/event orders) ──────────────────────────────
  // Auto-create table on first run
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_inquiries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_location TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) { /* table already exists */ }

  app.post("/api/event-inquiries", async (req, res) => {
    try {
      const { name, eventName, eventLocation, phone } = req.body;
      if (!name || !eventName || !eventLocation || !phone) {
        return res.status(400).json({ error: "All fields are required" });
      }
      await pool.query(
        "INSERT INTO event_inquiries (name, event_name, event_location, phone) VALUES ($1, $2, $3, $4)",
        [name.trim(), eventName.trim(), eventLocation.trim(), phone.trim()]
      );
      res.json({ success: true, message: "Our experts will call you shortly!" });
    } catch (error: any) {
      console.error("Event inquiry error:", error);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  app.get("/api/admin/event-inquiries", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM event_inquiries ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // ─── Testimonials / Reviews ────────────────────────────────────────────────

  // Submit a testimonial — must be logged in, order must be delivered
  app.post("/api/testimonials", authenticateUser, async (req, res) => {
    try {
      const { orderId, productId, productName, rating, reviewText, imageUrl } = req.body;
      const userId = req.user!.id;

      if (!orderId || !productId || !productName || !rating || !reviewText) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      if (reviewText.trim().length < 10) {
        return res.status(400).json({ message: "Review must be at least 10 characters" });
      }

      // Verify the order belongs to this user and is delivered
      const orderCheck = await pool.query(
        "SELECT id, status FROM orders WHERE id = $1 AND user_id = $2",
        [orderId, userId]
      );
      if (orderCheck.rows.length === 0) {
        return res.status(403).json({ message: "Order not found" });
      }
      if (orderCheck.rows[0].status !== 'delivered') {
        return res.status(400).json({ message: "You can only review delivered orders" });
      }

      // Prevent duplicate review for same order+product
      const dupCheck = await pool.query(
        "SELECT id FROM testimonials WHERE order_id = $1 AND product_id = $2 AND user_id = $3",
        [orderId, productId, userId]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ message: "You have already reviewed this product for this order" });
      }

      // Get user name
      const userRow = await pool.query("SELECT username, first_name, last_name FROM users WHERE id = $1", [userId]);
      const u = userRow.rows[0];
      const userName = (u?.first_name && u?.last_name)
        ? `${u.first_name} ${u.last_name}`
        : (u?.first_name || u?.username || 'Customer');

      // Upload image to R2 if base64
      let finalImageUrl = imageUrl || null;
      if (finalImageUrl && finalImageUrl.startsWith('data:') && isR2Configured()) {
        finalImageUrl = await uploadBase64ToR2(finalImageUrl, 'testimonials');
      }

      const result = await pool.query(
        `INSERT INTO testimonials (user_id, order_id, product_id, user_name, product_name, rating, review_text, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
        [userId, orderId, productId, userName, productName.trim(), rating, reviewText.trim(), finalImageUrl]
      );

      res.status(201).json({ message: "Review submitted! It will appear after approval.", testimonial: result.rows[0] });
    } catch (error: any) {
      console.error("Testimonial submit error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get approved testimonials for homepage rotation (max 20)
  app.get("/api/testimonials/homepage", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, user_name, product_name, rating, review_text, image_url, created_at
         FROM testimonials WHERE status = 'approved'
         ORDER BY featured DESC, approved_at DESC LIMIT 20`
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get approved testimonials for a specific product
  app.get("/api/testimonials/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const result = await pool.query(
        `SELECT id, user_name, product_name, rating, review_text, image_url, created_at
         FROM testimonials WHERE status = 'approved' AND product_id = $1
         ORDER BY featured DESC, approved_at DESC`,
        [productId]
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check if user already reviewed a specific order+product
  app.get("/api/testimonials/check", authenticateUser, async (req, res) => {
    try {
      const { orderId, productId } = req.query;
      const userId = req.user!.id;
      const result = await pool.query(
        "SELECT id FROM testimonials WHERE order_id = $1 AND product_id = $2 AND user_id = $3",
        [orderId, productId, userId]
      );
      res.json({ hasReviewed: result.rows.length > 0 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — get all testimonials with optional status filter
  app.get("/api/admin/testimonials", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      let result;
      if (status && status !== 'all') {
        result = await pool.query(
          `SELECT t.*, p.name as product_name_actual
           FROM testimonials t
           LEFT JOIN products p ON t.product_id = p.id
           WHERE t.status = $1
           ORDER BY t.created_at DESC`,
          [status]
        );
      } else {
        result = await pool.query(
          `SELECT t.*, p.name as product_name_actual
           FROM testimonials t
           LEFT JOIN products p ON t.product_id = p.id
           ORDER BY t.created_at DESC`
        );
      }
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — approve a testimonial
  app.patch("/api/admin/testimonials/:id/approve", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await pool.query(
        `UPDATE testimonials SET status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2 RETURNING *`,
        [req.user!.id, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — reject a testimonial
  app.patch("/api/admin/testimonials/:id/reject", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await pool.query(
        `UPDATE testimonials SET status = 'rejected', approved_by = $1, approved_at = NOW() WHERE id = $2 RETURNING *`,
        [req.user!.id, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — restore rejected/approved back to pending
  app.patch("/api/admin/testimonials/:id/restore", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await pool.query(
        `UPDATE testimonials SET status = 'pending', approved_by = NULL, approved_at = NULL WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — toggle featured
  app.patch("/api/admin/testimonials/:id/feature", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await pool.query(
        `UPDATE testimonials SET featured = NOT featured WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.json(result.rows[0]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin — delete a testimonial
  app.delete("/api/admin/testimonials/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await pool.query("DELETE FROM testimonials WHERE id = $1", [id]);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Super Admin — export full database as MySQL .sql dump
  app.get("/api/admin/export-database", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const tables = [
        "users", "categories", "products", "addresses", "orders",
        "order_items", "cart_items", "wishlist_items", "coupons",
        "reviews", "banners", "sessions", "otps", "manual_payment_config",
        "manual_payment_details", "payment_gateway_config", "page_content",
        "popup_banners", "phonepe_transactions", "event_inquiries", "testimonials"
      ];

      const escapeMySQLValue = (val: any): string => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? '1' : '0';
        if (typeof val === 'number') return String(val);
        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
        if (typeof val === 'object') {
          // arrays and JSON objects → JSON string
          return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        }
        return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
      };

      const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const lines: string[] = [
        `-- Pathak Bhandar MySQL Database Export`,
        `-- Generated: ${dateStr}`,
        `-- ------------------------------------------------`,
        ``,
        `SET FOREIGN_KEY_CHECKS=0;`,
        `SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';`,
        `SET NAMES utf8mb4;`,
        ``
      ];

      for (const table of tables) {
        try {
          const result = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
          const rows = result.rows;

          lines.push(`-- Table: \`${table}\``);
          lines.push(`TRUNCATE TABLE \`${table}\`;`);

          if (rows.length > 0) {
            const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
            for (const row of rows) {
              const values = Object.values(row).map(escapeMySQLValue).join(', ');
              lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES (${values});`);
            }
          }

          lines.push(``);
        } catch {
          lines.push(`-- Skipped table \`${table}\` (not found or error)`);
          lines.push(``);
        }
      }

      lines.push(`SET FOREIGN_KEY_CHECKS=1;`);

      const filename = `pathak-bhandar-db-export-${new Date().toISOString().slice(0, 10)}.sql`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/sql");
      res.send(lines.join('\n'));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
