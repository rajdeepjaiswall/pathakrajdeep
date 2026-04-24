import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (customers and admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  password: text("password"),
  profileImageUrl: text("profile_image_url"),
  googleId: text("google_id").unique(),
  authProvider: text("auth_provider").default("local"), // local, google
  role: text("role").notNull().default("customer"), // customer, admin, super_admin
  isVerified: boolean("is_verified").default(false),
  profileCompleted: boolean("profile_completed").default(false),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  area: text("area"),
  city: text("city"),
  state: text("state"),
  pinCode: text("pin_code"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weight: text("weight"),
  category_id: integer("category_id").references(() => categories.id),
  images: jsonb("images").$type<string[]>().default([]),
  videos: jsonb("videos").$type<string[]>().default([]),
  ingredients: jsonb("ingredients").$type<string[]>().default([]),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  hsnCode: text("hsn_code"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("5.00"),
  tags: jsonb("tags").$type<string[]>().default([]),
  featured: boolean("featured").default(false),
  isTrending: boolean("is_trending").default(false),
  isProductOfDay: boolean("is_product_of_day").default(false),
  isChefSpecial: boolean("is_chef_special").default(false),
  isTrendingLocal: boolean("is_trending_local").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Addresses table
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  landmark: text("landmark"),
  isDefault: boolean("is_default").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, getting_ready, packed, dispatched, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // upi, card, cod, wallet
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  deliveryAddress: jsonb("delivery_address").$type<{
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  }>().notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  deliveryDate: timestamp("delivery_date"),
  notes: text("notes"),
  riderName: text("rider_name"),
  riderPhone: text("rider_phone"),
  riderImage: text("rider_image"), // URL or base64 encoded image
  estimatedDelivery: timestamp("estimated_delivery"),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id),
  product_id: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  product_id: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wishlist items table
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  product_id: integer("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  product_id: integer("product_id").references(() => products.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banners table
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  linkUrl: text("link_url"),
  linkType: text("link_type").default("product"), // "product", "category", "external", "offer"
  linkId: integer("link_id"), // Product or category ID if applicable
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  placement: text("placement").default("hero").notNull(), // "hero", "after_featured", "after_trending", "after_zero_products", "after_chef_editorial"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table for express-session
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// OTP table for email and WhatsApp verification
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(), // email or phone number
  otp: text("otp").notNull(),
  type: text("type").notNull(), // "email" or "whatsapp"
  purpose: text("purpose").notNull().default("verification"), // "verification", "password_reset", "login"
  attempts: integer("attempts").default(0),
  isVerified: boolean("is_verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual Payment Configuration (singleton for QR/UPI settings)
export const manualPaymentConfig = pgTable("manual_payment_config", {
  id: serial("id").primaryKey(),
  qrImageUrl: text("qr_image_url"),
  upiId: text("upi_id"),
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual Payment Details (linked to orders for tracking UTR and verification)
export const manualPaymentDetails = pgTable("manual_payment_details", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  utrReference: text("utr_reference"),
  status: text("status").notNull().default("pending"), // pending, success, failed
  submittedAt: timestamp("submitted_at"),
  verifiedByAdminId: integer("verified_by_admin_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Gateway Configuration (for Razorpay, Stripe, PhonePe, etc.)
export const paymentGatewayConfig = pgTable("payment_gateway_config", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // razorpay, stripe, phonepe, paytm
  displayName: text("display_name").notNull(),
  keyId: text("key_id"),
  keySecret: text("key_secret"),
  merchantId: text("merchant_id"),
  isActive: boolean("is_active").default(false),
  isTestMode: boolean("is_test_mode").default(true),
  webhookSecret: text("webhook_secret"),
  additionalConfig: jsonb("additional_config").$type<Record<string, string>>().default({}),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Page Content table for About Us and Contact Us pages
export const pageContent = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageType: text("page_type").notNull(), // about_us, contact_us
  title: text("title"),
  sections: jsonb("sections").$type<{
    id: string;
    type: "heading" | "subheading" | "text" | "image";
    content: string;
    order: number;
  }[]>().default([]),
  contactInfo: jsonb("contact_info").$type<{
    phone?: string;
    email?: string;
    address?: string;
    mapUrl?: string;
    whatsapp?: string;
    businessHours?: string;
    socialLinks?: { platform: string; url: string }[];
  }>(),
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Popup Banners table for dismissible popups
export const popupBanners = pgTable("popup_banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  triggerType: text("trigger_type").notNull().default("login"), // login, page_load, timed
  showOnce: boolean("show_once").default(true),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// About Us dynamic sections
export const aboutSections = pgTable("about_sections", {
  id: serial("id").primaryKey(),
  sectionType: text("section_type").notNull(), // hero, founder, story, gallery, team
  title: text("title"),
  subtitle: text("subtitle"),
  description: text("description"),
  media: text("media").array().default([]),
  mediaTypes: text("media_types").array().default([]),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// PhonePe Transactions table
export const phonePeTransactions = pgTable("phonepe_transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  merchantTransactionId: text("merchant_transaction_id").notNull().unique(),
  merchantUserId: text("merchant_user_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("initiated"), // initiated, pending, success, failed
  paymentState: text("payment_state"), // PhonePe payment state
  transactionId: text("transaction_id"), // PhonePe transaction ID
  paymentInstrumentType: text("payment_instrument_type"), // UPI, CARD, etc.
  redirectUrl: text("redirect_url"),
  callbackReceived: boolean("callback_received").default(false),
  callbackData: jsonb("callback_data").$type<Record<string, any>>(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  reviews: many(reviews),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.user_id],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.product_id],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.user_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.product_id],
    references: [products.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.user_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.product_id],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.user_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.product_id],
    references: [products.id],
  }),
}));

export const manualPaymentDetailsRelations = relations(manualPaymentDetails, ({ one }) => ({
  order: one(orders, {
    fields: [manualPaymentDetails.orderId],
    references: [orders.id],
  }),
  verifiedByAdmin: one(users, {
    fields: [manualPaymentDetails.verifiedByAdminId],
    references: [users.id],
  }),
}));

export const manualPaymentConfigRelations = relations(manualPaymentConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [manualPaymentConfig.updatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  password: z.string().optional(), // Make password optional for Google OAuth users
  username: z.string().optional(), // Make username optional for Google OAuth users
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Google OAuth user schema
export const insertGoogleUserSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  username: true,
  createdAt: true,
  updatedAt: true,
});

// User upsert schema for OAuth
export const upsertUserSchema = insertUserSchema.extend({
  id: z.string().optional(),
});

// User types
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSchema = createInsertSchema(otps).omit({
  id: true,
  createdAt: true,
});



export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});



export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManualPaymentConfigSchema = createInsertSchema(manualPaymentConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManualPaymentDetailsSchema = createInsertSchema(manualPaymentDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentGatewayConfigSchema = createInsertSchema(paymentGatewayConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageContentSchema = createInsertSchema(pageContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPopupBannerSchema = createInsertSchema(popupBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAboutSectionSchema = createInsertSchema(aboutSections).omit({
  id: true,
  createdAt: true,
});

export const insertPhonePeTransactionSchema = createInsertSchema(phonePeTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Event inquiry table — stores catering/event order requests
export const eventInquiries = pgTable("event_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  eventName: text("event_name").notNull(),
  eventLocation: text("event_location").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventInquirySchema = createInsertSchema(eventInquiries).omit({
  id: true,
  createdAt: true,
});

// Testimonials table — customer reviews submitted after delivery
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  userName: text("user_name").notNull(),
  productName: text("product_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  featured: boolean("featured").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  status: true,
  featured: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
});

// Select schemas
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Banner = typeof banners.$inferSelect;

export type Otp = typeof otps.$inferSelect;
export type ManualPaymentConfig = typeof manualPaymentConfig.$inferSelect;
export type ManualPaymentDetails = typeof manualPaymentDetails.$inferSelect;
export type PaymentGatewayConfig = typeof paymentGatewayConfig.$inferSelect;
export type PageContent = typeof pageContent.$inferSelect;
export type PopupBanner = typeof popupBanners.$inferSelect;
export type AboutSection = typeof aboutSections.$inferSelect;
export type PhonePeTransaction = typeof phonePeTransactions.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type InsertManualPaymentConfig = z.infer<typeof insertManualPaymentConfigSchema>;
export type InsertManualPaymentDetails = z.infer<typeof insertManualPaymentDetailsSchema>;
export type InsertPaymentGatewayConfig = z.infer<typeof insertPaymentGatewayConfigSchema>;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type InsertPopupBanner = z.infer<typeof insertPopupBannerSchema>;
export type InsertAboutSection = z.infer<typeof insertAboutSectionSchema>;
export type InsertPhonePeTransaction = z.infer<typeof insertPhonePeTransactionSchema>;
export type EventInquiry = typeof eventInquiries.$inferSelect;
export type InsertEventInquiry = z.infer<typeof insertEventInquirySchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
