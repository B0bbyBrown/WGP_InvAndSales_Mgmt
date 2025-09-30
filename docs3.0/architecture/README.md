# Architecture Documentation

## Overview

Wheely Good Pizza Tracker is a modern, offline-first point of sale and inventory management system designed for single-location pizza businesses. The application runs entirely locally, making it resilient to internet outages.

## System Architecture

### Frontend (React + Vite)

- Single-page application (SPA)
- Modern React with hooks
- TanStack Query for data management
- Radix UI for accessible components
- Wouter for lightweight routing

### Backend (Express + TypeScript)

- RESTful API server
- TypeScript for type safety
- Express.js for routing
- Drizzle ORM for database access
- Zod for request validation

### Database (SQLite)

- Local SQLite database
- Single file storage
- ACID compliant
- Zero configuration

## Key Features

### 1. Cash Session Management

- Track business operating periods
- Record opening/closing cash floats
- Link sales to sessions
- Calculate cash variances

### 2. Inventory Management

- FIFO stock tracking
- Automatic COGS calculation
- Low stock alerts
- Stock movement audit trail
- Opening/closing inventory snapshots

### 3. Sales Processing

- Product-based sales
- Multiple payment types
- Real-time inventory updates
- Session-based tracking

### 4. Recipe Management

- Product-ingredient linking
- Automatic stock deduction
- Portion control

### 5. Reporting

- Sales analysis
- Inventory usage
- Cash flow tracking
- Variance analysis

## Data Flow

### 1. Cash Session Flow

```
Open Session
  ↳ Record opening float
  ↳ Record opening inventory
  ↳ Enable sales processing
    ↳ Process sales
    ↳ Update inventory
    ↳ Calculate COGS
Close Session
  ↳ Record closing float
  ↳ Record closing inventory
  ↳ Calculate variances
```

### 2. Sales Flow

```
Create Sale
  ↳ Validate session active
  ↳ Calculate total
  ↳ Process payment
  ↳ Update inventory (FIFO)
  ↳ Calculate COGS
  ↳ Create stock movements
```

### 3. Purchase Flow

```
Create Purchase
  ↳ Record supplier
  ↳ Create inventory lots
  ↳ Update stock levels
  ↳ Create stock movements
```

## Security

- Local-only operation
- No external dependencies
- Simple password protection
- Database file security through OS

## Performance

### Frontend

- React Query caching
- Optimistic updates
- Minimal re-renders
- Code splitting

### Backend

- SQLite connection pooling
- Transaction support
- Efficient FIFO calculations
- Indexed queries

### Database

- Proper indexing
- Foreign key constraints
- Transaction support
- Regular vacuuming

## Development Workflow

### Local Development

1. Start server: `npm run dev`
2. Access UI: `http://localhost:5082`
3. Make changes
4. Test locally

### Database Reset

1. Stop server
2. Delete `pizza-truck.db`
3. Run `npm run dev:reset`

## Future Considerations

### Potential Enhancements

- Multi-location support
- Cloud backup integration
- Mobile app integration
- Kitchen display system
- Customer loyalty system

### Scaling Considerations

- Database migration to PostgreSQL
- Multi-user support
- Real-time updates
- Data synchronization
