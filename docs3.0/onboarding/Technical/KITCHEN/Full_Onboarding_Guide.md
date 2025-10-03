# Technical Kitchen Guide

## Role
KITCHEN: View-only for many, write for prep.

## Flows
- Status updates: PATCH /api/sale-items/:id.
- Inventory: server/lib/fifo.ts for consumption.

## Tech Stack
- Frontend: React, Shadcn UI.
- Backend: Express, Drizzle.
