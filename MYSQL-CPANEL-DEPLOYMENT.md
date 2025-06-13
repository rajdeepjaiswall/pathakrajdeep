# Pathak Bhandar - MySQL cPanel Deployment Guide

## Quick Setup for MySQL Hosting

Most shared hosting providers use MySQL instead of PostgreSQL. Use this guide if your cPanel shows "MySQL Databases" instead of "PostgreSQL Databases".

## Step 1: Create MySQL Database

### 1.1 Access MySQL Databases
1. Login to cPanel
2. Go to **Databases** → **MySQL Databases**
3. Create database: `pathak_bhandar_db`
4. Create user: `pathak_user` with strong password
5. Add user to database with **ALL PRIVILEGES**

### 1.2 Get Database Connection Details
Note these for environment setup:
- Host: `localhost` (usually)
- Port: `3306` (default MySQL port)
- Database: `pathak_bhandar_db`
- Username: `pathak_user`
- Password: [your chosen password]

## Step 2: Run MySQL Database Script

### 2.1 Access phpMyAdmin
1. In cPanel, open **phpMyAdmin**
2. Select your database: `pathak_bhandar_db`
3. Go to **SQL** tab

### 2.2 Execute the MySQL Script
Copy and paste this entire script:

```sql
-- Pathak Bhandar E-Commerce Database Schema for MySQL

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

-- Products table
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

-- Orders table
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

-- Sessions table
CREATE TABLE sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create indexes
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

-- Insert admin users (password: bhandar123 for pathakji, web123 for rajdeep)
INSERT INTO users (username, password, firstName, lastName, email, role) VALUES 
('pathakji', '$2b$10$YNlGWNtjvqKrKjxqKxOHauFh.7b6NOH1qZJb4FLqcz/IQ7RLZPh6K', 'Pathak', 'Ji', 'admin@pathakbhandar.com', 'admin'),
('rajdeep', '$2b$10$YNlGWNtjvqKrKjxqKxOHauFh.7b6NOH1qZJb4FLqcz/IQ7RLZPh6K', 'Rajdeep', 'Admin', 'rajdeep@pathakbhandar.com', 'super_admin');

-- Insert categories
INSERT INTO categories (name, description, image) VALUES 
('Biscuits', 'Traditional and premium biscuits', '/api/logo'),
('Cakes', 'Fresh cakes and pastries', '/api/logo'),
('Sweets', 'Traditional Indian sweets', '/api/logo'),
('Namkeen', 'Savory snacks and namkeen', '/api/logo');

-- Insert products
INSERT INTO products (name, description, price, weight, category_id, images, featured, stock) VALUES 
('Chocolate Cookies', 'Premium chocolate chip cookies', '120.00', '250g', 1, JSON_ARRAY('/api/logo'), true, 50),
('Vanilla Cake', 'Fresh vanilla sponge cake', '450.00', '500g', 2, JSON_ARRAY('/api/logo'), true, 20),
('Gulab Jamun', 'Traditional gulab jamun', '180.00', '500g', 3, JSON_ARRAY('/api/logo'), false, 30),
('Mix Namkeen', 'Assorted savory snacks', '95.00', '200g', 4, JSON_ARRAY('/api/logo'), false, 40);

-- Insert banner
INSERT INTO banners (title, description, image, isActive) VALUES 
('Premium Bakery Collection', 'Discover our premium range of baked goods', '/api/logo', true);
```

Click **Go** to execute the script.

## Step 3: Upload Project Files

### 3.1 File Upload
1. Upload project ZIP to cPanel File Manager
2. Extract to `public_html` or your domain folder
3. Ensure all files are extracted properly

## Step 4: Configure Environment Variables

### 4.1 MySQL Connection String
For MySQL, your DATABASE_URL format is:
```
mysql://username:password@localhost:3306/database_name
```

Example:
```
mysql://pathak_user:your_password@localhost:3306/pathak_bhandar_db
```

### 4.2 Complete Environment Variables
Add these to your cPanel Node.js app:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://pathak_user:your_password@localhost:3306/pathak_bhandar_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=pathak_user
DB_PASSWORD=your_password
DB_DATABASE=pathak_bhandar_db
JWT_SECRET=your-64-character-random-secret
SESSION_SECRET=your-64-character-random-secret
```

## Step 5: Node.js Application Setup

### 5.1 Configure Node.js App
- Application Root: /public_html (or your domain path)
- Startup File: `app.js`
- Node.js Version: 18.x or higher
- Application Mode: Production

### 5.2 Install Dependencies
```bash
npm install
npm run build
```

## Step 6: Start Application

1. Click **Start** in cPanel Node.js interface
2. Monitor logs for any errors
3. Visit your domain to test

## Default Login Credentials

- **Admin**: pathakji / bhandar123
- **Super Admin**: rajdeep / web123

## Verification Steps

1. **Homepage loads** - Check if site displays correctly
2. **User registration** - Test customer signup
3. **Product browsing** - Verify products display
4. **Admin login** - Access admin panel
5. **Order placement** - Test complete checkout flow

## Common MySQL-Specific Issues

### Foreign Key Constraints
If you get foreign key errors, disable checks temporarily:
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Run your problematic query
SET FOREIGN_KEY_CHECKS = 1;
```

### JSON Column Support
Ensure your MySQL version is 5.7+ for JSON support. If older:
```sql
-- Replace JSON columns with TEXT
ALTER TABLE products MODIFY images TEXT;
ALTER TABLE products MODIFY videos TEXT;
```

### Character Encoding
If you see encoding issues, set proper charset:
```sql
ALTER DATABASE pathak_bhandar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Performance Optimization

### Enable Query Cache
In MySQL configuration (if accessible):
```sql
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 1048576;
```

### Optimize Tables
Run after initial setup:
```sql
OPTIMIZE TABLE users, products, orders, cart_items;
```

## Backup Strategy

### Database Backup
```bash
mysqldump -u pathak_user -p pathak_bhandar_db > backup.sql
```

### Restore Backup
```bash
mysql -u pathak_user -p pathak_bhandar_db < backup.sql
```

## Security Considerations

### Update Default Passwords
After deployment, change admin passwords:
1. Login as pathakji
2. Go to profile settings
3. Update password

### Database Security
- Use strong database passwords
- Limit database user privileges
- Regular backups
- Monitor access logs

## Support

If you encounter MySQL-specific issues:
1. Check MySQL version compatibility
2. Verify JSON column support
3. Review foreign key constraints
4. Check character encoding settings
5. Monitor database error logs in cPanel