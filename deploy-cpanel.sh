#!/bin/bash

# Pathak Bhandar cPanel Deployment Script
# Run this script after uploading files to cPanel

set -e

echo "🍪 Pathak Bhandar E-Commerce Platform - cPanel Deployment"
echo "=========================================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "📋 Setting up Node.js environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Create production environment file template
echo "📄 Creating environment template..."
cat > .env.template << 'EOF'
# Pathak Bhandar Environment Configuration
# Copy this file to .env and update with your actual values

NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_username
PGPASSWORD=your_db_password
PGDATABASE=your_db_name

# Security Keys (Generate new ones for production)
JWT_SECRET=your-64-character-random-secret-key-here
SESSION_SECRET=your-64-character-random-session-secret-here

# Optional: HTTPS Configuration
# HTTPS=true
# SSL_CERT_PATH=/path/to/cert.pem
# SSL_KEY_PATH=/path/to/private.key
EOF

# Create .htaccess for production
echo "🌐 Creating web server configuration..."
cat > .htaccess << 'EOF'
# Pathak Bhandar Web Server Configuration

# Redirect to HTTPS (uncomment for production)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Node.js application
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /app.js [L]

# Security Headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# HTTPS Security (uncomment for production with SSL)
# Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Cache Control for Static Assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$">
    ExpiresActive on
    ExpiresDefault "access plus 1 month"
    Header set Cache-Control "public, max-age=2592000"
</FilesMatch>

# Compress Text Files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Protect Sensitive Files
<FilesMatch "\.(env|log|sql|md|ts|tsx)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect Node Modules
<IfModule mod_rewrite.c>
    RewriteRule ^node_modules/ - [F,L]
</IfModule>
EOF

# Set file permissions
echo "🔒 Setting file permissions..."
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.json" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 644 .htaccess
chmod 600 .env.template

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "Next Steps:"
echo "1. Copy .env.template to .env and update with your database credentials"
echo "2. Run the database initialization script in your PostgreSQL database"
echo "3. Configure Node.js application in cPanel with startup file: app.js"
echo "4. Add environment variables to cPanel Node.js app configuration"
echo "5. Start the application through cPanel interface"
echo ""
echo "For detailed instructions, see: README-CPANEL-DEPLOYMENT.md"