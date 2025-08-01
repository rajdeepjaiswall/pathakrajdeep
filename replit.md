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
- **Authentication System**: Multi-role (Customer, Admin, Super Admin) authentication with JWTs and bcrypt hashing, role-based access control, and Google One Tap integration with automatic profile photo sync.
- **Product Management**: Hierarchical category system, comprehensive product catalog with images, pricing, inventory, GST integration, and branded image fallback system.
- **E-commerce Features**: Persistent shopping cart, wishlist, full order management lifecycle, address management, and UPI QR code payment integration.
- **Admin Dashboard**: Comprehensive order, product, customer, and banner management, with basic sales and inventory reporting.
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