# Overview

This is a full-stack web application built with React (frontend) and Express.js (backend), featuring user authentication, profile management, and a modern dark-themed UI. The application uses PostgreSQL with Drizzle ORM for data persistence and includes features like password reset via email, avatar uploads, and role-based access control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type safety and modern component patterns
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component Library**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system with "new-york" style preset
- Tailwind CSS v4 for utility-first styling with custom theme configuration
- Class Variance Authority (CVA) for managing component variants
- Framer Motion for animations

**State Management**
- TanStack Query (React Query) for server state management, caching, and data fetching
- React Context API for authentication state
- React Hook Form with Zod for form validation

**Design System**
- Custom color scheme with CSS variables for theming
- Dark gradient theme with purple/blue accent colors
- Custom fonts: Outfit for headings, Inter for body text
- Reusable UI components following atomic design principles

## Backend Architecture

**Server Framework**
- Express.js with TypeScript for REST API endpoints
- Node.js HTTP server for production deployment
- Session-based authentication using express-session
- Development hot-reload with tsx

**Authentication & Authorization**
- Session-based authentication with secure HTTP-only cookies
- bcrypt for password hashing (using 10 rounds)
- Role-based access control (admin/client roles)
- Password reset flow with time-limited tokens stored in database
- CSRF protection through session validation

**File Upload System**
- Multer for handling multipart/form-data file uploads
- Sharp for image processing (resize to 256x256, convert to WebP)
- File storage organized by user ID prefix for scalability
- Validation for file types (JPEG, PNG, GIF, WebP) and size limits (5MB max)

**API Design**
- RESTful endpoints under `/api` prefix
- JSON request/response format
- Middleware for authentication, logging, and error handling
- Request body size limits and raw body preservation for webhooks

**Email Service**
- Nodemailer for SMTP email delivery
- HTML email templates for password reset
- Configurable SMTP settings via environment variables

## Database Layer

**ORM & Schema**
- Drizzle ORM for type-safe database queries and migrations
- PostgreSQL as the primary database (via Neon serverless driver)
- Shared schema definitions between frontend and backend using Zod

**Data Model**
- Users table with fields: id, email, password, name, celular, externalId, role, avatar, status, lastActive, createdAt, resetToken, resetTokenExpiry
- UUID primary keys using PostgreSQL's gen_random_uuid()
- Unique constraints on email and externalId (when non-null)
- Timestamp tracking for creation and last activity

**Validation**
- Zod schemas for runtime validation and type inference
- Drizzle-Zod integration for automatic schema generation
- Separate insert/select/update schemas with appropriate field exclusions

## Build & Deployment

**Development Mode**
- Vite dev server on port 5000 for frontend
- Concurrent tsx execution for backend with hot reload
- Source maps enabled for debugging

**Production Build**
- esbuild for backend bundling with selective dependency externalization
- Vite static build output to dist/public directory
- Server serves static files and falls back to index.html for SPA routing
- Bundle optimization: specific dependencies bundled to reduce filesystem calls

**Code Organization**
- Monorepo structure with client/, server/, and shared/ directories
- Path aliases configured: @/ for client, @shared/ for shared code, @assets/ for assets
- TypeScript strict mode enabled across all code

## Development Tools

**Replit Integration**
- Custom Vite plugins for Replit-specific features (cartographer, dev banner, runtime error overlay)
- Meta image plugin for dynamic OpenGraph image URL generation
- Environment detection for Replit-specific functionality

# External Dependencies

## Database
- **Neon Postgres**: Serverless PostgreSQL database accessed via @neondatabase/serverless driver
- **DATABASE_URL**: Connection string required in environment variables

## Email Service
- **SMTP Server**: Configurable email delivery service
- Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM

## Global Webhook & API Authentication
- **Global Webhook**: Sends events to external endpoint for integrations
- **API Key Authentication**: Allows external access to all API routes via API key
- Required environment variables:
  - `GLOBAL_WEBHOOK_URL`: External webhook endpoint URL
  - `GLOBAL_API_KEY`: API key for webhook authentication and global API access

### API Authentication
All API routes accept authentication via:
1. Session-based authentication (browser login)
2. API key authentication via headers:
   - `Authorization: Bearer <GLOBAL_API_KEY>`
   - `X-API-Key: <GLOBAL_API_KEY>`

### Webhook Events
All API requests (GET, POST, PUT, PATCH, DELETE) automatically trigger a webhook to `GLOBAL_WEBHOOK_URL`.

All webhook requests include:
- `Authorization: Bearer <GLOBAL_API_KEY>` header
- `X-API-Key: <GLOBAL_API_KEY>` header
- JSON payload with `event` as first key, followed by request content and `timestamp`

Example payload structure:
```json
{
  "event": "auth.login",
  "email": "user@example.com",
  "password": "...",
  "userId": null,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Event Naming Convention
- `auth.login` - POST /api/auth/login
- `auth.register` - POST /api/auth/register
- `auth.logout` - POST /api/auth/logout
- `users` - GET /api/users
- `users.create` - POST /api/users
- `users.update` - PATCH /api/users/:id
- `users.delete` - DELETE /api/users/:id

#### Recovery Events
- `auth.recovery.check`: Check available recovery methods
- `auth.recovery.request`: Request password recovery

## Password Recovery (Dual Method)
- **Email Recovery**: Uses SMTP configuration to send password reset emails
- **WhatsApp Recovery**: Integrates with global webhook for WhatsApp-based password reset

### Recovery Flow
1. User enters email address
2. System sends webhook with `event=auth.recovery.check` containing: email, celular, external_id
3. Webhook response returns available methods (email and/or whatsapp)
4. User selects preferred recovery method
5. For email: System sends email via SMTP (using SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD)
6. For WhatsApp: System sends webhook with `event=auth.recovery.request` containing: method, email, celular, external_id, userName, token, resetUrl

## Third-Party Libraries

**UI & Styling**
- Radix UI component primitives (~30 packages for dialogs, dropdowns, tooltips, etc.)
- Tailwind CSS with PostCSS for processing
- Lucide React for icons

**Form Management**
- React Hook Form for form state
- Zod for schema validation
- @hookform/resolvers for Zod integration

**Data Fetching**
- TanStack Query for server state management
- Native fetch API with credential support

**Image Processing**
- Sharp for server-side image manipulation

**Date Handling**
- date-fns for date formatting and manipulation with i18n support (pt-BR locale)

**Session Management**
- express-session for session handling
- connect-pg-simple for PostgreSQL session store (referenced in dependencies)

**Security**
- bcrypt for password hashing
- Environment-based session secrets

## Environment Configuration

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `APP_URL`: Base URL for email links
- `SMTP_*`: Email service configuration
- `NODE_ENV`: Development/production mode
- `PORT`: Server port (default 5000)
- `GLOBAL_WEBHOOK_URL`: External webhook endpoint URL (optional)
- `GLOBAL_API_KEY`: API key for webhook and global API authentication (optional)