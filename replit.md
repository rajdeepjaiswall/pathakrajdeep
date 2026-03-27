# Pathak Bhandar E-Commerce Platform

## Overview
Pathak Bhandar is a comprehensive e-commerce platform designed for a premium bakery and confectionery store. It features a customer-facing storefront and a complete administrative dashboard. The platform aims to streamline product, order, and business operations for the bakery.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with custom theming
- **Build Tool**: Vite

### Backend Architecture
- **Technology**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: JWT tokens with bcrypt
- **API Design**: RESTful API

### Database Strategy
Supports dual database configurations:
- **Development/Cloud**: PostgreSQL with Neon serverless
- **Production/cPanel**: MySQL
- **Schema Management**: Separate schema files for each database type
- **Migrations**: Drizzle Kit

### Key Features & Implementations
- **Authentication System**: Multi-role (Customer, Admin, Super Admin) authentication with JWTs and bcrypt hashing, hybrid authentication middleware supporting both JWT and session-based auth for Google OAuth compatibility.
- **Product Management**: Hierarchical category system, comprehensive product catalog with images, pricing, inventory, GST integration, and image handling.
- **E-commerce Features**: Persistent shopping cart, wishlist, full order management lifecycle, address management, and UPI QR code payment integration.
- **Admin Dashboard**: Comprehensive order, product, customer, and banner management, with basic sales and inventory reporting.
- **Video Banner System**: Enhanced banner management with video upload capabilities, auto-play functionality, smart carousel timing (30-second delay after video ends), progress tracking, and file optimization.
- **Phone Verification System**: SMS-based OTP verification for customer phone numbers during checkout using Fast2SMS API, with verification badges, resend functionality, and order confirmation SMS with tracking links.
- **Manual QR/UPI Payment System**: Complete payment verification flow with:
  - Admin-configurable QR code and UPI details (admin/payments page)
  - Multi-step checkout: Address → Payment Method → Payment Waiting → Confirmation
  - Customer UTR submission for payment verification
  - Admin dashboard for pending payment verification (approve/reject)
  - Payment statuses: pending_payment, payment_success, payment_failed
  - WhatsApp support integration for failed payments
  - Database tables: manual_payment_config, manual_payment_details
- **New Homepage Sections**: Admin-controlled homepage sections driven by product flags:
  - **Trending in Prayagraj**: Products with `isTrending=true` shown in a ranked carousel with #1, #2, #3 badges
  - **Product of the Day**: Single product with `isProductOfDay=true` shown in a hero banner with add-to-cart
  - **Chef Editorial Picks**: Products with `isChefSpecial=true` shown in a premium editorial grid with chef hat badge
  - **Customer Testimonials**: Static testimonials section with 5-star ratings
  - Admin toggles for all three flags added to the admin products form
- **SEO Optimization**: Full Open Graph tags, Twitter Card meta, JSON-LD structured data (Bakery schema), keyword meta tags, canonical URL in index.html
- **Data Flow**: JWT-based user authentication, category-based product display, user-specific shopping carts, and order processing with inventory updates.
- **UI/UX Decisions**: Focus on a custom design system with Tailwind CSS and Radix UI for a consistent and premium look.

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Backend**: Express.js, jsonwebtoken, bcrypt
- **Database**: Drizzle ORM, PostgreSQL driver (Neon serverless), mysql2
- **Validation**: Zod

### Development Tools
- TypeScript
- Vite
- ESBuild
- Drizzle Kit

### Other Integrations
- Google Maps API (for address management)
- Postal API (for PIN code auto-population)
- Web Audio API (for audio notifications)
- Fast2SMS API (for OTP verification and order confirmation SMS)
  - Note: User declined Twilio Replit integration, uses Fast2SMS directly with API key stored in secrets
  - Configuration: FAST2SMS_API_KEY environment variable
  - DLT Template: ID 206901, Sender ID GETDON, Format: CustomerName|OTP
  - DLT Content Template ID: 1207176761125931947

## Deployment

### cPanel Deployment
A comprehensive deployment guide is available in `CPANEL_DEPLOYMENT_GUIDE.md` covering:
- MySQL database setup via phpMyAdmin
- File upload via File Manager
- Node.js app configuration
- Environment variables setup
- SSL certificate installation
- Complete SQL schema available in `database-schema-mysql.sql`

### Database Migration Path
- **Replit/Development**: Uses PostgreSQL (Neon) with `shared/schema.ts`
- **cPanel/Production**: Uses MySQL with `shared/schema-mysql.ts`
- Both schemas are maintained in parallel for dual deployment support