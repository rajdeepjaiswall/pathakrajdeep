# Pathak Bhandar - cPanel Deployment Guide

This guide will walk you through deploying your Pathak Bhandar e-commerce platform to a cPanel hosting environment using MySQL database.

## 📋 Prerequisites

Before you begin, ensure you have:
- cPanel hosting account with Node.js support (version 18 or higher)
- SSH access (optional but recommended)
- Your project files downloaded as a ZIP file
- Fast2SMS API key (already configured: FAST2SMS_API_KEY)
- Access to cPanel File Manager, phpMyAdmin, and Setup Node.js App

---

## 🗄️ Part 1: Database Setup (MySQL)

### Step 1.1: Create MySQL Database

1. Log into your **cPanel**
2. Go to **MySQL Databases** section
3. Create a new database:
   - Database name: `pathakbhandar` (cPanel will prefix with your username, e.g., `username_pathakbhandar`)
   - Click **Create Database**

### Step 1.2: Create Database User

1. Scroll to **MySQL Users** section
2. Create a new user:
   - Username: `pathak_admin`
   - Password: Use a strong password (save it securely)
   - Click **Create User**

### Step 1.3: Add User to Database

1. Scroll to **Add User To Database** section
2. Select:
   - User: `pathak_admin`
   - Database: `pathakbhandar`
3. Click **Add**
4. Grant **ALL PRIVILEGES** to the user
5. Click **Make Changes**

### Step 1.4: Note Database Connection Details

Write down these details (you'll need them later):
```
DB_HOST: localhost
DB_USER: username_pathak_admin
DB_PASSWORD: your_password_here
DB_NAME: username_pathakbhandar
DB_PORT: 3306
```

> **Note**: Replace `username` with your actual cPanel username.

---

## 🗂️ Part 2: Create Database Tables

### Step 2.1: Access phpMyAdmin

1. In cPanel, go to **phpMyAdmin**
2. Select your database (`username_pathakbhandar`) from the left sidebar

### Step 2.2: Run SQL Schema

Click on **SQL** tab and run the following SQL commands one by one:

#### 1. Sessions Table
```sql
CREATE TABLE sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  INDEX idx_session_expire (expire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2. Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'customer',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3. Categories Table
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4. Products Table
```sql
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
  isActive BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5. Addresses Table
```sql
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
  isDefault BOOLEAN DEFAULT FALSE,
  isPhoneVerified BOOLEAN DEFAULT FALSE,
  phoneVerifiedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 6. Cart Items Table
```sql
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  quantity INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_cart_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 7. Wishlist Items Table
```sql
CREATE TABLE wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 8. Orders Table
```sql
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
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 9. Order Items Table
```sql
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  price VARCHAR(20) NOT NULL,
  total VARCHAR(20) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 10. Reviews Table
```sql
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  rating INT NOT NULL,
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_reviews_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 11. Banners Table
```sql
CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  link VARCHAR(500),
  isActive BOOLEAN DEFAULT TRUE,
  sortOrder INT DEFAULT 0,
  startDate TIMESTAMP NULL,
  endDate TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 12. OTPs Table (for SMS verification)
```sql
CREATE TABLE otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'verification',
  attempts INT DEFAULT 0,
  isVerified BOOLEAN DEFAULT FALSE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 13. Insert Default Admin User
```sql
INSERT INTO users (username, password, firstName, lastName, role, isActive) 
VALUES ('pathakji', '$2b$10$8QXGzH9yX5Z9h0YrKqY.ZO7pF5H8qJ3F5h0YrKqY.ZO7pF5H8qJ3F', 'Pathak', 'Admin', 'super_admin', TRUE);
```

> **Important**: You'll need to change the password after first login. The default password hash above is for "bhandar123". To create a new password hash, use bcrypt with 10 rounds.

---

## 📁 Part 3: Upload Application Files

### Step 3.1: Prepare Your Files

1. Download all project files as a ZIP file
2. **IMPORTANT**: Before zipping, make sure to:
   - **EXCLUDE** the `node_modules` folder (this will be installed on the server)
   - **EXCLUDE** the `.git` folder
   - **EXCLUDE** any `.env` files (you'll create this on the server)
   - **INCLUDE** all other files (client, server, shared, package.json, etc.)

### Step 3.2: Upload to cPanel

1. Log into **cPanel**
2. Go to **File Manager**
3. Navigate to your home directory (e.g., `/home/username/`)
4. Create a new folder called `pathak-bhandar`
5. Enter the `pathak-bhandar` folder
6. Click **Upload** and upload your ZIP file
7. Wait for upload to complete
8. Right-click the ZIP file and select **Extract**
9. Extract to current directory
10. Delete the ZIP file after extraction

### Step 3.3: Verify File Structure

Your directory structure should look like:
```
/home/username/pathak-bhandar/
├── client/
├── server/
├── shared/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── ... other files
```

---

## ⚙️ Part 4: Configure Node.js Application

### Step 4.1: Create Node.js App

1. In cPanel, go to **Setup Node.js App**
2. Click **Create Application**
3. Fill in the following:
   - **Node.js version**: Select **18** or higher
   - **Application mode**: **Production**
   - **Application root**: `pathak-bhandar`
   - **Application URL**: Select your domain (e.g., `pathakbhandar.in` or subdomain)
   - **Application startup file**: `server/index.ts`
   - **Passenger log file**: Leave default or set to `/home/username/pathak-bhandar/logs/app.log`
4. Click **CREATE**

### Step 4.2: Add Environment Variables

In the same **Setup Node.js App** page, scroll to **Environment Variables** section and add:

```
NODE_ENV = production
DATABASE_URL = mysql://username_pathak_admin:your_password@localhost:3306/username_pathakbhandar
FAST2SMS_API_KEY = your_fast2sms_api_key_here
SESSION_SECRET = your_random_secret_key_here_min_32_chars
```

**Important**:
- Replace `username` with your cPanel username
- Replace `your_password` with your database password
- Replace `your_fast2sms_api_key_here` with your actual Fast2SMS API key
- For `SESSION_SECRET`, generate a random string (at least 32 characters). You can use: `openssl rand -base64 32`

### Step 4.3: Stop the Application (Temporarily)

Click **Stop App** button (we need to install dependencies first)

---

## 📦 Part 5: Install Dependencies

### Option A: Using cPanel Interface (Recommended)

1. In **Setup Node.js App**, find your application
2. Click the **pencil icon** (Edit) if not already editing
3. Click **Run NPM Install** button
4. Wait for installation to complete (this may take 5-10 minutes)

### Option B: Using SSH Terminal

1. Open **Terminal** in cPanel (under Advanced section)
2. Copy the "source" command from your app settings (it looks like):
   ```bash
   source /home/username/nodevenv/pathak-bhandar/18/bin/activate && cd /home/username/pathak-bhandar
   ```
3. Paste and run the command
4. Install dependencies:
   ```bash
   npm install
   ```

---

## 🔧 Part 6: Update Database Configuration

### Step 6.1: Modify server/db.ts

Using cPanel File Manager:

1. Navigate to `/home/username/pathak-bhandar/server/`
2. Right-click `db.ts` and select **Edit**
3. Replace the entire content with:

```typescript
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schemaMysql from "@shared/schema-mysql";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = createPool(process.env.DATABASE_URL);
export const db = drizzle(pool, { schema: schemaMysql, mode: 'default' });
```

4. Click **Save Changes**

### Step 6.2: Verify mysql2 Package

Make sure `mysql2` is installed. If not, add it:

1. Go back to **Terminal** in cPanel
2. Enter the virtual environment:
   ```bash
   source /home/username/nodevenv/pathak-bhandar/18/bin/activate && cd /home/username/pathak-bhandar
   ```
3. Install mysql2:
   ```bash
   npm install mysql2
   ```

---

## 🚀 Part 7: Start Your Application

### Step 7.1: Start the App

1. Go back to **Setup Node.js App** in cPanel
2. Click **Start** or **Restart** button
3. Wait for the status to show **Running**

### Step 7.2: Test Your Application

1. Click the **Open** button next to your app URL
2. Or visit your domain directly in a browser
3. You should see the Pathak Bhandar homepage

### Step 7.3: Test Admin Login

1. Go to `/login` on your website
2. Login with:
   - Username: `pathakji`
   - Password: `bhandar123`
3. You should be redirected to the admin dashboard
4. **IMPORTANT**: Change the password immediately from the admin panel

---

## 🔒 Part 8: Security & SSL Setup

### Step 8.1: Enable SSL Certificate

1. In cPanel, go to **SSL/TLS Status**
2. Select your domain
3. Click **Run AutoSSL** to get a free Let's Encrypt certificate
4. Wait for installation to complete

### Step 8.2: Force HTTPS

1. In cPanel File Manager, navigate to `/home/username/pathak-bhandar/`
2. Create/edit `.htaccess` file
3. Add:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🐛 Part 9: Troubleshooting

### Issue: Application Not Starting

**Solution:**
1. Check **Passenger log file** for errors
2. Verify all environment variables are set correctly
3. Make sure `node_modules` are installed
4. Check Node.js version matches (18 or higher)

### Issue: Database Connection Failed

**Solution:**
1. Verify DATABASE_URL format:
   ```
   mysql://username_dbuser:password@localhost:3306/username_dbname
   ```
2. Check if database user has ALL PRIVILEGES
3. Test connection in phpMyAdmin

### Issue: npm install fails

**Solution:**
1. Try using Node.js version 16 instead of 18
2. Increase memory limit (contact hosting provider)
3. Install packages one by one to identify problematic package

### Issue: 404 Errors on Routes

**Solution:**
1. Make sure `.htaccess` includes:
   ```apache
   PassengerAppRoot /home/username/pathak-bhandar
   PassengerStartupFile server/index.ts
   PassengerAppType node
   PassengerNodejs /home/username/nodevenv/pathak-bhandar/18/bin/node
   ```

### Issue: OTP SMS Not Sending

**Solution:**
1. Verify `FAST2SMS_API_KEY` is set in environment variables
2. Check Fast2SMS account balance
3. Verify DLT template is approved (Template ID: 148245)
4. Check logs for API errors

### Issue: Images Not Loading

**Solution:**
1. Make sure image URLs in database are accessible
2. Check CORS settings if images are from external sources
3. Verify image paths are correct

---

## 📊 Part 10: Monitoring & Maintenance

### Check Application Status

1. Go to **Setup Node.js App** in cPanel
2. View status and resource usage
3. Check **Passenger log file** for errors

### Restart Application After Updates

Whenever you update code:
1. Go to **Setup Node.js App**
2. Click **Restart** button
3. Clear browser cache
4. Test the changes

### Database Backup

1. Go to **phpMyAdmin**
2. Select your database
3. Click **Export**
4. Select **Quick** export method
5. Click **Go** to download backup

### View Logs

Application logs location:
- Passenger logs: As configured in app settings
- Error logs: `/home/username/pathak-bhandar/logs/`
- Access cPanel **Errors** section for server logs

---

## ✅ Deployment Checklist

- [ ] MySQL database created
- [ ] Database user created with all privileges
- [ ] All database tables created via phpMyAdmin
- [ ] Default admin user inserted
- [ ] Project files uploaded (without node_modules)
- [ ] Node.js app created in cPanel
- [ ] Environment variables configured
- [ ] Dependencies installed (npm install)
- [ ] server/db.ts updated for MySQL
- [ ] Application started successfully
- [ ] Can access website homepage
- [ ] Can login to admin panel
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled
- [ ] SMS OTP feature tested
- [ ] Database backup created

---

## 📞 Support & Resources

### Important Notes

- Your app runs on the port assigned by Passenger (don't specify ports in code)
- Always restart the app after code changes
- Use environment variables for sensitive data
- Keep database backups regularly
- Monitor error logs frequently

### Fast2SMS Configuration

- **API Key**: Stored in FAST2SMS_API_KEY environment variable
- **Template ID**: 148245
- **Sender ID**: GETDWN
- **Route**: dlt
- **Format**: `CustomerName|OTP|`

### File Paths Reference

- App root: `/home/username/pathak-bhandar/`
- Node environment: `/home/username/nodevenv/pathak-bhandar/18/`
- Logs: `/home/username/pathak-bhandar/logs/`

---

## 🎉 Congratulations!

Your Pathak Bhandar e-commerce platform is now live on cPanel! 

Access your site at: `https://yourdomain.com`
Admin panel at: `https://yourdomain.com/login`

For questions or issues, refer to the troubleshooting section or check cPanel error logs.
