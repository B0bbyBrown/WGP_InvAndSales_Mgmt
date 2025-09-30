# API Documentation

## Overview

The Wheely Good Pizza Tracker API is a RESTful service built with Express.js. All endpoints are available at `http://localhost:5082/api`.

## Authentication

The application runs locally without authentication. All API endpoints are accessible without credentials.

## Common Patterns

### Response Format

Success responses return JSON:

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

Error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Optional detailed error information"
}
```

### Date Handling

- All dates are Unix timestamps (seconds since epoch)
- Stored as INTEGER in SQLite
- Sent as numbers in JSON

### Currency

- All monetary values are in ZAR (South African Rand)
- Stored as REAL in SQLite
- Sent as strings in JSON to preserve precision

## Endpoints

### Cash Sessions

#### GET /api/sessions

List all cash sessions.

#### GET /api/sessions/active

Get currently active session (if any).

#### POST /api/sessions/open

Open a new cash session.

```json
{
  "openingFloat": "100.00",
  "notes": "Morning shift",
  "inventory": [
    {
      "ingredientId": "uuid",
      "quantity": "10.5"
    }
  ]
}
```

#### POST /api/sessions/:id/close

Close an active session.

```json
{
  "closingFloat": "250.00",
  "notes": "End of day",
  "inventory": [
    {
      "ingredientId": "uuid",
      "quantity": "8.2"
    }
  ]
}
```

### Sales

#### GET /api/sales

List all sales. Supports optional `?from` and `?to` date string query parameters to filter by a date range.

#### GET /api/sales/:id/items

Get the line items for a specific sale.

#### POST /api/sales

Create a new sale.

```json
{
  "sessionId": "uuid",
  "paymentType": "CASH",
  "items": [
    {
      "productId": "uuid",
      "qty": 2
    }
  ]
}
```

### Inventory

#### GET /api/ingredients

List all ingredients.

#### GET /api/stock/current

Get the current aggregated stock level for all ingredients.

#### POST /api/ingredients

Create a new ingredient.

```json
{
  "name": "Mozzarella",
  "unit": "kg",
  "lowStockLevel": 5.0
}
```

#### GET /api/stock/low

Get ingredients below low stock level.

#### GET /api/stock/movements

Get stock movements for a specific ingredient, requires `?ingredientId=uuid` query parameter.

#### POST /api/stock/adjust

Adjust stock levels.

```json
{
  "ingredientId": "uuid",
  "quantity": "5.0",
  "note": "Stock count adjustment"
}
```

### Products

#### GET /api/products

List all products.

#### POST /api/products

Create a new product. The `recipe` array is optional.

```json
{
  "name": "Margherita",
  "sku": "PIZ-001",
  "price": "89.99",
  "recipe": [
    {
      "ingredientId": "uuid",
      "quantity": 0.2
    }
  ]
}
```

#### GET /api/products/:id/recipe

Get the recipe for a specific product.

### Purchases

#### GET /api/purchases

List all purchases.

#### POST /api/purchases

Create a new purchase.

```json
{
  "supplierId": "uuid",
  "notes": "Weekly order",
  "items": [
    {
      "ingredientId": "uuid",
      "quantity": "10",
      "totalCost": "450.00"
    }
  ]
}
```

### Suppliers

#### GET /api/suppliers

List all suppliers.

#### POST /api/suppliers

Create a new supplier.

```json
{
  "name": "Food Corp",
  "phone": "+27123456789",
  "email": "orders@foodcorp.com"
}
```

### Expenses

#### GET /api/expenses

List all expenses.

#### POST /api/expenses

Create a new expense.

```json
{
  "label": "Marketing Flyers",
  "amount": "350.00",
  "paidVia": "CARD"
}
```

### Reports

#### GET /api/reports/overview

Get today's KPIs.

#### GET /api/reports/top-products

Get top-selling products. Supports optional `?from` and `?to` date string query parameters to filter by a date range.

#### GET /api/reports/activity

Get recent activity feed. Supports an optional `?limit=N` query parameter.

## Error Codes

- `400` - Bad Request (invalid input)
- `404` - Not Found
- `409` - Conflict (e.g., session already active)
- `500` - Server Error

## Development Tools

### Testing Endpoints

Use tools like:

- cURL
- Postman
- Thunder Client (VS Code)

Example cURL:

```bash
# Get active session
curl http://localhost:5082/api/sessions/active

# Create ingredient
curl -X POST http://localhost:5082/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{"name":"Flour","unit":"kg","lowStockLevel":10}'
```

### Debugging

- All routes log to console
- Check server logs for detailed error information
- Use browser dev tools Network tab
