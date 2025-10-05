# Help Page Documentation

## Overview

The Help page serves as a quick task helper within the Wheely Good Pizza app. It's designed to assist users by providing searchable, role-specific guides for common tasks, with direct redirects to the relevant app pages. This page is accessible via the sidebar menu and is tailored for non-technical users to quickly find and navigate to what they need.

## Key Features

- **Search Functionality**: Users can type keywords (e.g., "add product") into a search bar to filter available tasks.
- **Role-Based Filtering**: Only tasks relevant to the user's role (ADMIN, CASHIER, or KITCHEN) are shown, ensuring secure and appropriate access.
- **Task Cards**: Each task is displayed as a card with:
  - A title and brief description.
  - A "Go to Task" button that redirects directly to the corresponding page (e.g., /products for adding a product).
- **Expandable Details** (Planned): Each task includes steps, underlying logic, and screenshot placeholders for more in-depth guidance.
- **No Results Message**: If no tasks match the search or role, a helpful message is displayed.

## How It Works

1. Log in and navigate to the Help page from the sidebar.
2. Use the search input to find tasks (e.g., search "process sale" for sales-related help).
3. Browse the filtered task cards.
4. Click "Go to Task" on a card to be redirected to the page where you can perform the action.

The page uses the app's authentication context to determine the user's role and filters tasks accordingly. Tasks are defined in the code with details like steps and redirects.

## Available Tasks (Examples)

- **Add a New Product**: Redirects to /products. For ADMIN and KITCHEN roles.
- **Change Ingredient Measurement/Weight**: Redirects to /inventory. For ADMIN and KITCHEN.
- **Process a Sale**: Redirects to /sales. For ADMIN and CASHIER.

More tasks can be added by expanding the tasks array in the code.

## Role-Based Access

- **ADMIN**: Can see all tasks across roles.
- **CASHIER**: Limited to sales and session-related tasks.
- **KITCHEN**: Focused on inventory, products, and order prep tasks.

## Tips for Users

- This page is ideal for quick reminders—use it alongside the onboarding guides for full context.
- If a task isn't listed, check the search terms or consult an admin for custom help.
- Screenshots (placeholders like "/assets/help/add-product.png") can be added for visual aids.

This page enhances usability by reducing navigation time and providing just-in-time help for daily operations.
