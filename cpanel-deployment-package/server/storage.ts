import { 
  users, categories, products, addresses, orders, orderItems, cartItems, wishlistItems, coupons, reviews, banners,
  type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct,
  type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem, type Coupon, type InsertCoupon, type Review, type InsertReview,
  type Banner, type InsertBanner
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getCustomers(): Promise<User[]>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Product methods
  getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: number, stock: number): Promise<Product>;

  // Cart methods
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem>;
  removeFromCart(id: number, userId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(productId: number, userId: number): Promise<void>;
  isInWishlist(userId: number, productId: number): Promise<boolean>;

  // Address methods
  getAddresses(userId: number): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, address: Partial<InsertAddress>): Promise<Address>;

  // Order methods
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderRider(id: number, riderName: string, riderPhone: string): Promise<Order>;
  getAllOrders(status?: string): Promise<Order[]>;

  // Review methods
  getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Analytics methods
  getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }>;

  // Banner methods
  getBanners(activeOnly?: boolean): Promise<Banner[]>;
  getBanner(id: number): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCustomers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'customer'));
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updateCategory)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product methods
  async getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));

    if (filters?.categoryId) {
      query = query.where(eq(products.category_id, filters.categoryId));
    }

    if (filters?.featured) {
      query = query.where(eq(products.featured, true));
    }

    if (filters?.search) {
      query = query.where(like(products.name, `%${filters.search}%`));
    }

    return await query.orderBy(desc(products.featured), asc(products.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: number, stock: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ stock })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        user_id: cartItems.user_id,
        product_id: cartItems.product_id,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.product_id, products.id))
      .where(eq(cartItems.user_id, userId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.user_id, insertCartItem.user_id),
        eq(cartItems.product_id, insertCartItem.product_id)
      ));

    if (existingItem) {
      // Update quantity
      const [cartItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertCartItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return cartItem;
    }

    const [cartItem] = await db
      .insert(cartItems)
      .values(insertCartItem)
      .returning();
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem> {
    const [cartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)))
      .returning();
    return cartItem;
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)));
  }

  async clearCart(userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.user_id, userId));
  }

  // Wishlist methods
  async getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    return await db
      .select({
        id: wishlistItems.id,
        user_id: wishlistItems.user_id,
        product_id: wishlistItems.product_id,
        createdAt: wishlistItems.createdAt,
        product: products
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.product_id, products.id))
      .where(eq(wishlistItems.user_id, userId));
  }

  async addToWishlist(insertWishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.user_id, insertWishlistItem.user_id),
        eq(wishlistItems.product_id, insertWishlistItem.product_id)
      ));

    if (existingItem) {
      throw new Error('Product already in wishlist');
    }

    const [wishlistItem] = await db
      .insert(wishlistItems)
      .values(insertWishlistItem)
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(productId: number, userId: number): Promise<void> {
    await db
      .delete(wishlistItems)
      .where(and(
        eq(wishlistItems.product_id, productId), 
        eq(wishlistItems.user_id, userId)
      ));
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.user_id, userId),
        eq(wishlistItems.product_id, productId)
      ));
    return !!item;
  }

  // Address methods
  async getAddresses(userId: number): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.user_id, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async getAddress(id: number): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address || undefined;
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    // If this is default address, unset other defaults
    if (insertAddress.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.user_id, insertAddress.user_id));
    }

    const [address] = await db
      .insert(addresses)
      .values(insertAddress)
      .returning();
    return address;
  }

  async updateAddress(id: number, updateAddress: Partial<InsertAddress>): Promise<Address> {
    const [address] = await db
      .update(addresses)
      .set(updateAddress)
      .where(eq(addresses.id, id))
      .returning();
    return address;
  }

  // Order methods
  async getOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.orderDate));
  }

  async getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)));

    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        order_id: orderItems.order_id,
        product_id: orderItems.product_id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        product: products
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .where(eq(orderItems.order_id, id));

    return { ...order, orderItems: items };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderRider(id: number, riderName: string, riderPhone: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ riderName, riderPhone })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (status) {
      query = query.where(eq(orders.status, status));
    }

    return await query.orderBy(desc(orders.orderDate));
  }

  // Review methods
  async getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]> {
    return await db
      .select({
        id: reviews.id,
        user_id: reviews.user_id,
        product_id: reviews.product_id,
        rating: reviews.rating,
        comment: reviews.comment,
        isApproved: reviews.isApproved,
        createdAt: reviews.createdAt,
        user: {
          username: users.username
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.user_id, users.id))
      .where(and(eq(reviews.product_id, productId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  // Analytics methods
  async getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }> {
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)::float`
      })
      .from(orders);

    const [customerStats] = await db
      .select({
        totalCustomers: sql<number>`count(*)::int`
      })
      .from(users)
      .where(eq(users.role, 'customer'));

    const [productStats] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`
      })
      .from(products)
      .where(eq(products.isActive, true));

    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.orderDate))
      .limit(10);

    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        weight: products.weight,
        category_id: products.category_id,
        images: products.images,
        stock: products.stock,
        isActive: products.isActive,
        hsnCode: products.hsnCode,
        gstRate: products.gstRate,
        tags: products.tags,
        featured: products.featured,
        createdAt: products.createdAt,
        orderCount: sql<number>`count(${orderItems.id})::int`
      })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.product_id))
      .groupBy(products.id)
      .orderBy(desc(sql`count(${orderItems.id})`))
      .limit(5);

    return {
      totalOrders: orderStats?.totalOrders || 0,
      totalRevenue: orderStats?.totalRevenue || 0,
      totalCustomers: customerStats?.totalCustomers || 0,
      totalProducts: productStats?.totalProducts || 0,
      recentOrders,
      topProducts
    };
  }

  // Banner methods
  async getBanners(activeOnly = false): Promise<Banner[]> {
    let query = db.select().from(banners);
    
    if (activeOnly) {
      query = query.where(eq(banners.isActive, true));
    }
    
    return await query.orderBy(asc(banners.displayOrder), desc(banners.createdAt));
  }

  async getBanner(id: number): Promise<Banner | undefined> {
    const [banner] = await db.select().from(banners).where(eq(banners.id, id));
    return banner || undefined;
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const [banner] = await db
      .insert(banners)
      .values(insertBanner)
      .returning();
    return banner;
  }

  async updateBanner(id: number, updateBanner: Partial<InsertBanner>): Promise<Banner> {
    const [banner] = await db
      .update(banners)
      .set({ ...updateBanner, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }
}

export const storage = new DatabaseStorage();
