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
- **Profile Completion**: Fixed profile completion flow with session-based authentication and red dot notifications for incomplete profiles
- **Database Schema**: Resolved profile_completed column issue in users table for Google OAuth users

### July 25, 2025 - Google OAuth Authentication & Navigation Fixes
Resolved critical authentication and navigation issues:
- **Authentication Error Fix**: Fixed Google OAuth profile completion authentication errors by properly extracting user IDs from session data
- **Session Handling**: Enhanced authentication middleware to correctly handle both Google OAuth session-based auth and JWT token auth
- **Navigation Enhancement**: Added "Back to Store" and "Go to Cart" navigation buttons to all account pages (Profile, Orders, Wishlist, Account)
- **Profile Completion Redirect**: Changed redirect after profile completion/skip to home page (/) instead of /account
- **Checkout Authentication**: Updated checkout page to redirect to home with toast notification instead of non-existent /login page
- **Error Logging**: Added console logging for debugging authentication issues in profile completion and skip flows

### July 31, 2025 - Complete Order Management System with Delivery Agent Features
Implemented comprehensive order management system with advanced features:
- **Enhanced Order Schema**: Added delivery agent fields (riderName, riderPhone, riderImage) and estimatedDelivery timestamp
- **Order Status Progression**: Updated status flow to (pending → getting_ready → packed → dispatched → shipped → delivered)
- **Admin Dashboard Enhancement**: Complete delivery agent management with photo upload support and contact details
- **Estimated Delivery Management**: Added datetime picker for admins to set and update delivery expectations
- **Order Cancellation Rules**: Implemented business logic allowing cancellation only until "getting_ready" status
- **Authentication Fix**: Resolved checkout authentication errors using optionalAuth middleware for both JWT and Google OAuth users
- **API Endpoints**: Added `/api/admin/orders/:id/rider` and `/api/admin/orders/:id/delivery-time` endpoints
- **Storage Methods**: Implemented `updateOrderRider` and `updateOrderDeliveryTime` methods with proper database integration
- **Order Confirmation Enhancement**: Updated confirmation page with green success indicators and current status display
- **Database Schema Sync**: Successfully pushed all schema changes to PostgreSQL database

### July 31, 2025 - Enhanced Address Management System
Implemented comprehensive address management with Google Maps integration:
- **Complete Profile Enhancement**: Redesigned complete-profile page with sectioned layout for personal info and address details
- **Google Maps Integration**: Added GooglePlacesInput component with landmark search using postal API for nearby location suggestions
- **PIN Code Auto-population**: Implemented automatic city/state population when user enters 6-digit PIN code using postal API
- **Current Location Support**: Added geolocation functionality to auto-fill address fields with user's current location
- **Multiple Address Support**: Enhanced backend with full CRUD operations for user addresses with default address management
- **Pre-filled Google Data**: Profile completion form auto-populates name and email from Google OAuth profile
- **Enhanced Validation**: Added comprehensive form validation for phone numbers (Indian format) and PIN codes
- **Address API Endpoints**: Created complete REST API for address management (/api/addresses) with proper authentication
- **UI/UX Improvements**: Added visual sections, loading states, and helpful text to guide users through profile completion
- **Security Features**: Implemented address ownership verification and proper authentication for all address operations

### July 31, 2025 - Complete Checkout System Fix & Rider Communication Enhancement
Fixed critical checkout issues and implemented enhanced customer-rider communication:
- **Database Schema Fix**: Added missing rider_image and estimated_delivery columns to orders table using direct SQL ALTER statements
- **API Parameter Fix**: Corrected apiRequest function parameter order (method, url, data) across all checkout, admin, and customer pages
- **Enhanced Order Confirmation**: Updated confirmation page with dynamic status display, rider information with photos, and estimated delivery times
- **Smart Button Logic**: Implemented dynamic button switching - Cancel button for pending orders, Call Rider button once order progresses beyond cancellation window
- **Rider Communication**: Added direct phone call functionality with rider name and contact details prominently displayed
- **Business Logic Implementation**: Order cancellation restricted to "pending" status only, with clear rejection charge warnings
- **Comprehensive Logging**: Added detailed client and server-side logging for order processing debugging
- **UI/UX Enhancement**: Added green success indicators, company logo display, and clear status progression messaging
- **Customer Experience**: Seamless transition from order placement to rider communication with appropriate messaging about cancellation policies

### July 31, 2025 - Audio Notifications & Previously Ordered Product Tracking
Implemented comprehensive notification system and order history tracking:
- **Success Chime**: Added pleasant Web Audio API-generated chime for successful order placement (customer-side)
- **Admin Notifications**: 3-second alert chime system for new incoming orders in admin dashboard with toast notifications
- **Previously Ordered Products**: Complete backend and frontend system to track and display products user has ordered before
- **Product Badging**: Visual "Previously Ordered" badges with green styling and rotation icon on product cards
- **Audio Context Management**: Proper browser audio context initialization for optimal sound compatibility
- **Order History Integration**: Real-time tracking of user's purchase history linked to product display system
- **Cart Clearing**: Products automatically removed from cart after successful order placement
- **Visual Feedback**: Enhanced user experience with audio cues for order confirmation and admin order management

### July 21, 2025 - Cloud Run Deployment Fixes
Applied comprehensive Cloud Run compatibility improvements:
- **Port Configuration**: Updated server to properly use PORT environment variable with fallback to 5000
- **Host Binding**: Changed to always use `0.0.0.0` instead of conditional localhost for cloud compatibility  
- **Health Check Endpoint**: Added `/health` endpoint that returns JSON status and timestamp for container health monitoring
- **CORS Configuration**: Simplified CORS headers for production deployment with support for Replit domains
- **Environment Detection**: Improved NODE_ENV-based conditional logic for development vs production modes
- **Build Verification**: Confirmed production build works correctly with all fixes applied

These changes resolve the "Application may not be listening on the correct port" deployment failure and ensure proper Cloud Run compatibility.