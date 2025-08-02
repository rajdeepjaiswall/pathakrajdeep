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
- **Authentication System**: Session-based authentication with express-session and PostgreSQL storage, multi-role (Customer, Admin, Super Admin) with bcrypt hashing, role-based access control, and Google OAuth integration. Transitioned from JWT tokens to pure server-side sessions with 1-hour expiry and secure cookie configuration.
- **Product Management**: Hierarchical category system, comprehensive product catalog with images, pricing, inventory, GST integration, and branded image fallback system.
- **E-commerce Features**: Persistent shopping cart, wishlist, full order management lifecycle, address management, and UPI QR code payment integration.
- **Admin Dashboard**: Comprehensive order, product, customer, and banner management, with basic sales and inventory reporting.
- **PWA Installation**: Prominent install options in side menu and floating button with persistent red dot indicators, encouraging app installation for better user experience.
- **Categories Page**: Modern horizontal hero banners with blur effects, scroll-triggered bottom navigation, and clean layout following PDF specifications with large logo, intro text, and stacked category banners.
- **Feedback System**: Complete review system with order-based validation (only delivered product buyers can review), 160-word limit, 5-star rating system, admin management with replies and featured review selection, homepage carousel showcase with smooth animations.
- **Data Flow**: JWT-based user authentication, category-based product display, user-specific shopping carts, and order processing with inventory updates.
- **UI/UX Decisions**: Focus on a custom design system with Tailwind CSS and Radix UI for a consistent and premium look, with branded fallbacks for failed images.

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
- OpenAI API (for enhanced search with AI translation - optional)

## Recent Changes & Authentication Migration (August 2025)

### JWT to Session-Based Authentication Migration
- **Complete JWT Removal**: Eliminated all JWT token dependencies (jsonwebtoken, cookie-parser packages)
- **Session-Only Authentication**: Migrated to pure express-session with PostgreSQL storage
- **Session Configuration**: 1-hour session expiry, httpOnly and secure cookies in production
- **Authentication Middleware**: Updated all auth middleware to use req.session.user instead of JWT tokens
- **Client-Side Updates**: Modified auth functions to use session cookies with credentials: 'include'
- **Google OAuth Integration**: Updated Google OAuth callback to create sessions instead of JWT tokens

### Environment Variables Required for Deployment
- **DATABASE_URL**: PostgreSQL connection string (critical)
- **SESSION_SECRET**: Express session encryption (critical)
- **OPENAI_API_KEY**: AI search functionality (optional)
- **NODE_ENV**: Set to 'production' for production deployments

### Authentication Flow Changes
- Login/Register: Creates server-side session instead of returning JWT token
- Google OAuth: Creates session on successful authentication callback
- Client Authentication: Uses session cookies automatically, no Authorization headers
- Logout: Destroys server session and clears session cookie

### Deployment Status
✅ Application successfully starts and runs
✅ Database connectivity working
✅ Session-based authentication functional
✅ Search works with/without OpenAI API
✅ All core features operational with sessions