# Backend

This section covers the backend architecture, API endpoints, and business logic.

## Folder Structure

The backend code is located in the `server/` directory and is organized as follows:

- **`index.ts`**: The entry point of the Express.js server. It initializes the app, sets up middleware, and starts the server.
- **`routes.ts`**: This file defines all the API endpoints for the application.
- **`db.ts`**: Establishes the connection to the SQLite database using Drizzle ORM.
- **`storage.ts`** & **`sqlite-storage.ts`**: Defines the interface and implementation for all database operations.
- **`seed.ts`**: A script for populating the database with initial data.

## API Endpoints

- Link to the [API reference](./api/README.md).
