# Technical Cashier Guide

## Role Limits
Role: CASHIER, guarded in App.tsx.

## Key Flows
- Sessions: Open/close via POST /api/sessions.
- Sales: client/src/pages/sales.tsx, consumes inventory via server/lib/fifo.ts.

## Implementation
- Queries: useQuery in pages.
- Mutations: Tanstack Query.
