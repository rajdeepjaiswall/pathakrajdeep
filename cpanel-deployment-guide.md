# Quick cPanel Deployment Guide

## Raw Setup Instructions

### 1. Database Setup
```sql
-- Create database and user in cPanel PostgreSQL
-- Database: pathak_bhandar_db
-- User: pathak_user  
-- Password: [your-secure-password]

-- Run init-database.sql in your database
```

### 2. Environment Variables (cPanel Node.js App)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://pathak_user:your-password@localhost:5432/pathak_bhandar_db
PGHOST=localhost
PGPORT=5432
PGUSER=pathak_user
PGPASSWORD=your-password
PGDATABASE=pathak_bhandar_db
JWT_SECRET=your-64-char-random-secret
SESSION_SECRET=your-64-char-random-secret
```

### 3. File Upload Steps
1. Upload ZIP to cPanel File Manager
2. Extract to public_html (or subdomain folder)
3. Run: `node setup-cpanel.js` (interactive setup)
4. Run: `npm install`
5. Run: `npm run build`

### 4. cPanel Node.js Configuration
- Application Root: /public_html
- Application URL: yourdomain.com
- Startup File: app.js
- Node.js Version: 18.x or higher
- Application Mode: Production

### 5. Default Admin Credentials
- Admin: pathakji / bhandar123
- Super Admin: rajdeep / web123

### 6. Quick Verification
```bash
node verify-setup.js
```

### 7. Start Application
Click "Start App" in cPanel Node.js interface

## File Structure After Setup
```
/public_html/
├── app.js (cPanel entry point)
├── .env (environment config)
├── .htaccess (web server config)
├── init-database.sql (database schema)
├── verify-setup.js (setup verification)
├── package.json
├── server/
├── client/
├── shared/
└── attached_assets/
```

## Troubleshooting
- Database connection: Check credentials in environment variables
- App won't start: Verify Node.js version and dependencies
- Static files 404: Check .htaccess and build process
- Memory errors: Increase Node.js memory limit in cPanel