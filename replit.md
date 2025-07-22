# Pathak Bhandar E-Commerce Platform

## Overview

Pathak Bhandar is a comprehensive e-commerce platform built for a premium bakery and confectionery store in Prayagraj, Uttar Pradesh. The platform serves as both a customer-facing storefront and a complete administrative dashboard for managing products, orders, and business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with custom theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Technology**: Node.js with Express.js
- **Language**: TypeScript for type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **API Design**: RESTful API with structured error handling

### Database Strategy
The application supports dual database configurations:
- **Development/Cloud**: PostgreSQL with Neon serverless
- **Production/cPanel**: MySQL for shared hosting compatibility
- **Schema Management**: Separate schema files for each database type
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Authentication System
- **Multi-role authentication**: Customer, Admin, Super Admin roles
- **JWT-based sessions**: Secure token management
- **Password security**: bcrypt hashing with salt rounds
- **Role-based access control**: Route protection based on user roles

### Product Management
- **Category system**: Hierarchical product categorization
- **Product catalog**: Rich product information with images, pricing, and inventory
- **Stock management**: Real-time inventory tracking
- **GST integration**: Indian tax calculation with HSN codes
- **Image handling**: Multiple product images with gallery support

### E-commerce Features
- **Shopping cart**: Persistent cart with user authentication
- **Wishlist**: Product wishlist functionality
- **Order management**: Complete order lifecycle tracking
- **Address management**: Multiple shipping addresses per user
- **Payment integration**: UPI QR code generation support

### Admin Dashboard
- **Order management**: Order status tracking and updates
- **Product management**: CRUD operations for products and categories
- **Customer management**: User account administration
- **Banner management**: Dynamic banner/slideshow content
- **Analytics**: Basic sales and inventory reporting

## Data Flow

1. **User Authentication**: JWT tokens stored in localStorage, validated on each API request
2. **Product Display**: Category-based product filtering with real-time inventory
3. **Shopping Cart**: User-specific cart items with product relationship joins
4. **Order Processing**: Cart to order conversion with inventory updates
5. **Admin Operations**: Role-based access to management endpoints

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives with Tailwind CSS
- **Backend**: Express.js with various middleware
- **Database**: Drizzle ORM with PostgreSQL/MySQL drivers
- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: Zod for schema validation

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast build tool and development server
- **ESBuild**: Production bundling
- **Drizzle Kit**: Database migration management

### Database Drivers
- **PostgreSQL**: Neon serverless driver for cloud deployment
- **MySQL**: mysql2 driver for cPanel hosting compatibility

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reload
- **Database**: PostgreSQL with Neon serverless
- **Environment**: Development-specific configurations

### Production Deployment Options

#### Option 1: Replit Deployment (Current Choice)
- **Target**: Replit Deployments with custom domain support
- **Database**: PostgreSQL with Neon serverless (existing)
- **Configuration**: 1 vCPU, 2GB RAM, 22 compute units/sec
- **Custom Domain**: DNS configuration through domain registrar
- **SSL**: Automatic HTTPS with free certificates

#### Option 2: Unified Deployment (Alternative)
- **Target**: cPanel hosting with Node.js support
- **Database**: MySQL for shared hosting compatibility
- **Entry Point**: `app.js` with automatic TypeScript compilation
- **Configuration**: Environment-specific database connections

#### Option 3: Cloud Deployment
- **Target**: Render, Heroku, or similar cloud platforms
- **Database**: PostgreSQL with Neon serverless
- **Build Process**: Vite build with esbuild bundling
- **Configuration**: Environment variables for database and JWT secrets

### Configuration Management
- **Environment Variables**: Separate configs for development and production
- **Database URLs**: Dynamic connection strings based on environment
- **Security**: JWT and session secrets for authentication
- **Assets**: Static file serving for product images and banners

The architecture prioritizes flexibility, allowing deployment to various hosting environments while maintaining type safety and development experience quality.

## Recent Changes

### July 21, 2025 - Custom Domain Setup with Hostinger
Successfully configured custom domain connection:
- **DNS Configuration**: Set up A record pointing to Replit IP (34.111.179.208) in Hostinger DNS
- **Domain Verification**: Resolved "multiple A records" error by cleaning up conflicting DNS entries
- **SSL Certificate Issue**: Domain verified but SSL certificate shows name mismatch (NET::ERR_CERT_COMMON_NAME_INVALID)
- **Current Status**: Site accessible via HTTP, HTTPS showing certificate error
- **Next Steps**: Regenerating SSL certificate for pathakbhandar.in domain

### July 22, 2025 - Google OAuth Domain Stability Fix
Fixed post-deployment Google OAuth issues:
- **Domain Stability**: Updated OAuth configuration to always use custom domain (pathakbhandar.in) instead of changing Replit domains
- **Redeployment Resilience**: Google Console redirect URIs no longer need updates after each Replit redeployment
- **Error Resolution**: Fixed "Error 400: invalid_request" that occurs when Replit domains change
- **Authentication System**: Completed comprehensive account management with phone verification, address management, and order history
- **Session Handling**: Implemented hybrid authentication supporting both JWT and session-based Google OAuth

### July 21, 2025 - Cloud Run Deployment Fixes
Applied comprehensive Cloud Run compatibility improvements:
- **Port Configuration**: Updated server to properly use PORT environment variable with fallback to 5000
- **Host Binding**: Changed to always use `0.0.0.0` instead of conditional localhost for cloud compatibility  
- **Health Check Endpoint**: Added `/health` endpoint that returns JSON status and timestamp for container health monitoring
- **CORS Configuration**: Simplified CORS headers for production deployment with support for Replit domains
- **Environment Detection**: Improved NODE_ENV-based conditional logic for development vs production modes
- **Build Verification**: Confirmed production build works correctly with all fixes applied

These changes resolve the "Application may not be listening on the correct port" deployment failure and ensure proper Cloud Run compatibility.