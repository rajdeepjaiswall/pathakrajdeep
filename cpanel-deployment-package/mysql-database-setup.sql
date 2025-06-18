-- Pathak Bhandar E-Commerce Database Schema for MySQL
-- Use this script if your hosting provider uses MySQL instead of PostgreSQL

-- Create database (run this first if needed)
-- CREATE DATABASE pathak_bhandar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE pathak_bhandar_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table (using JSON for arrays in MySQL)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price VARCHAR(20) NOT NULL,
    weight VARCHAR(50),
    category_id INT,
    images JSON,
    videos JSON,
    stock INT DEFAULT 0,
    isActive BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Addresses table
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    addressLine1 TEXT NOT NULL,
    addressLine2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark TEXT,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Cart items table
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Wishlist items table
CREATE TABLE wishlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Orders table (using JSON for delivery address)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    orderNumber VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subtotal VARCHAR(20) NOT NULL,
    gstAmount VARCHAR(20) DEFAULT '0',
    deliveryCharge VARCHAR(20) DEFAULT '0',
    total VARCHAR(20) NOT NULL,
    paymentMethod VARCHAR(50) NOT NULL,
    paymentStatus VARCHAR(50) DEFAULT 'pending',
    deliveryAddress JSON NOT NULL,
    notes TEXT,
    rider_name TEXT,
    rider_phone TEXT,
    estimatedDelivery TIMESTAMP NULL,
    deliveryDate TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price VARCHAR(20) NOT NULL,
    total VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Reviews table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Banners table
CREATE TABLE banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    link VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    sortOrder INT DEFAULT 0,
    startDate TIMESTAMP NULL,
    endDate TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table (for authentication)
CREATE TABLE sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create performance indexes
CREATE INDEX idx_session_expire ON sessions (expire);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- Insert default admin users (password: bhandar123 for pathakji, web123 for rajdeep)
INSERT INTO users (username, password, firstName, lastName, email, role) VALUES 
('pathakji', '$2b$10$YNlGWNtjvqKrKjxqKxOHauFh.7b6NOH1qZJb4FLqcz/IQ7RLZPh6K', 'Pathak', 'Ji', 'admin@pathakbhandar.com', 'admin'),
('rajdeep', '$2b$10$YNlGWNtjvqKrKjxqKxOHauFh.7b6NOH1qZJb4FLqcz/IQ7RLZPh6K', 'Rajdeep', 'Admin', 'rajdeep@pathakbhandar.com', 'super_admin');

-- Insert sample categories
INSERT INTO categories (name, description, image) VALUES 
('Biscuits', 'Traditional and premium biscuits', '/api/logo'),
('Cakes', 'Fresh cakes and pastries', '/api/logo'),
('Sweets', 'Traditional Indian sweets', '/api/logo'),
('Namkeen', 'Savory snacks and namkeen', '/api/logo');

-- Insert sample products (using JSON for images array)
INSERT INTO products (name, description, price, weight, category_id, images, featured, stock) VALUES 
('Chocolate Cookies', 'Premium chocolate chip cookies', '120.00', '250g', 1, JSON_ARRAY('/api/logo'), true, 50),
('Vanilla Cake', 'Fresh vanilla sponge cake', '450.00', '500g', 2, JSON_ARRAY('/api/logo'), true, 20),
('Gulab Jamun', 'Traditional gulab jamun', '180.00', '500g', 3, JSON_ARRAY('/api/logo'), false, 30),
('Mix Namkeen', 'Assorted savory snacks', '95.00', '200g', 4, JSON_ARRAY('/api/logo'), false, 40);

-- Insert sample banner
INSERT INTO banners (title, description, image, isActive) VALUES 
('Premium Bakery Collection', 'Discover our premium range of baked goods', '/api/logo', true);

-- Verify installation
SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as banner_count FROM banners;