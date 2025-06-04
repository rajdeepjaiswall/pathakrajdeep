import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertProductSchema, insertCategorySchema, insertOrderSchema, insertCartItemSchema, insertAddressSchema, insertReviewSchema, insertBannerSchema } from "@shared/schema";

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

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Profile management routes
  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const { username, email, phone } = req.body;
      const userId = req.user.id;
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        phone,
      });
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address_line_1: updatedUser.address_line_1,
        address_line_2: updatedUser.address_line_2,
        area: updatedUser.area,
        city: updatedUser.city,
        state: updatedUser.state,
        pin_code: updatedUser.pin_code,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/auth/address", authenticateToken, async (req, res) => {
    try {
      const { address_line_1, address_line_2, area, city, state, pin_code } = req.body;
      const userId = req.user.id;
      
      const updatedUser = await storage.updateUser(userId, {
        address_line_1,
        address_line_2,
        area,
        city,
        state,
        pin_code,
      });
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address_line_1: updatedUser.address_line_1,
        address_line_2: updatedUser.address_line_2,
        area: updatedUser.area,
        city: updatedUser.city,
        state: updatedUser.state,
        pin_code: updatedUser.pin_code,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
  app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user.id);
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

  app.post("/api/cart", authenticateToken, async (req, res) => {
    try {
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
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders(req.user.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id), req.user.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        user_id: req.user.id,
        orderNumber: `PB${Date.now()}`,
      });
      const order = await storage.createOrder(orderData);
      res.json(order);
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

  const httpServer = createServer(app);
  return httpServer;
}
