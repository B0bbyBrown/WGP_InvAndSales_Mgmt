# Getting Started

This section provides instructions on how to set up the Wheely Good Pizza Tracker locally for development and testing.

## Prerequisites

- **Node.js**: Version 20.x or greater. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Should be installed with Node.js.

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Application

There are two ways to start the development server:

1. **Normal Start** - Uses existing database if present:

   ```bash
   npm run dev
   ```

2. **Reset Start** - Resets database to clean slate:
   ```bash
   npm run dev:reset
   ```

The application will be available at `http://localhost:5082`.

## Database Setup

This application uses a local SQLite database for simplicity and portability:

- The database file, `pizza-truck.db`, is created automatically in the project root
- All tables are created automatically on first run
- Only an admin user is seeded - all other data must be added through the UI
- The database file can be safely deleted to start fresh

### Default Admin Credentials

- Email: admin@pizzatruck.com
- Password: password

## Data Setup Order

When starting with a fresh database, add data in this order:

1. **Suppliers** - Add your ingredient suppliers
2. **Ingredients** - Add ingredients with units and low stock levels
3. **Products** - Add products (e.g., pizzas, drinks)
4. **Recipes** - Link products to their required ingredients
5. **Purchases** - Make initial stock purchases
6. **Cash Sessions** - Start sessions to track sales

## Development Commands

- `npm run dev` - Start development server with existing database
- `npm run dev:reset` - Start fresh with a new database
- `npm run build` - Build for production
- `npm run check` - Run TypeScript checks

## Project Structure

- `client/` - React frontend
  - `src/components/` - UI components
  - `src/pages/` - Page components
  - `src/lib/` - Utilities and API client
- `server/` - Express backend
  - `db.ts` - Database setup
  - `routes.ts` - API routes
  - `seed.ts` - Database seeding
  - `sqlite-storage.ts` - SQLite implementation
- `shared/` - Shared TypeScript types and schemas
  - `schema.ts` - Database schema and Zod validations

## Environment Variables

For local development, no `.env` file is required. The application uses these defaults:

- `PORT=5082` - Server port
- `SESSION_SECRET=dev-secret` - Development session secret
- `NODE_ENV=development` - Environment setting
