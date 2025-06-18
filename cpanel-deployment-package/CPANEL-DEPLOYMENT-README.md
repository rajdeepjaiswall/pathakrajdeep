# Pathak Bhandar cPanel Deployment Guide

## Quick Start

Your application is now optimized for cPanel hosting with MySQL database support.

## Files to Download and Upload

### Required Files for cPanel:
1. **app.js** - Main entry point for cPanel
2. **package-cpanel.json** - Rename to `package.json` on server
3. **.env.cpanel** - Rename to `.env` and configure with your details
4. **mysql-database-setup.sql** - Import into your MySQL database
5. **All server/ folder contents** - Upload entire server directory
6. **All client/ folder contents** - Upload entire client directory  
7. **All shared/ folder contents** - Upload entire shared directory
8. **attached_assets/ folder** - Upload for logo and images
9. **node_modules/** - Upload or run `npm install` on server

### Configuration Files:
- **drizzle-cpanel.config.ts** - Database migration config
- **tailwind.config.ts** - Styling configuration
- **tsconfig.json** - TypeScript settings
- **postcss.config.js** - CSS processing

## Setup Steps

### 1. Database Setup
1. Login to your cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `pathak_bhandar_db`)
4. Create a MySQL user and assign to the database
5. Import `mysql-database-setup.sql` using phpMyAdmin

### 2. Environment Configuration
1. Rename `.env.cpanel` to `.env`
2. Update these values:
```env
DATABASE_URL=mysql://your_mysql_user:your_password@localhost:3306/your_database_name
SESSION_SECRET=generate-a-secure-32-character-random-string
JWT_SECRET=generate-another-secure-32-character-random-string
```

### 3. File Upload
1. Upload all files to your cPanel public_html directory
2. Rename `package-cpanel.json` to `package.json`
3. Install dependencies: `npm install` (if Node.js is available)

### 4. Start Application
The application will start automatically via `app.js` when accessed through your domain.

## Key Differences from Development

### Database:
- **Development**: Uses Neon PostgreSQL cloud database
- **Production**: Uses local MySQL database on cPanel server

### Entry Point:
- **Development**: `npm run dev` starts with TypeScript
- **Production**: `app.js` serves as the main entry point

### Environment:
- **Development**: Uses `.env` with Neon connection
- **Production**: Uses `.env` with MySQL connection

## Testing Your Deployment

1. Access your domain in a browser
2. Check if the homepage loads correctly
3. Test user registration and login
4. Verify product browsing works
5. Test adding items to cart

## Troubleshooting

### Database Connection Issues:
- Verify MySQL credentials in `.env`
- Ensure database was imported correctly
- Check if MySQL user has proper permissions

### File Permission Issues:
- Set proper permissions on uploaded files
- Ensure `app.js` is executable

### Module Not Found Errors:
- Run `npm install` on the server
- Check if all required files were uploaded

## Support

If you encounter issues:
1. Check cPanel error logs
2. Verify all environment variables are set correctly
3. Ensure MySQL database is properly configured
4. Contact your hosting provider for Node.js support

---

**Note**: This deployment package uses MySQL instead of PostgreSQL for compatibility with most cPanel hosting providers.