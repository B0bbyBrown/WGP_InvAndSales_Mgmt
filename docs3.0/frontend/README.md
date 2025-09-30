# Frontend Documentation

## Overview

The Wheely Good Pizza Tracker frontend is built with React, Vite, and modern web technologies. It provides a responsive, accessible interface for managing pizza operations.

## Technology Stack

- **React**: UI library
- **Vite**: Build tool and dev server
- **TanStack Query**: Data fetching and caching
- **Radix UI**: Accessible component primitives
- **Wouter**: Lightweight routing
- **TypeScript**: Type safety

## Project Structure

```
client/src/
├── components/        # Reusable UI components
│   ├── Layout.tsx    # Main layout wrapper
│   ├── Dialog.tsx    # Modal dialogs
│   └── ...
├── pages/            # Route components
│   ├── dashboard.tsx # Dashboard view
│   ├── sessions.tsx  # Cash session management
│   ├── sales.tsx    # Sales processing
│   └── ...
├── lib/             # Utilities and services
│   ├── api.ts       # API client
│   ├── format.ts    # Formatting utilities
│   └── queryClient.ts # Query configuration
└── App.tsx          # Root component
```

## Key Components

### Layout (`components/Layout.tsx`)

Main application layout providing:

- Navigation
- Active session display
- Date range selection
- Responsive design

```typescript
interface LayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

### Dialog (`components/Dialog.tsx`)

Accessible modal dialog using Radix UI:

- Form inputs
- Action buttons
- Error handling
- Loading states

## Pages

### Dashboard (`pages/dashboard.tsx`)

Main overview showing:

- Today's KPIs
- Top products
- Recent activity
- Sales trends

### Sessions (`pages/sessions.tsx`)

Cash session management:

- Open/close sessions
- Record cash floats
- Track inventory
- Calculate variances

### Sales (`pages/sales.tsx`)

Sales processing interface:

- Product selection
- Quantity input
- Payment processing
- Receipt preview

### Products (`pages/products.tsx`)

Product management:

- Create/edit products
- Set prices
- Manage recipes
- Toggle availability

### Inventory (`pages/inventory.tsx`)

Stock management:

- Track ingredients
- Record purchases
- Monitor levels
- Adjust stock

## State Management

### TanStack Query

Used for all data fetching:

```typescript
// Example query
const { data: ingredients } = useQuery({
  queryKey: ["ingredients"],
  queryFn: getIngredients,
});

// Example mutation
const mutation = useMutation({
  mutationFn: createIngredient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["ingredients"] });
  },
});
```

### Local State

React's useState for UI state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItems, setSelectedItems] = useState<string[]>([]);
```

## Data Flow

### API Integration

All API calls go through `lib/api.ts`:

```typescript
export const api = {
  // Sessions
  getActiveCashSession: () => apiRequest("GET", "/api/sessions/active"),
  openCashSession: (data: OpenSessionRequest) =>
    apiRequest("POST", "/api/sessions/open", data),

  // Sales
  createSale: (data: NewSale) => apiRequest("POST", "/api/sales", data),

  // ... other endpoints
};
```

### Error Handling

Consistent error handling through `queryClient.ts`:

```typescript
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "An error occurred");
  }

  return res.json();
}
```

## Utilities

### Format (`lib/format.ts`)

Currency and date formatting:

```typescript
export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
```

## Development

### Running the Frontend

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Type Checking

```bash
npm run check
```

## Best Practices

### Component Design

- Use TypeScript for props
- Implement proper error boundaries
- Handle loading states
- Show empty states
- Support keyboard navigation

### Data Fetching

- Use TanStack Query for caching
- Implement optimistic updates
- Handle error states
- Show loading indicators

### Accessibility

- Use semantic HTML
- Include ARIA labels
- Support keyboard navigation
- Test with screen readers
- Follow WCAG guidelines

### Performance

- Lazy load routes
- Memoize expensive calculations
- Optimize re-renders
- Use proper keys in lists

## Testing

### Component Testing

```typescript
import { render, screen } from "@testing-library/react";
import { Layout } from "./Layout";

test("renders layout with title", () => {
  render(<Layout title="Test">Content</Layout>);
  expect(screen.getByText("Test")).toBeInTheDocument();
});
```

### Integration Testing

```typescript
import { renderWithClient } from "../test-utils";
import { Dashboard } from "./Dashboard";

test("displays KPIs", async () => {
  const { findByText } = renderWithClient(<Dashboard />);
  expect(await findByText("Today's Revenue")).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Data Not Updating**

   - Check query invalidation
   - Verify mutation success
   - Check network requests

2. **Type Errors**

   - Update shared types
   - Check API response types
   - Verify prop types

3. **Performance Issues**
   - Check unnecessary re-renders
   - Verify query configurations
   - Review component memoization

### Development Tools

- React DevTools
- Network Inspector
- TypeScript Language Service
- ESLint
- Chrome Lighthouse
